import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Spinner from './Spinner'

interface BookmarkButtonProps {
  postId: string
  onRemove?: () => void
}

const BookmarkButton = ({ postId, onRemove }: BookmarkButtonProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user) return

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle()

      setBookmarked(!!data)
    }

    checkBookmark()
  }, [user, postId])

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    if (bookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) {
        toast.error('Failed to remove bookmark')
      } else {
        setBookmarked(false)
        toast.success('Bookmark removed!')
        if (onRemove) onRemove()
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          post_id: postId,
        })

      if (error) {
        toast.error('Failed to bookmark')
      } else {
        setBookmarked(true)
        toast.success('Bookmarked!')
      }
    }

    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleBookmark}
      disabled={loading}
      aria-busy={loading}
      aria-pressed={bookmarked}
      className="flex items-center gap-1.5 px-3 py-1 rounded border font-mono text-xs transition-all disabled:opacity-60"
      style={{
        borderColor: bookmarked ? 'var(--accent)' : 'var(--border)',
        color: bookmarked ? 'var(--accent)' : 'var(--text-secondary)',
        backgroundColor: bookmarked ? 'var(--bg-tertiary)' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!bookmarked) {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        }
      }}
      onMouseLeave={e => {
        if (!bookmarked) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {loading ? <Spinner label="Saving bookmark" /> : <span aria-hidden="true">{bookmarked ? '🔖' : '📄'}</span>} {bookmarked ? 'saved()' : 'save()'}
    </button>
  )
}

export default BookmarkButton