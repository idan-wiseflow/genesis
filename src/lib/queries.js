import { supabase } from './supabaseClient'

// כל קריאה כאן היא supabase-js גולמי, RLS על השרת הוא האוכף.
// כלל קבוע: לקוחות תמיד דרך clients_view, אף פעם לא embed clients(*) ואף פעם לא
// select ישיר על clients (ה-select על הטבלה הגולמית נשלל מ-authenticated ב-004,
// אז embed ישיר ממילא ייכשל). שם לקוח על משימה נפתר בצד קליינט לפי מיפוי id, לא embed.

// ===== profiles =====
// דרך profiles_view (010), לא מ-profiles הגולמית: email ו-is_disabled
// ממוסכים שם ל-null למי שאינו הנהלה, אותו דפוס בדיוק כמו clients_view.

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles_view').select('*').order('full_name')
  if (error) throw error
  return data
}

// יצירת משתמש עוברת רק דרך ה-Edge Function (service_role חי רק שם, לעולם
// לא בפרונט, ראו tech-decisions.md). supabase-js מצרף אוטומטית את ה-JWT
// של המשתמש המחובר להזמנה, הפונקציה בודקת בעצמה שהוא הנהלה, בלי תלות
// בבדיקת ה-UI (canCreateUsers ב-permissions.js הוא mirror בלבד).
export async function createUser({ email, password, fullName, permissionLevel, roles }) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, full_name: fullName, permission_level: permissionLevel, roles },
  })
  if (error) {
    const message = (await error.context?.json?.().catch(() => null))?.error
    throw new Error(message || error.message)
  }
  return data
}

// עריכת שם/דרג הרשאה/תפקידים למשתמש קיים: UPDATE ישיר, לא Edge Function.
// profiles_update_by_admin (004) כבר מגביל את זה להנהלה בלבד ב-RLS,
// אין כאן שום דבר חדש שדורש service_role. בלי .select(): profiles כן
// פתוחה ל-SELECT (לא כמו clients), אבל שומרים על אותו דפוס בכל הקוד.
export async function updateProfile(userId, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

// ביטול/הפעלה מחדש עוברים רק דרך ה-Edge Function, מאותה סיבה כמו יצירה:
// service_role נדרש כדי לגעת ב-auth.users, ולעולם לא בפרונט.
export async function setUserDisabled(userId, disabled) {
  const { data, error } = await supabase.functions.invoke('disable-user', {
    body: { user_id: userId, disabled },
  })
  if (error) {
    const message = (await error.context?.json?.().catch(() => null))?.error
    throw new Error(message || error.message)
  }
  return data
}

// ===== clients (דרך clients_view בלבד) =====

export async function listClients() {
  const { data, error } = await supabase.from('clients_view').select('*').order('name')
  if (error) throw error
  return data
}

export async function getClient(clientId) {
  const { data, error } = await supabase.from('clients_view').select('*').eq('id', clientId).single()
  if (error) throw error
  return data
}

// כתיבה בלי .select() בכוונה: authenticated אין לו SELECT על clients הגולמית
// (revoke מפורש ב-004, כדי לאלץ קריאה רק דרך clients_view). INSERT/UPDATE עם
// RETURNING (מה ש-.select() אחרי כתיבה מייצר) דורש SELECT על הטבלה גם אם
// הכתיבה עצמה מותרת, ונופל על "permission denied for table clients".
// השורה נקראת בחזרה דרך getClient (clients_view), לא RETURNING.

export async function createClient(payload) {
  const id = crypto.randomUUID()
  const { error } = await supabase.from('clients').insert({ id, ...payload })
  if (error) throw error
  return getClient(id)
}

export async function updateClient(clientId, patch) {
  const { error } = await supabase.from('clients').update(patch).eq('id', clientId)
  if (error) throw error
  return getClient(clientId)
}

// לוג בלתי-ניתן-לזיוף (016): נכתב רק ע"י טריגר SECURITY DEFINER על clients,
// קריאה בלבד דרך client_field_history_view (ממסכת שדות כספיים, כמו clients_view).
export async function listClientFieldHistory(clientId) {
  const { data, error } = await supabase
    .from('client_field_history_view')
    .select('*')
    .eq('client_id', clientId)
    .order('changed_at', { ascending: false })
  if (error) throw error
  return data
}

// ===== tags =====

export async function listTags() {
  const { data, error } = await supabase.from('tags').select('*').order('name')
  if (error) throw error
  return data
}

// בלי RETURNING, מאותה סיבה כמו clients/tasks למעלה (בדיקה חיה, 24.08.2026).
export async function createTag(name, createdBy) {
  const id = crypto.randomUUID()
  const { error } = await supabase.from('tags').insert({ id, name, created_by: createdBy })
  if (error) throw error
  const { data, error: readError } = await supabase.from('tags').select('*').eq('id', id).single()
  if (readError) throw readError
  return data
}

// ===== tasks =====

export async function listTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function listMyOpenTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', userId)
    .neq('status', 'פורסם')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function listClientTasks(clientId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getTask(taskId) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  if (error) throw error
  return data
}

// כתיבה בלי .select() בכוונה: RETURNING אחרי INSERT/UPDATE דורש שהשורה תעבור
// גם את בדיקת tasks_select (can_view_task) באותה נשימה עם WITH CHECK של הכתיבה,
// ונופל על 403 "row-level security policy" גם כשההרשאה בפועל תקינה (נצפה בדיקה
// חיה 24.08.2026: הנהלה, policy תקין, ועדיין 403 על POST עם ?select=*).
// אותו דפוס בדיוק כמו ב-clients (ראו למעלה), השורה נקראת בחזרה דרך getTask.

export async function createTask(payload) {
  const id = crypto.randomUUID()
  const { error } = await supabase.from('tasks').insert({ id, ...payload })
  if (error) throw error
  return getTask(id)
}

export async function updateTask(taskId, patch) {
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId)
  if (error) throw error
  return getTask(taskId)
}

// ===== task_tags =====

export async function listTaskTagIds(taskId) {
  const { data, error } = await supabase.from('task_tags').select('tag_id').eq('task_id', taskId)
  if (error) throw error
  return data.map((row) => row.tag_id)
}

export async function attachTag(taskId, tagId) {
  const { error } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })
  if (error) throw error
}

export async function detachTag(taskId, tagId) {
  const { error } = await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
  if (error) throw error
}

// ===== task_files (006) =====
// file_url מחזיק נתיב אחסון, לא URL (bucket פרטי, ראו lib/taskFiles.js).

export async function listTaskFiles(taskId) {
  const { data, error } = await supabase
    .from('task_files')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// מזהה נוצר בצד לקוח (כמו createClient/createTask/createTag), לא RETURNING -
// כדי שהקוד הקורא ידע את ה-id האמיתי בלי לסמוך על ברירת המחדל של הטבלה.
export async function addTaskFile(taskId, userId, path, fileName) {
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('task_files')
    .insert({ id, task_id: taskId, file_url: path, file_name: fileName, uploaded_by: userId })
  if (error) throw error
  return id
}

export async function deleteTaskFile(fileId) {
  const { error } = await supabase.from('task_files').delete().eq('id', fileId)
  if (error) throw error
}

// ===== task_comments =====

export async function listTaskComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// בלי RETURNING, מאותה סיבה כמו clients/tasks/tags למעלה (בדיקה חיה, 24.08.2026).
export async function addTaskComment(taskId, userId, text) {
  const id = crypto.randomUUID()
  const { error } = await supabase.from('task_comments').insert({ id, task_id: taskId, user_id: userId, text })
  if (error) throw error
  const { data, error: readError } = await supabase.from('task_comments').select('*').eq('id', id).single()
  if (readError) throw readError
  return data
}

// ===== task_status_history (007, לקריאה בלבד - הכתיבה כולה דרך הטריגרים) =====

export async function listTaskStatusHistory(taskId) {
  const { data, error } = await supabase
    .from('task_status_history')
    .select('*')
    .eq('task_id', taskId)
    .order('changed_at', { ascending: true })
  if (error) throw error
  return data
}

// ===== פרופיל עצמי (008/009) =====

export async function updateOwnProfile(fullName, avatarPath) {
  const { error } = await supabase.rpc('update_own_profile', {
    new_full_name: fullName,
    new_avatar_url: avatarPath ?? null,
  })
  if (error) throw error
}
