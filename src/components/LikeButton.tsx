import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  postId: string
}

const LikeButton = ({ postId }: LikeButtonProps) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [burst, setBurst] = useState(0)
  const pending = useRef(false)

  useEffect(() => {
    let cancelled = false
    const fetchLikes = async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', postId)

      if (!cancelled && !error && data) {
        setLikeCount(data.length)
        setLiked(Boolean(user && data.some(like => like.user_id === user.id)))
      }
    }
    fetchLikes()
    return () => { cancelled = true }
  }, [postId, user])

  const handleLike = async () => {
    if (!user || pending.current) return
    pending.current = true

    // Optimistic update: flip immediately, roll back if the request fails.
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => c + (wasLiked ? -1 : 1))
    if (!wasLiked) setBurst(b => b + 1)

    const { error } = wasLiked
      ? await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
      : await supabase.from('likes').insert({ post_id: postId, user_id: user.id })

    if (error) {
      setLiked(wasLiked)
      setLikeCount(c => c + (wasLiked ? 1 : -1))
      toast.error(error.message.startsWith('Demo limit') ? error.message : wasLiked ? 'Could not remove like' : 'Could not like post')
    }
    pending.current = false
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={!user}
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${likeCount} likes)` : `Like (${likeCount} likes)`}
      title={user ? undefined : 'Sign in to like posts'}
      className="relative flex items-center gap-2 px-3 py-1 rounded border font-mono text-xs disabled:opacity-40"
      style={{
        borderColor: liked ? 'var(--accent-2)' : 'var(--border)',
        color: liked ? 'var(--accent-2)' : 'var(--text-secondary)',
        backgroundColor: liked ? 'rgba(var(--accent-2-rgb), 0.12)' : 'transparent',
        boxShadow: liked ? '0 0 12px rgba(var(--accent-2-rgb), 0.35)' : undefined,
      }}
    >
      <span className="relative inline-flex w-3 justify-center" aria-hidden="true">
        <motion.span
          key={liked ? `on-${burst}` : 'off'}
          initial={liked ? { scale: 0.4 } : false}
          animate={{ scale: [0.4, 1.35, 1] }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-block"
        >
          {liked ? '♥' : '♡'}
        </motion.span>
        <AnimatePresence>
          {liked && burst > 0 && (
            <motion.span
              key={`ring-${burst}`}
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: '0 0 0 2px rgba(var(--accent-2-rgb), 0.6)' }}
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </span>
      <span className="tabular-nums">{likeCount}</span>
    </button>
  )
}

export default LikeButton
