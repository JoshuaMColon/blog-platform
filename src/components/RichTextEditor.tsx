import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="border border-dark-500 rounded-lg overflow-hidden bg-dark-700">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-dark-500 bg-dark-800 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          S
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          H2
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          1. List
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          Code
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 rounded text-sm font-bold font-mono text-gray-300 ${editor.isActive('bold') ? 'bg-dark-600 text-neon' : 'hover:bg-dark-600'}`}
        >
          Quote
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-64 focus:outline-none bg-dark-700 text-gray-200"
      />
    </div>
  )
}

export default RichTextEditor