import { supabase } from './supabaseClient'

// משותף לכל bucket פרטי באפליקציה (avatars, task-files): signed URL עם קאש
// בזיכרון לפי (bucket, path), TTL קצר יותר מתוקף ה-URL עצמו כדי שלא נגיש
// URL שכבר פג. options.download מכריח Content-Disposition: attachment
// (חובה על task-files, בכוונה לא על avatars שם תצוגת <img> inline רצויה) -
// זה בדיוק מה שמונע פתיחת SVG/HTML זדוני inline בדפדפן. ראו סקירת שמעון, 24.08.2026.
const SIGN_SECONDS = 3600
const CACHE_TTL_MS = 50 * 60 * 1000
const cache = new Map()

export async function getSignedUrl(bucket, path, { download } = {}) {
  if (!path) return null
  const key = `${bucket}:${path}:${download ? 'dl' : 'inline'}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGN_SECONDS, download ? { download } : undefined)
  if (error) throw error
  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS })
  return data.signedUrl
}

export async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function removeFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
