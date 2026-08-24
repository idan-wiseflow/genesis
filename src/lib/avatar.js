import { getSignedUrl, uploadFile } from './storage'

// avatars הוא bucket פרטי (008), אין URL ישיר. avatar_url בטבלת profiles הוא
// נתיב אחסון ({uid}/filename), לא URL. inline בכוונה (בלי download), כי
// תמונת פרופיל מוצגת בתוך <img>, לא מורדת. חתימה+קאש חיים ב-storage.js
// המשותף (גם ל-task-files).

export async function getAvatarSignedUrl(path) {
  return getSignedUrl('avatars', path)
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
  return uploadFile('avatars', path, file)
}
