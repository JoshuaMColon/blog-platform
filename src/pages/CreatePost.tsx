import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useState } from 'react'
import Spinner from '../components/Spinner'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import RichTextEditor from '../components/RichTextEditor'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import CoverImageUpload from '../components/CoverImageUpload'
import { generateUniqueSlug } from '../utils/slugify'

const CreatePost = () => {
  useDocumentTitle('New post')
  const { user, isDemo, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coverImage, setCoverImage] = useState('')

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>// loading...</p>
    </div>
  )

  if (!user) return <Navigate to="/login" />

  const handleSubmit = async (published: boolean) => {
    if (!title.trim()) return setError('Title is required')
    if (!content.trim()) return setError('Content is required')

    setLoading(true)
    setError('')

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
    const slug = await generateUniqueSlug(title, supabase)

    const { error } = await supabase.from('posts').insert({
      title,
      content,
      tags: tagsArray,
      user_id: user.id,
      published,
      cover_image: coverImage || null,
      slug,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Post published!')
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // new transmission
          </div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            post.create()
          </h1>
        </div>

        {error && (
          <div className="border border-red-400 bg-red-500 bg-opacity-10 text-red-400 p-3 rounded mb-4 text-xs font-mono" role="alert">
            <span className="font-bold">ERROR:</span> {error}
          </div>
        )}

        <div
          className="hud-panel border p-4 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Cover Image */}
          {isDemo ? (
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              // demo mode: cover image uploads are turned off for guests (up to 3 posts per guest)
            </p>
          ) : (
            <CoverImageUpload
              currentImage={coverImage}
              onUpload={(url) => setCoverImage(url)}
              onRemove={() => setCoverImage('')}
            />
          )}

          <div>
            <label htmlFor="post-title" className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ TITLE
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm font-mono border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="Enter your post title..."
            />
          </div>

          <div>
            <label htmlFor="post-tags" className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ TAGS <span style={{ color: 'var(--text-secondary)' }}>(comma separated)</span>
            </label>
            <input
              id="post-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm font-mono border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="react, typescript, webdev..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ CONTENT
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div className="flex gap-3 justify-end flex-wrap">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-4 py-2 rounded font-mono text-xs border transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              save_draft()
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
            >
              {loading && <Spinner label="Saving post" />}
              {loading ? 'saving...' : '> publish()'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost