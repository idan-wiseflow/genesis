// ג'נסיס, פאזה 1: יצירת משתמש ע"י הנהלה בלבד
// שני קליינטים בכוונה: אחד עם ה-JWT של הקורא (לאמת מי הוא, דרך RLS רגיל),
// אחד עם service_role (רק לפעולת היצירה עצמה). אף פעם לא אותו קליינט לשני התפקידים.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PERMISSION_LEVELS = ['הנהלה', 'מנהל_פרויקט', 'עובד_פנימי', 'פרילנסר']

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'missing authorization' }, 401)
  }

  // קליינט עם ה-JWT של הקורא, לא service_role. הבדיקה "מי אתה" עוברת דרך RLS רגיל,
  // אותה הרשאה בדיוק כאילו הקורא שאל את עצמו "select permission_level from profiles".
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await callerClient.auth.getUser()
  if (userError || !user) {
    return json({ error: 'session לא תקף' }, 401)
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('permission_level')
    .eq('id', user.id)
    .single()

  if (profileError || callerProfile?.permission_level !== 'הנהלה') {
    return json({ error: 'רק הנהלה יכולה ליצור משתמש' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'גוף הבקשה אינו JSON תקין' }, 400)
  }

  const { email, password, full_name, permission_level, roles } = body as {
    email?: string; password?: string; full_name?: string
    permission_level?: string; roles?: string[]
  }

  if (!email || !password || !full_name || !permission_level) {
    return json({ error: 'חסרים שדות חובה: email, password, full_name, permission_level' }, 400)
  }
  if (!PERMISSION_LEVELS.includes(permission_level)) {
    return json({ error: `permission_level לא תקין: ${permission_level}` }, 400)
  }

  // קליינט service_role, רק מכאן ואילך, רק לשתי הפעולות שדורשות אותו בפועל.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser?.user) {
    return json({ error: createError?.message ?? 'יצירת המשתמש נכשלה' }, 400)
  }

  const { error: insertError } = await adminClient.from('profiles').insert({
    id: newUser.user.id,
    full_name,
    email,
    permission_level,
    roles: roles ?? [],
  })

  if (insertError) {
    // בלי זה, כשל ביצירת הפרופיל משאיר auth user יתום בלי profiles, ומחובר לשום דבר
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return json({ error: insertError.message }, 400)
  }

  return json({ id: newUser.user.id }, 200)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
