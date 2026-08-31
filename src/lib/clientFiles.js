import { getSignedUrl, removeFile, uploadFile } from './storage'

// client-files הוא bucket פרטי נפרד מ-task-files (019), לא אותו bucket עם
// path שונה: מונע כל אפשרות בלבול בין can_view_client ל-can_view_task ב-
// policy של storage.objects. אותה מוסכמת נתיב בדיוק: {client_id}/{uuid}-{filename}.
export function clientFileStoragePath(clientId, file) {
  return `${clientId}/${crypto.randomUUID()}-${file.name}`
}

export async function uploadClientFile(clientId, file) {
  const path = clientFileStoragePath(clientId, file)
  return uploadFile('client-files', path, file)
}

export async function deleteClientFileObject(path) {
  return removeFile('client-files', path)
}

// download: true, אותה הגנה בדיוק כמו task-files (מונע SVG/HTML זדוני
// שנפתח inline בדפדפן במקום להוריד).
export async function getClientFileSignedUrl(path) {
  return getSignedUrl('client-files', path, { download: true })
}
