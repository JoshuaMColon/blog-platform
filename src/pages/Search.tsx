import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LikeButton from '../components/LikeButton'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'
import AnimatedList from '../components/AnimatedList'
import { supabase } from '../lib/supabase'
import { calculateReadingTime, formatReadingTime } from '../utils/readingTime'
import { motion } from 'framer-motion'

interface Post {
  id: string
  slug: string
  title: string
  content: string
  tags: string[]
  created_at: string
  user_id: string
  profiles: { username: string }
}

const Search = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [popularTags, setPopularTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('posts')
        .select('tags')
        .eq('published', true)

      if (data) {
        const allTags = data.flatMap(p => p.tags || [])
        const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 10)
          .map(([tag]) => tag)
        setPopularTags(sorted)
      }
    }

    fetchTags()
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    setActiveTag(null)

    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('published', true)
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })

    if (!error && data) setResults(data)
    setLoading(false)
  }

  const handleTagSearch = async (tag: string) => {
    setActiveTag(tag)
    setQuery('')
    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('published', true)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })

    if (!error && data) setResults(data)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) handleSearch(query)
      else { setResults([]); setSearched(false) }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        {/* Header */}
        <motion.div
          className="mb-8 pb-6 border-b"
          style={{ borderColor: 'var(--border)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // search
          </div>
          <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            posts.search()
          </h2>
        </motion.div>

        {/* Search input */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm"
            style={{ color: 'var(--accent)' }}
          >
            $
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg pl-8 pr-4 py-3 font-mono text-sm border focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="search by title, content, or author..."
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              clear()
            </button>
          )}
        </motion.div>

        {/* Popular tags */}
        {popularTags.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-secondary)' }}>
              // popular tags
            </p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagSearch(tag)}
                  className="text-xs font-mono px-3 py-1 rounded border transition-all"
                  style={{
                    borderColor: activeTag === tag ? 'var(--accent)' : 'var(--border)',
                    color: activeTag === tag ? 'var(--accent)' : 'var(--text-secondary)',
                    backgroundColor: activeTag === tag ? 'var(--bg-tertiary)' : 'transparent',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : searched && results.length === 0 ? (
          <motion.div
            className="rounded-lg p-8 text-center border"
            style={{ borderColor: 'var(--border)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              // no results found
            </p>
            <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              try a different search term or tag
            </p>
          </motion.div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-secondary)' }}>
              // {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-y-4">
              <AnimatedList>
                {results.map(post => (
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
                      <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-secondary)' }}>
                        ⏱ {formatReadingTime(calculateReadingTime(post.content))}
                      </span>
                    </div>

                    <h3
                      className="font-bold font-mono text-base sm:text-lg mb-1 transition-colors"
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
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {post.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => handleTagSearch(tag)}
                            className="text-xs px-2 py-0.5 rounded font-mono border transition-all"
                            style={{
                              borderColor: 'var(--accent)',
                              color: 'var(--accent)',
                              backgroundColor: 'var(--bg-tertiary)',
                            }}
                          >
                            #{tag}
                          </button>
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
              </AnimatedList>
            </div>
          </div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="font-mono text-4xl mb-4">🔍</p>
            <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              // search by title, content, or click a tag above
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Search