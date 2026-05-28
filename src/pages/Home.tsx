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
  profiles: {
    username: string
  }
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
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">

        <div className="mb-8 border-b border-dark-600 pb-6">
          <div className="text-neon text-xs font-mono tracking-widest mb-1">// latest posts</div>
          <h2 className="text-2xl font-bold text-white font-mono">feed.all()</h2>
        </div>

        {loading ? (
          <p className="text-gray-500 font-mono text-sm">$ loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="border border-dark-600 rounded-lg p-8 text-center">
            <p className="text-gray-500 font-mono text-sm">// no posts found</p>
            <Link to="/create" className="text-neon font-mono text-sm hover:underline mt-2 inline-block">
              $ create_first_post()
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-dark-800 border border-dark-600 rounded-lg p-6 hover:border-neon transition-colors group"
              >
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
                  <div className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
                  <span className="text-dark-500 text-xs font-mono ml-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-mono group-hover:text-neon transition-colors mb-2">
                  {post.title}
                </h3>

                <p className="text-xs font-mono text-gray-500 mb-3">
                  // by {post.profiles?.username}
                </p>

                {post.tags?.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-neon text-neon text-xs px-2 py-0.5 rounded font-mono bg-neon bg-opacity-5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className="text-gray-400 text-sm font-mono line-clamp-2 mb-4"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="flex items-center justify-between">
                  <LikeButton postId={post.id} />
                  <Link
                    to={`/post/${post.id}`}
                    className="text-neon hover:underline text-xs font-mono"
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