import { supabase } from './supabaseClient'

// חבילות, פאזה 2 (011). package_definitions הוא versioned: כל עריכה יוצרת שורה
// חדשה (create_package_version RPC), הישנה נשארת קפואה לצמיתות (נאכף בטריגר
// ב-DB, לא רק כאן). תמיד עובדים מול is_current=true אלא אם מפורש אחרת.

// ===== departments =====

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createDepartment(name) {
  const { error } = await supabase.from('departments').insert({ name })
  if (error) throw error
}

export async function renameDepartment(id, name) {
  const { error } = await supabase.from('departments').update({ name }).eq('id', id)
  if (error) throw error
}

// ===== work_stages (014, טבלה דינמית במקום enum) =====

export async function listWorkStages() {
  const { data, error } = await supabase.from('work_stages').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createWorkStage(name) {
  const { error } = await supabase.from('work_stages').insert({ name })
  if (error) throw error
}

export async function renameWorkStage(id, name) {
  const { error } = await supabase.from('work_stages').update({ name }).eq('id', id)
  if (error) throw error
}

// ===== package_definitions (גרסה נוכחית בלבד) =====

export async function listCurrentPackages() {
  const { data, error } = await supabase
    .from('package_definitions')
    .select('*')
    .eq('is_current', true)
    .order('name')
  if (error) throw error
  return data
}

export async function listPackageTemplates(packageDefinitionId) {
  const { data, error } = await supabase
    .from('package_task_templates')
    .select('*')
    .eq('package_definition_id', packageDefinitionId)
    .order('sort_order')
  if (error) throw error
  return data
}

// שומר חבילה: יוצר גרסה חדשה דרך ה-RPC (never UPDATE ישיר, הטריגר ב-DB
// היה חוסם את זה בכל מקרה על גרסה קודמת), ואז מכניס את רשימת התבניות
// לגרסה החדשה. שני שלבים, לא טרנזקציה אחת: אם השלב השני נכשל בחלקו,
// הגרסה הישנה עדיין שלמה ובטוחה, המשתמש פשוט מנסה שוב.
export async function savePackageVersion({ groupId, name, departmentId, isBundle, templates }) {
  const { data: newId, error: rpcError } = await supabase.rpc('create_package_version', {
    p_group_id: groupId ?? null,
    p_name: name,
    p_department_id: departmentId || null,
    p_is_bundle: isBundle,
  })
  if (rpcError) throw rpcError

  if (templates.length > 0) {
    const rows = templates.map((t, i) => ({
      package_definition_id: newId,
      work_stage_id: t.work_stage_id,
      task_name: t.task_name,
      description: t.description || null,
      quantity: t.quantity,
      frequency: t.frequency,
      sort_order: i,
    }))
    const { error: templatesError } = await supabase.from('package_task_templates').insert(rows)
    if (templatesError) throw templatesError
  }

  return newId
}

// ===== client_packages =====

export async function listClientPackages(clientId) {
  const { data, error } = await supabase
    .from('client_packages')
    .select('*, package_definitions(id, name, department_id, is_bundle)')
    .eq('client_id', clientId)
    .is('ended_at', null)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return data
}

// משייך חבילה חדשה. אם ה-department כבר יש לו חבילה פעילה אצל הלקוח (שדרוג/
// הורדת רמה), סוגרים אותה קודם (ended_at), לא משאירים שתיים פעילות באותה מחלקה.
export async function assignPackageToClient(clientId, packageDefinitionId, userId, departmentId) {
  if (departmentId) {
    const { data: existing, error: findError } = await supabase
      .from('client_packages')
      .select('id, package_definitions!inner(department_id)')
      .eq('client_id', clientId)
      .is('ended_at', null)
      .eq('package_definitions.department_id', departmentId)
    if (findError) throw findError
    if (existing.length > 0) {
      const { error: endError } = await supabase
        .from('client_packages')
        .update({ ended_at: new Date().toISOString() })
        .in('id', existing.map((row) => row.id))
      if (endError) throw endError
    }
  }

  const { error } = await supabase
    .from('client_packages')
    .insert({ client_id: clientId, package_definition_id: packageDefinitionId, assigned_by: userId })
  if (error) throw error
}

export async function endClientPackage(clientPackageId) {
  const { error } = await supabase
    .from('client_packages')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', clientPackageId)
  if (error) throw error
}

// ===== client_package_task_overrides =====

export async function listClientPackageOverrides(clientPackageId) {
  const { data, error } = await supabase
    .from('client_package_task_overrides')
    .select('*')
    .eq('client_package_id', clientPackageId)
  if (error) throw error
  return data
}

// upsert לפי (client_package_id, package_task_template_id), ה-unique constraint
// הקיים (011) עושה את זה בטוח: אם יש כבר override לאותה תבנית, מתעדכן, לא כפול.
export async function setTaskOverride(clientPackageId, templateId, { quantity, frequency }, userId) {
  const { error } = await supabase
    .from('client_package_task_overrides')
    .upsert(
      {
        client_package_id: clientPackageId,
        package_task_template_id: templateId,
        quantity: quantity ?? null,
        frequency: frequency ?? null,
        created_by: userId,
      },
      { onConflict: 'client_package_id,package_task_template_id' }
    )
  if (error) throw error
}

export async function removeTaskOverride(overrideId) {
  const { error } = await supabase.from('client_package_task_overrides').delete().eq('id', overrideId)
  if (error) throw error
}

// לוג בלתי-ניתן-לזיוף (015): נכתב רק ע"י טריגר SECURITY DEFINER על
// client_package_task_overrides, לא ע"י הקוד הזה. קריאה בלבד.
// לשונית "היסטוריה" ברמת הלקוח (לא פר-כרטיס חבילה, עידן 25.08.2026: "עדיין
// לא רואה את ההיסטוריה בלקוח" - הפכה ללשונית עצמאית בכרטיס הלקוח, כדי שתהיה
// גלויה מיד ולא מקוננת בתוך כל כרטיס חבילה בנפרד). !inner כדי שסינון
// client_packages.client_id יעבוד נכון על ה-embed, כולל חבילות שהוסרו
// (ended_at לא null), כי לוג היסטוריה צריך להישאר שלם גם אחרי הסרה.
export async function listClientPackageHistory(clientId) {
  const { data, error } = await supabase
    .from('client_package_task_override_history')
    .select('*, package_task_templates(task_name), client_packages!inner(client_id, package_definitions(name))')
    .eq('client_packages.client_id', clientId)
    .order('changed_at', { ascending: false })
  if (error) throw error
  return data
}
