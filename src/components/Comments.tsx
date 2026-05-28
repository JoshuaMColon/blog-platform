import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string }
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
    <div className="mt-4">
      <div className="text-green-600 dark:text-neon text-xs font-mono tracking-widest mb-4">
        // comments ({comments.length})
      </div>

      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 rounded px-3 py-2 text-sm font-mono text-gray-800 dark:text-white focus:outline-none focus:border-green-500 dark:focus:border-neon transition-colors resize-none placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="// write a comment..."
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-1.5 bg-green-600 dark:bg-neon text-white dark:text-dark-900 rounded font-mono font-bold text-xs hover:bg-green-700 dark:hover:bg-opacity-90 disabled:opacity-50 tracking-wide"
            >
              {submitting ? '> posting...' : '> post_comment()'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-xs font-mono mb-6">
          // <a href="/login" className="text-green-600 dark:text-neon hover:underline">sign_in()</a> to comment
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-xs font-mono">$ loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-xs font-mono">// no comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-500 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-green-600 dark:text-neon text-xs font-mono font-medium">
                    {comment.profiles?.username}
                  </span>
                  <span className="text-gray-400 text-xs font-mono ml-2">
                    · {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-500 text-xs font-mono transition-colors"
                  >
                    rm()
                  </button>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-mono">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Comments