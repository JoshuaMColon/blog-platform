import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import LikeButton from '../components/LikeButton'
import toast from 'react-hot-toast'
import FollowButton from '../components/FollowButton'
import SkeletonCard from '../components/SkeletonCard'

interface Profile {
  id: string
  slug: string
  username: string
  bio: string | null
  avatar_url: string | null
  created_at: string
}

interface Post {
  id: string
  slug: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

const UserProfile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [postCount, setPostCount] = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  const isOwner = user?.id === id

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)
      setBio(profileData.bio || '')

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (postsData) {
        setPosts(postsData)
        setPostCount(postsData.length)
      }

      // Fetch follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id)

      // Fetch following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id)

      setFollowerCount(followers ?? 0)
      setFollowingCount(following ?? 0)

      setLoading(false)
    }

    fetchProfile()
  }, [id])

  const handleSaveBio = async () => {
    setSavingBio(true)
    const { error } = await supabase
      .from('profiles')
      .update({ bio })
      .eq('id', user?.id)

    if (error) {
      toast.error('Failed to save bio')
    } else {
      setProfile(prev => prev ? { ...prev, bio } : null)
      setEditingBio(false)
      toast.success('Bio updated!')
    }
    setSavingBio(false)
  }

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="space-y-4">
          {/* Profile card skeleton */}
          <div
            className="rounded-lg border p-6 sm:p-8 animate-pulse"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              <div className="space-y-2">
                <div className="h-6 rounded w-32" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                <div className="h-3 rounded w-24" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              </div>
            </div>
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          </div>
          {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
          // profile not found
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        {/* Profile card */}
        <div
          className="rounded-lg border p-6 sm:p-8 mb-8"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Terminal bar */}
          <div className="flex items-center gap-1.5 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
              profile/{profile.username}
            </span>
          </div>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-lg border flex items-center justify-center font-mono font-bold text-2xl flex-shrink-0"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {profile.username}
                </h1>
                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
                  // joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                    {postCount}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    posts
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                    {followerCount}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    followers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                    {followingCount}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    following
                  </div>
                </div>
              </div>

              {/* Follow button */}
              <FollowButton profileId={profile.id} />
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            {editingBio ? (
              <div>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm font-mono border focus:outline-none transition-colors resize-none"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="// write something about yourself..."
                  rows={3}
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {bio.length}/200
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingBio(false); setBio(profile.bio || '') }}
                      className="text-xs font-mono px-3 py-1 rounded border transition-all"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      cancel()
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="text-xs font-mono px-3 py-1 rounded font-bold transition-all disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
                    >
                      {savingBio ? 'saving...' : 'save()'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-mono" style={{ color: profile.bio ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {profile.bio || '// no bio yet'}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setEditingBio(true)}
                    className="text-xs font-mono flex-shrink-0 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    edit_bio()
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts section */}
        <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // published posts
          </div>
          <h2 className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            posts.by({profile.username})
          </h2>
        </div>

        {posts.length === 0 && loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg p-8 text-center border" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              // no published posts yet
            </p>
            {isOwner && (
              <Link
                to="/create"
                className="font-mono text-sm hover:underline mt-2 inline-block"
                style={{ color: 'var(--accent)' }}
              >
                $ create_first_post()
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="rounded-lg border p-4 sm:p-6 transition-all group"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3
                  className="font-bold font-mono text-base sm:text-lg mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {post.title}
                </h3>

                {post.tags?.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {post.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded font-mono border"
                        style={{
                          borderColor: 'var(--accent)',
                          color: 'var(--accent)',
                          backgroundColor: 'var(--bg-tertiary)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className="text-sm font-mono line-clamp-2 mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <LikeButton postId={post.id} />
                  <Link
                    to={`/post/${post.slug}`}
                    className="text-xs font-mono hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    read_more() →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile