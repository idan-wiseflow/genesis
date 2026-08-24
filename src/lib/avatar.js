import { supabase } from './supabaseClient'

// avatars הוא bucket פרטי (008), אין URL ישיר. avatar_url בטבלת profiles הוא
// נתיב אחסון (avatars/{uid}/filename), לא URL. ה-signed URL נוצר כאן, בזמן
// תצוגה, וזוכר בזיכרון כדי לא לחתום מחדש בכל רינדור של אותו נתיב על אותו מסך.
// TTL קצר יותר מתוקף ה-URL עצמו (שעה), כדי שלא נגיש URL שכבר פג.
const SIGN_SECONDS = 3600
const CACHE_TTL_MS = 50 * 60 * 1000
const cache = new Map() // path -> { url, expiresAt }

export async function getAvatarSignedUrl(path) {
  if (!path) return null
  const cached = cache.get(path)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, SIGN_SECONDS)
  if (error) throw error
  cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS })
  return data.signedUrl
}

// {uid}/{filename}, לא avatars/{uid}/{filename}: bucket_id כבר נותן את השיוך
// ל-bucket בנפרד, ה-policy על storage.objects בודק שהמקטע הראשון כאן הוא ה-uid
// עצמו (ראו 009, תוקן אחרי אי-התאמה בין 008 לבין הפונקציה שמאמתת את הנתיב).
export function avatarStoragePath(userId, file) {
  const ext = file.name.split('.').pop()
  return `${userId}/${crypto.randomUUID()}.${ext}`
}

export async function uploadAvatar(userId, file) {
  const path = avatarStoragePath(userId, file)
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false })
  if (error) throw error
  return path
}
