import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Spinner from './Spinner'

interface FollowButtonProps {
  profileId: string
}

// follows.follower_id is me, following_id is them. The insert policy checks
// the follower side only, so I always write my own id there.
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
        .maybeSingle()

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

  // I don't offer a self-follow. The follow policy would allow it (it only
  // checks follower_id); the notify trigger skips that case so it wouldn't
  // page me, but the row would still show up in the following feed.
  if (user?.id === profileId) return null

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      aria-busy={loading}
      aria-pressed={following}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded border font-mono text-xs font-bold disabled:opacity-60"
      style={{
        backgroundColor: following ? 'transparent' : 'var(--accent)',
        color: following ? 'var(--text-secondary)' : 'var(--btn-text)',
        borderColor: following ? 'var(--border)' : 'var(--accent)',
      }}
      onMouseEnter={e => {
        if (following) {
          e.currentTarget.style.borderColor = 'var(--danger)'
          e.currentTarget.style.color = 'var(--danger)'
        }
      }}
      onMouseLeave={e => {
        if (following) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {loading && <Spinner label={following ? 'Unfollowing' : 'Following'} />}
      {following ? 'unfollow()' : '+ follow()'}
    </button>
  )
}

export default FollowButton