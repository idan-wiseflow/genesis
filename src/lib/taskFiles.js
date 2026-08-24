import { getSignedUrl, removeFile, uploadFile } from './storage'

// task-files הוא bucket פרטי (006). {task_id}/{uuid}-{filename}, לא
// task-files/{task_id}/{filename}: ה-policy הקיים בודק
// (storage.foldername(name))[1]::uuid ומצפה שהמקטע הראשון יהיה task_id עצמו.
// קידומת "task-files/" הייתה מפילה כל העלאה על שגיאת cast (invalid input
// syntax for type uuid), אותה מלכודת שכבר נתפסה על avatars (009). נמנע
// מראש, נבדק בסקירת שמעון על התוכנית לפני שנכתב, 24.08.2026.
export function taskFileStoragePath(taskId, file) {
  return `${taskId}/${crypto.randomUUID()}-${file.name}`
}

export async function uploadTaskFile(taskId, file) {
  const path = taskFileStoragePath(taskId, file)
  return uploadFile('task-files', path, file)
}

export async function deleteTaskFileObject(path) {
  return removeFile('task-files', path)
}

// download: true כופה Content-Disposition: attachment, לא inline. בלי זה
// SVG/HTML זדוני שמישהו מעלה כ"קובץ מצורף" היה נפתח ורץ בדפדפן במקום
// להוריד. ראו סקירת שמעון על התוכנית, 24.08.2026.
export async function getTaskFileSignedUrl(path) {
  return getSignedUrl('task-files', path, { download: true })
}
