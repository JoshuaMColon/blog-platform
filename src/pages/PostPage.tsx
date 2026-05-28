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
  profiles: {
    username: string
  }
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
    if (!confirm('Are you sure you want to delete this post?')) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500">Loading post...</p>
      </div>
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500">Post not found.</p>
      </div>
    </div>
  )

  const isOwner = user?.id === post.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{post.title}</h1>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/edit/${post.id}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              by {post.profiles?.username} · {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Likes */}
          <div className="mb-6">
            <LikeButton postId={post.id} />
          </div>

          {/* Content */}
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="mt-8 text-blue-600 hover:underline text-sm"
          >
            ← Back to all posts
          </button>

          {/* Comments */}
          <hr className="my-8 border-gray-200" />
          <Comments postId={post.id} />
          
        </div>
      </div>
    </div>
  )
}

export default PostPage