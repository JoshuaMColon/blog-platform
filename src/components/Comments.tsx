import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
  }
}

interface CommentsProps {
  postId: string
}

const Comments = ({ postId }: CommentsProps) => {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (!error && data) setComments(data)
      setLoading(false)
    }

    fetchComments()
  }, [postId])

  const refreshComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (!error && data) setComments(data)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return
    setSubmitting(true)

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      refreshComments()
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Comments ({comments.length})
      </h2>

      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Write a comment..."
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-6">
          <a href="/login" className="text-blue-600 hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="font-medium text-gray-800 text-sm">
                    {comment.profiles?.username}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Comments