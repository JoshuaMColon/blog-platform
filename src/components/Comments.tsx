import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import Spinner from './Spinner'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string }
}

const Comments = ({ postId }: { postId: string }) => {
  const { user, isDemo } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      toast.success('Comment posted!')
  } else {
      toast.error(error.message.startsWith('Demo limit') ? error.message : 'Failed to post comment')
  }
    setSubmitting(false)
}

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    setDeletingId(null)
    if (error) {
      toast.error('Failed to delete comment')
      return
    }
    setComments(prev => prev.filter(c => c.id !== commentId))
    toast.success('Comment deleted!')
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
  }

  const handleSaveEdit = async (commentId: string) => {
    const text = editText.trim()
    if (!text) return
    setSavingEdit(true)
    const { error } = await supabase.from('comments').update({ content: text }).eq('id', commentId)
    setSavingEdit(false)
    if (error) {
      toast.error(error.message.startsWith('Demo limit') ? error.message : 'Failed to update comment')
      return
    }
    setComments(prev => prev.map(c => (c.id === commentId ? { ...c, content: text } : c)))
    setEditingId(null)
    toast.success('Comment updated!')
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
            maxLength={isDemo ? 500 : undefined}
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              aria-busy={submitting}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded font-mono font-bold text-xs disabled:opacity-50 tracking-wide"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
            >
              {submitting && <Spinner label="Posting comment" />}
              {submitting ? 'posting...' : '> post_comment()'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs font-mono mb-6" style={{ color: 'var(--text-secondary)' }}>
          // <a href="/login" className="hover:underline" style={{ color: 'var(--accent)' }}>sign_in()</a> to comment
        </p>
      )}

      {loading ? (
        <p className="text-xs font-mono inline-flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Spinner label="Loading comments" /> loading...</p>
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
                {user?.id === comment.user_id && editingId !== comment.id && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      className="text-xs font-mono hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      edit()
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      aria-busy={deletingId === comment.id}
                      className="inline-flex items-center gap-1 text-xs font-mono hover:text-red-500 transition-colors disabled:opacity-60"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {deletingId === comment.id && <Spinner size={10} label="Deleting comment" />}
                      rm()
                    </button>
                  </div>
                )}
              </div>
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    aria-label="Edit comment"
                    className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none resize-none border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--accent)',
                      color: 'var(--text-primary)',
                    }}
                    maxLength={isDemo ? 500 : undefined}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={savingEdit}
                      className="px-3 py-1 rounded border font-mono text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      cancel()
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={savingEdit || !editText.trim()}
                      aria-busy={savingEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono font-bold text-xs disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
                    >
                      {savingEdit && <Spinner size={10} label="Saving comment" />}
                      save()
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-mono whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                  {comment.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Comments