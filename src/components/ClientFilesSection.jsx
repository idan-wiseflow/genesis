import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addClientFile, deleteClientFile, listClientFiles } from '../lib/queries'
import { deleteClientFileObject, getClientFileSignedUrl, uploadClientFile } from '../lib/clientFiles'

// קבצים כלליים של לקוח, לא צמודים למשימה ספציפית (019). דנה, 25.08.2026:
// "שלא תהיה לי הצטברות של קבצים... לרכז ידנית קבצים במקום אחד ראשי".
// אותו רכיב FileRow/העלאה בדיוק כמו ב-TaskDetail.jsx, רק מול client_files.
//
// בכוונה בלי prop הרשאה: מי שהגיע לעמוד הזה כבר עבר את can_view_client
// (אחרת getClient היה מחזיר not-found), וה-RLS על client_files (019)
// פתוח לאותו תנאי בדיוק, גם לכתיבה. דנה ביקשה במפורש שהצוות עצמו יעלה.
function FileRow({ file, onDeleted }) {
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getClientFileSignedUrl(file.file_url)
      .then((signed) => active && setUrl(signed))
      .catch(() => active && setUrl(null))
    return () => {
      active = false
    }
  }, [file.file_url])

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteClientFileObject(file.file_url)
      await deleteClientFile(file.id)
      onDeleted(file.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="file-row">
      <span className="file-ic">📎</span>
      {url ? (
        <a className="file-name" href={url}>
          {file.file_name}
        </a>
      ) : (
        <span className="file-name">{file.file_name}</span>
      )}
      <button type="button" className="tag-remove" onClick={handleDelete} disabled={busy}>
        ✕
      </button>
    </div>
  )
}

export default function ClientFilesSection({ clientId }) {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [uploadBusy, setUploadBusy] = useState(false)
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    listClientFiles(clientId).then(setFiles)
  }, [clientId])

  async function uploadOneFile(file) {
    setUploadBusy(true)
    setFileError('')
    try {
      const path = await uploadClientFile(clientId, file)
      const id = await addClientFile(clientId, user.id, path, file.name)
      setFiles((prev) => [...prev, { id, client_id: clientId, file_url: path, file_name: file.name, uploaded_by: user.id }])
    } catch (err) {
      setFileError(err.message ?? 'העלאה נכשלה')
    } finally {
      setUploadBusy(false)
    }
  }

  async function handleFileInputChange(e) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of selected) {
      await uploadOneFile(file)
    }
  }

  function handleFileDeleted(fileId) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div>
      <div className="file-list">
        {files.map((f) => (
          <FileRow key={f.id} file={f} onDeleted={handleFileDeleted} />
        ))}
        {files.length === 0 && <div className="empty-state">אין קבצים כלליים ללקוח הזה</div>}
      </div>
      <label className="btn-ghost profile-avatar-upload file-upload-trigger">
        {uploadBusy ? 'מעלה...' : 'העלאת קובץ'}
        <input type="file" multiple onChange={handleFileInputChange} disabled={uploadBusy} hidden />
      </label>
      {fileError && <p className="form-error">{fileError}</p>}
    </div>
  )
}
