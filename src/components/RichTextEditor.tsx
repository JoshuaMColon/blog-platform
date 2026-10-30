import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

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
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    // keep toolbar pressed states in sync with the selection
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Post content' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
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
              title={tool.title}
              aria-label={tool.title}
              aria-pressed={tool.active(editor)}
              onClick={() => tool.run(editor)}
              className="hud-editor-btn"
            >
              {tool.label}
            </button>
          ),
        )}
      </div>

      <EditorContent editor={editor} className="hud-editor-body post-body" />
    </div>
  )
}

export default RichTextEditor
