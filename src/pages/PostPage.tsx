import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import Comments from '../components/Comments'
import LikeButton from '../components/LikeButton'

interface Post {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  user_id: string
  profiles: { username: string }
}

const PostPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .eq('id', id)
        .single()

      if (!error && data) setPost(data)
      setLoading(false)
    }
    fetchPost()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('delete this post?')) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500 font-mono text-sm">$ loading...</p>
      </div>
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500 font-mono text-sm">// post not found</p>
      </div>
    </div>
  )

  const isOwner = user?.id === post.user_id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-6 sm:p-8">

          <div className="flex items-center gap-1.5 mb-6 pb-4 border-b border-gray-200 dark:border-dark-600 flex-wrap">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-400 text-xs font-mono ml-2 flex-1 truncate">
              posts/{post.id}.md
            </span>
            {isOwner && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => navigate(`/edit/${post.id}`)}
                  className="text-xs font-mono text-gray-500 hover:text-green-600 dark:hover:text-neon transition-colors px-2 py-1 border border-gray-300 dark:border-dark-500 rounded hover:border-green-500 dark:hover:border-neon"
                >
                  edit()
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-mono text-gray-500 hover:text-red-500 transition-colors px-2 py-1 border border-gray-300 dark:border-dark-500 rounded hover:border-red-400 disabled:opacity-50"
                >
                  {deleting ? 'deleting...' : 'delete()'}
                </button>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white font-mono mb-2">
            {post.title}
          </h1>
          <p className="text-xs font-mono text-gray-500 mb-4">
            // by {post.profiles?.username} · {new Date(post.created_at).toLocaleDateString()}
          </p>

          {post.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {post.tags.map((tag) => (
                <span key={tag} className="border border-green-500 dark:border-neon text-green-600 dark:text-neon text-xs px-2 py-0.5 rounded font-mono bg-green-50 dark:bg-neon dark:bg-opacity-5">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mb-6">
            <LikeButton postId={post.id} />
          </div>

          <div
            className="prose max-w-none text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <button
            onClick={() => navigate('/')}
            className="mt-8 text-green-600 dark:text-neon hover:underline text-xs font-mono"
          >
            ← back_to_feed()
          </button>

          <hr className="my-8 border-gray-200 dark:border-dark-600" />
          <Comments postId={post.id} />
        </div>
      </div>
    </div>
  )
}

export default PostPage