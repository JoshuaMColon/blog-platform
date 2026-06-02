import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import LikeButton from '../components/LikeButton'
import { calculateReadingTime, formatReadingTime } from '../utils/readingTime'

interface Post {
  id: string
  slug: string
  title: string
  content: string
  tags: string[]
  created_at: string
  user_id: string
  cover_image: string | null
  profiles: { username: string }
}

const Following = () => {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFollowingPosts = async () => {
      if (!user) return

      // Get list of people the user follows
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (!follows || follows.length === 0) {
        setLoading(false)
        return
      }

      const followingIds = follows.map(f => f.following_id)

      // Get posts from followed users
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .eq('published', true)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })

      if (!error && data) setPosts(data)
      setLoading(false)
    }

    fetchFollowingPosts()
  }, [user])

  if (!authLoading && !user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // following feed
          </div>
          <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            feed.following()
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-6 animate-pulse"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                <div className="h-4 rounded mb-4 w-1/4" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                <div className="h-6 rounded mb-2 w-3/4" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg p-8 text-center border" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              // no posts from people you follow
            </p>
            <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              // follow some authors to see their posts here
            </p>
            <Link
              to="/"
              className="font-mono text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              $ browse_all_posts()
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg p-4 sm:p-6 border transition-all group"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-secondary)' }}>
                    ⏱ {formatReadingTime(calculateReadingTime(post.content))}
                  </span>
                </div>

                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}

                <h3
                  className="text-base sm:text-lg font-bold font-mono mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {post.title}
                </h3>

                <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-secondary)' }}>
                  // by{' '}
                  <Link
                    to={`/profile/${post.user_id}`}
                    className="hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    {post.profiles?.username}
                  </Link>
                </p>

                {post.tags?.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {post.tags.map((tag) => (
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
                    className="hover:underline text-xs font-mono"
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

export default Following