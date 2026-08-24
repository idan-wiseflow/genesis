import { supabase } from './supabaseClient'

// כל קריאה כאן היא supabase-js גולמי, RLS על השרת הוא האוכף.
// כלל קבוע: לקוחות תמיד דרך clients_view, אף פעם לא embed clients(*) ואף פעם לא
// select ישיר על clients (ה-select על הטבלה הגולמית נשלל מ-authenticated ב-004,
// אז embed ישיר ממילא ייכשל). שם לקוח על משימה נפתר בצד קליינט לפי מיפוי id, לא embed.

// ===== profiles =====

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, permission_level, roles')
    .order('full_name')
  if (error) throw error
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

// ===== tags =====

export async function listTags() {
  const { data, error } = await supabase.from('tags').select('*').order('name')
  if (error) throw error
  return data
}

export async function createTag(name, createdBy) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
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

export async function createTask(payload) {
  const { data, error } = await supabase.from('tasks').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateTask(taskId, patch) {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', taskId).select().single()
  if (error) throw error
  return data
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

export async function addTaskComment(taskId, userId, text) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, text })
    .select()
    .single()
  if (error) throw error
  return data
}
