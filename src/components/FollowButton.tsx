import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface FollowButtonProps {
  profileId: string
}

const FollowButton = ({ profileId }: FollowButtonProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkFollow = async () => {
      if (!user) return

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single()

      setFollowing(!!data)
    }

    checkFollow()
  }, [user, profileId])

  const handleFollow = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    if (following) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)

      if (error) {
        toast.error('Failed to unfollow')
      } else {
        setFollowing(false)
        toast.success('Unfollowed!')
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: profileId,
        })

      if (error) {
        toast.error('Failed to follow')
      } else {
        setFollowing(true)
        toast.success('Following!')
      }
    }

    setLoading(false)
  }

  // Don't show follow button on own profile
  if (user?.id === profileId) return null

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className="px-4 py-1.5 rounded border font-mono text-xs font-bold transition-all disabled:opacity-50"
      style={{
        backgroundColor: following ? 'transparent' : 'var(--accent)',
        color: following ? 'var(--text-secondary)' : 'var(--btn-text)',
        borderColor: following ? 'var(--border)' : 'var(--accent)',
      }}
      onMouseEnter={e => {
        if (following) {
          e.currentTarget.style.borderColor = '#ef4444'
          e.currentTarget.style.color = '#ef4444'
        }
      }}
      onMouseLeave={e => {
        if (following) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {loading ? '...' : following ? 'unfollow()' : '+ follow()'}
    </button>
  )
}

export default FollowButton