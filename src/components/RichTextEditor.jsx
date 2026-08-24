import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { signDescriptionHtml, toStoredHtml, uploadDescriptionImage } from '../lib/taskDescriptionImages'

// אותה טכניקה כמו WikiEditor ב-wiseflow-crm: handlePaste/handleDrop של
// Tiptap מזהים תמונה, מעלים ל-storage, ומכניסים node של image ישירות
// למסמך. ההבדל מכאן: אימות סכמת URL עצמאי על קישורים (isSafeUrl), לא
// סומכים רק על גרסת @tiptap/extension-link (ראו סקירת שמעון, 24.08.2026).
function isSafeUrl(url) {
  return /^(https?:|mailto:)/i.test(url.trim())
}

export default function RichTextEditor({ taskId, value, onSave, onCancel }) {
  const [uploadError, setUploadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)

  function reportUploadError() {
    setUploadError('העלאת התמונה נכשלה, נסה שוב')
    setTimeout(() => setUploadError(''), 4000)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ HTMLAttributes: { class: 'desc-img' } }),
      Placeholder.configure({ placeholder: 'תיאור המשימה...' }),
    ],
    content: '',
    editorProps: {
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((i) => i.type.startsWith('image/'))
        if (!imageItem) return false
        event.preventDefault()
        const file = imageItem.getAsFile()
        uploadDescriptionImage(taskId, file).then((url) => {
          if (!url) return reportUploadError()
          view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: url })))
        }, reportUploadError)
        return true
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || [])
        const imageFile = files.find((f) => f.type.startsWith('image/'))
        if (!imageFile) return false
        event.preventDefault()
        uploadDescriptionImage(taskId, imageFile).then((url) => {
          if (!url) return reportUploadError()
          const { schema } = view.state
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!coords) return
          view.dispatch(view.state.tr.insert(coords.pos, schema.nodes.image.create({ src: url })))
        }, reportUploadError)
        return true
      },
    },
  })

  // value מגיע בפורמט השמור (task:// markers), חותם פעם אחת כשהעורך מוכן
  useEffect(() => {
    if (!editor) return
    let active = true
    signDescriptionHtml(value || '').then((html) => {
      if (active && html) editor.commands.setContent(html)
    })
    return () => {
      active = false
    }
  }, [editor, value])

  if (!editor) return null

  function addLink() {
    const url = window.prompt('כתובת URL:')
    if (!url) return
    if (!isSafeUrl(url)) {
      window.alert('קישור חייב להתחיל ב-http, https או mailto')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  function toggleLink() {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
    } else {
      addLink()
    }
  }

  async function handleSave() {
    setBusy(true)
    setSaveError('')
    try {
      await onSave(toStoredHtml(editor.getHTML()))
    } catch (err) {
      setSaveError(err.message ?? 'משהו השתבש')
      setBusy(false)
    }
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        <button
          type="button"
          className={'rich-editor-btn' + (editor.isActive('bold') ? ' active' : '')}
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBold().run()
          }}
        >
          מודגש
        </button>
        <button
          type="button"
          className={'rich-editor-btn' + (editor.isActive('bulletList') ? ' active' : '')}
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBulletList().run()
          }}
        >
          רשימה
        </button>
        <button
          type="button"
          className={'rich-editor-btn' + (editor.isActive('link') ? ' active' : '')}
          onMouseDown={(e) => {
            e.preventDefault()
            toggleLink()
          }}
        >
          קישור
        </button>
      </div>
      {uploadError && <p className="form-error">{uploadError}</p>}
      <EditorContent editor={editor} className="rich-editor-content" />
      {saveError && <p className="form-error">{saveError}</p>}
      <div className="inline-editor-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={busy}>
          {busy ? 'שומר...' : 'שמירה'}
        </button>
      </div>
    </div>
  )
}
