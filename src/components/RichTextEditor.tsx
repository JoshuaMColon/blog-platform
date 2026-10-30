import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useLayoutEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { ACCEPT_ATTR, ImageError, uploadImage } from '../lib/images'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

type Tool = {
  label: string
  title: string
  run: (e: Editor) => void
  active: (e: Editor) => boolean
}

const TOOLS: (Tool | 'sep')[] = [
  { label: 'B', title: 'Bold', run: e => e.chain().focus().toggleBold().run(), active: e => e.isActive('bold') },
  { label: 'I', title: 'Italic', run: e => e.chain().focus().toggleItalic().run(), active: e => e.isActive('italic') },
  { label: 'S', title: 'Strikethrough', run: e => e.chain().focus().toggleStrike().run(), active: e => e.isActive('strike') },
  'sep',
  { label: 'H1', title: 'Heading 1', run: e => e.chain().focus().toggleHeading({ level: 1 }).run(), active: e => e.isActive('heading', { level: 1 }) },
  { label: 'H2', title: 'Heading 2', run: e => e.chain().focus().toggleHeading({ level: 2 }).run(), active: e => e.isActive('heading', { level: 2 }) },
  'sep',
  { label: '• List', title: 'Bullet list', run: e => e.chain().focus().toggleBulletList().run(), active: e => e.isActive('bulletList') },
  { label: '1. List', title: 'Numbered list', run: e => e.chain().focus().toggleOrderedList().run(), active: e => e.isActive('orderedList') },
  'sep',
  { label: 'Code', title: 'Code block', run: e => e.chain().focus().toggleCodeBlock().run(), active: e => e.isActive('codeBlock') },
  { label: 'Quote', title: 'Blockquote', run: e => e.chain().focus().toggleBlockquote().run(), active: e => e.isActive('blockquote') },
]

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const { user, isDemo } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  // handlers passed to useEditor are captured once; read the latest via a ref
  const insertRef = useRef<(files: File[], pos?: number) => boolean>(() => false)

  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ allowBase64: false, HTMLAttributes: { loading: 'lazy' } })],
    content,
    // keep toolbar pressed states in sync with the selection
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Post content' },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
        return files.length ? insertRef.current(files) : false
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        return insertRef.current(files, pos)
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const insertImages = (files: File[], pos?: number) => {
    if (!editor || !user || uploading) return false
    setUploading(true)
    ;(async () => {
      for (const file of files.slice(0, 3)) {
        try {
          const { url } = await uploadImage(file, 'post-images', user.id, isDemo)
          const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 120)
          const chain = editor.chain().focus()
          ;(pos != null ? chain.insertContentAt(pos, { type: 'image', attrs: { src: url, alt } }) : chain.setImage({ src: url, alt })).run()
        } catch (err) {
          toast.error(err instanceof ImageError ? err.message : 'Image upload failed.')
          break
        }
      }
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    })()
    return true
  }
  useLayoutEffect(() => {
    insertRef.current = insertImages
  })

  if (!editor) return null

  return (
    <div className="hud-editor border">
      <div className="hud-editor-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLS.map((tool, i) =>
          tool === 'sep' ? (
            <span key={`sep-${i}`} className="hud-editor-sep" aria-hidden="true" />
          ) : (
            <button
              key={tool.label}
              type="button"
              data-tip={tool.title}
              aria-label={tool.title}
              aria-pressed={tool.active(editor)}
              onClick={() => tool.run(editor)}
              className="hud-editor-btn"
            >
              {tool.label}
            </button>
          ),
        )}
        <span className="hud-editor-sep" aria-hidden="true" />
        <button
          type="button"
          data-tip="Insert image"
          aria-label="Insert image"
          className="hud-editor-btn"
          disabled={!user || uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? '…uploading' : '⬒ Img'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          data-testid="editor-image-input"
          onChange={e => insertImages(Array.from(e.target.files ?? []))}
        />
      </div>

      <EditorContent editor={editor} className="hud-editor-body post-body" />
    </div>
  )
}

export default RichTextEditor
