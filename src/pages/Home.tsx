import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import LikeButton from '../components/LikeButton'
import { Link, Navigate } from 'react-router-dom'

interface Post {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  user_id: string
  profiles: { username: string }
}

const Home = () => {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (!error && data) setPosts(data)
      setLoading(false)
    }

    if (user) fetchPosts()
  }, [user])

  if (!authLoading && !user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // latest posts
          </div>
          <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            feed.all()
          </h2>
        </div>

        {loading ? (
          <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>$ loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="rounded-lg p-8 text-center border" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>// no posts found</p>
            <Link to="/create" className="font-mono text-sm hover:underline mt-2 inline-block" style={{ color: 'var(--accent)' }}>
              $ create_first_post()
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg p-4 sm:p-6 border transition-all group cursor-pointer"
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
                </div>

                <h3
                  className="text-base sm:text-lg font-bold font-mono mb-2 transition-colors"
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
                    to={`/post/${post.id}`}
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

export default Home