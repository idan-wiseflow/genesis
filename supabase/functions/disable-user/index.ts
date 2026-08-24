// ג'נסיס, פאזה 1: ביטול/הפעלה מחדש של משתמש ע"י הנהלה בלבד
// אותו דפוס אבטחה בדיוק כמו create-user: קליינט קורא עם ה-JWT של הקורא
// לאימות מי הוא (RLS רגיל), קליינט service_role רק לפעולת ה-ban עצמה.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Supabase Auth אין לו "ban קבוע" אמיתי, רק משך. ~100 שנה היא הפרקטיקה
// המקובלת לביטוי "לצמיתות, עד שמישהו יבטל את זה במפורש".
const BAN_DURATION = '876000h'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'missing authorization' }, 401)
  }

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
    return json({ error: 'רק הנהלה יכולה לבטל או להפעיל מחדש משתמש' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'גוף הבקשה אינו JSON תקין' }, 400)
  }

  const { user_id, disabled } = body as { user_id?: string; disabled?: boolean }
  if (!user_id || typeof disabled !== 'boolean') {
    return json({ error: 'חסרים שדות חובה: user_id, disabled' }, 400)
  }

  // בלי זה, הנהלה יחידה שמבטלת את עצמה בטעות נועלת את כל המערכת בלי
  // אף אחד שיכול לבטל את הביטול.
  if (user_id === user.id) {
    return json({ error: 'אי אפשר לבטל את המשתמש של עצמך' }, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { error: banError } = await adminClient.auth.admin.updateUserById(user_id, {
    ban_duration: disabled ? BAN_DURATION : 'none',
  })

  if (banError) {
    return json({ error: banError.message }, 400)
  }

  // ban_duration חוסם login חדש מיד, אבל access token שכבר הונפק הוא
  // stateless וממשיך לעבוד עד לפקיעתו (עד שעה) בלי קשר לחסימה. signOut
  // גלובלי מבטל את ה-refresh tokens ומכריח כניסה מחדש, מצמצם את החלון
  // הזה כמה שאפשר. עדיין לא מיידי לחלוטין, ראו סקירת שמעון, 24.08.2026.
  if (disabled) {
    await adminClient.auth.admin.signOut(user_id, 'global')
  }

  return json({ ok: true }, 200)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
