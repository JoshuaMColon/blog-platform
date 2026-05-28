import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

interface LikeButtonProps {
  postId: string
}

const LikeButton = ({ postId }: LikeButtonProps) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchLikes = async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)

      if (!error && data) {
        setLikeCount(data.length)
        if (user) setLiked(data.some(like => like.user_id === user.id))
      }
    }
    fetchLikes()
  }, [postId, user])

  const handleLike = async () => {
    if (!user || loading) return
    setLoading(true)

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
      setLiked(false)
      setLikeCount(prev => prev - 1)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
      setLiked(true)
      setLikeCount(prev => prev + 1)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={!user || loading}
      className="flex items-center gap-2 px-3 py-1 rounded border font-mono text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: liked ? '#ef4444' : 'var(--border)',
        color: liked ? '#ef4444' : 'var(--text-secondary)',
        backgroundColor: liked ? 'rgba(239,68,68,0.1)' : 'transparent',
      }}
    >
      {liked ? '♥' : '♡'} {likeCount}
    </button>
  )
}

export default LikeButton