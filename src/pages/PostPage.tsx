import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import Comments from '../components/Comments'
import LikeButton from '../components/LikeButton'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'
import { calculateReadingTime, formatReadingTime } from '../utils/readingTime'
import BookmarkButton from '../components/BookmarkButton'
import SkeletonPost from '../components/SkeletonPost'
import FadeIn from '../components/FadeIn'
import { motion } from 'framer-motion'

interface Post {
  id: string
  slug: string
  title: string
  content: string
  tags: string[]
  created_at: string
  user_id: string
  cover_image: string | null
  profiles: { username: string }
}

const PostPage = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .eq('slug', slug)
        .single()

      if (!error && data) setPost(data)
      setLoading(false)
    }
    fetchPost()
  }, [slug])

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('posts').delete().eq('id', post!.id)
    if (error) {
      toast.error('Failed to delete post')
      setDeleting(false)
      return
    }
    toast.success('Post deleted!')
    navigate('/')
  }

  if (loading) return <SkeletonPost />

  if (!post) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
          // post not found
        </p>
      </div>
    </div>
  )

  const isOwner = user?.id === post.user_id

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <motion.div
          className="rounded-lg border p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Terminal bar */}
          <div className="flex items-center gap-1.5 mb-6 pb-4 border-b flex-wrap" style={{ borderColor: 'var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-mono ml-2 flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
              posts/{post.slug}.md
            </span>
            {isOwner && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => navigate(`/edit/${post.slug}`)}
                  className="text-xs font-mono transition-colors px-2 py-1 border rounded"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  edit()
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="text-xs font-mono transition-colors px-2 py-1 border rounded disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.borderColor = '#ef4444'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  {deleting ? 'deleting...' : 'delete()'}
                </button>
              </div>
            )}
          </div>

          {/* Cover image */}
          {post.cover_image && (
            <motion.img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold font-mono mb-2" style={{ color: 'var(--text-primary)' }}>
            {post.title}
          </h1>

          {/* Meta */}
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
            // by{' '}
            <Link
              to={`/profile/${post.user_id}`}
              className="hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {post.profiles?.username}
            </Link>
            {' '}· {new Date(post.created_at).toLocaleDateString()}
            {' '}· ⏱ {formatReadingTime(calculateReadingTime(post.content))}
          </p>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded font-mono border"
                  style={{
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    backgroundColor: 'var(--bg-tertiary)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Likes and Bookmark */}
          <div className="flex items-center gap-3 mb-6">
            <LikeButton postId={post.id} />
            <BookmarkButton postId={post.id} />
          </div>

          {/* Content */}
          <div
            className="prose max-w-none font-mono text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="mt-8 hover:underline text-xs font-mono"
            style={{ color: 'var(--accent)' }}
          >
            ← back_to_feed()
          </button>

          {/* Comments */}
          <FadeIn delay={0.3}>
            <hr className="my-8" style={{ borderColor: 'var(--border)' }} />
            <Comments postId={post.id} />
          </FadeIn>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="// delete_post()"
        message="Are you sure? This action cannot be undone."
        confirmLabel="> delete()"
        cancelLabel="cancel()"
        danger={true}
        onConfirm={() => { setShowDeleteModal(false); handleDelete() }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}

export default PostPage