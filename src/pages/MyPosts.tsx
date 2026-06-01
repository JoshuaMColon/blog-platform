import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'

interface Post {
  id: string
  title: string
  content: string
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

const MyPosts = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (!error && data) setPosts(data)
      setLoading(false)
    }

    fetchMyPosts()
  }, [user])

  const handleDelete = async () => {
    if (!deleteId) return

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', deleteId)

    if (error) {
      toast.error('Failed to delete post')
    } else {
      setPosts(posts.filter(p => p.id !== deleteId))
      toast.success('Post deleted!')
    }
    setDeleteId(null)
  }

  const handleTogglePublish = async (post: Post) => {
    const { error } = await supabase
      .from('posts')
      .update({ published: !post.published })
      .eq('id', post.id)

    if (error) {
      toast.error('Failed to update post')
      return
    }

    setPosts(posts.map(p =>
      p.id === post.id ? { ...p, published: !post.published } : p
    ))
    toast.success(post.published ? 'Post unpublished!' : 'Post published!')
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'published') return post.published
    if (filter === 'drafts') return !post.published
    return true
  })

  const publishedCount = posts.filter(p => p.published).length
  const draftCount = posts.filter(p => !p.published).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // my posts
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              posts.mine()
            </h2>
            <Link
              to="/create"
              className="px-4 py-2 rounded font-mono text-sm font-bold transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
            >
              + new_post()
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div>
              <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                {posts.length}
              </span>
              <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                total
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                {publishedCount}
              </span>
              <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                published
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                {draftCount}
              </span>
              <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                drafts
              </span>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'published', 'drafts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-1.5 rounded font-mono text-xs border transition-all"
              style={{
                backgroundColor: filter === tab ? 'var(--accent)' : 'transparent',
                color: filter === tab ? 'var(--btn-text)' : 'var(--text-secondary)',
                borderColor: filter === tab ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {tab}()
            </button>
          ))}
        </div>

        {/* Posts list */}
        {loading ? (
          <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            $ loading posts...
          </p>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-lg p-8 text-center border" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              // no {filter === 'all' ? '' : filter} posts found
            </p>
            <Link
              to="/create"
              className="font-mono text-sm hover:underline mt-2 inline-block"
              style={{ color: 'var(--accent)' }}
            >
              $ create_first_post()
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="rounded-lg border p-4 sm:p-5 transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded border"
                        style={{
                          color: post.published ? 'var(--accent)' : 'var(--text-secondary)',
                          borderColor: post.published ? 'var(--accent)' : 'var(--border)',
                          backgroundColor: post.published ? 'var(--bg-tertiary)' : 'transparent',
                        }}
                      >
                        {post.published ? '● published' : '○ draft'}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(post.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="font-bold font-mono text-sm sm:text-base truncate mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {post.title}
                    </h3>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: 'var(--text-secondary)',
                              backgroundColor: 'var(--bg-tertiary)',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className="text-xs font-mono px-3 py-1.5 rounded border transition-all"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      {post.published ? 'unpublish()' : 'publish()'}
                    </button>
                    <button
                      onClick={() => navigate(`/edit/${post.id}`)}
                      className="text-xs font-mono px-3 py-1.5 rounded border transition-all"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      edit()
                    </button>
                    {post.published && (
                      <button
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="text-xs font-mono px-3 py-1.5 rounded border transition-all"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                      >
                        view()
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(post.id)}
                      className="text-xs font-mono px-3 py-1.5 rounded border transition-all"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#ef4444'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      delete()
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="// delete_post()"
        message="Are you sure? This action cannot be undone."
        confirmLabel="> delete()"
        cancelLabel="cancel()"
        danger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default MyPosts