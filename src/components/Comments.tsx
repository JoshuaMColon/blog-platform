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

const Comments = ({ postId }: { postId: string }) => {
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
    if (!error) { setNewComment(''); refreshComments() }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <div className="mt-4">
      <div className="text-xs font-mono tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
        // comments ({comments.length})
      </div>

      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors resize-none border"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="// write a comment..."
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-1.5 rounded font-mono font-bold text-xs disabled:opacity-50 tracking-wide"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
            >
              {submitting ? '> posting...' : '> post_comment()'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs font-mono mb-6" style={{ color: 'var(--text-secondary)' }}>
          // <a href="/login" className="hover:underline" style={{ color: 'var(--accent)' }}>sign_in()</a> to comment
        </p>
      )}

      {loading ? (
        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>$ loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>// no comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded p-4 border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--accent)' }}>
                    {comment.profiles?.username}
                  </span>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                    · {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs font-mono hover:text-red-500 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    rm()
                  </button>
                )}
              </div>
              <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Comments