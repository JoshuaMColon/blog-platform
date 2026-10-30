import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LikeButton from '../components/LikeButton'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'
import AnimatedList from '../components/AnimatedList'
import { supabase } from '../lib/supabase'
import { formatReadingTime, POST_CARD_COLUMNS } from '../utils/readingTime'
import { motion } from 'framer-motion'
import HudMark from '../components/HudMark'
import Highlight, { stripMarks } from '../components/Highlight'

const PAGE_SIZE = 20

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  reading_minutes: number
  tags: string[]
  created_at: string
  user_id: string
  cover_image: string | null
  username: string | null
  rank?: number
  title_highlight?: string
  snippet?: string
}

interface SearchRow extends Post {
  total_count: number
}

const Search = () => {
  useDocumentTitle('Search')
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const [results, setResults] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [popularTags, setPopularTags] = useState<string[]>([])
  const requestId = useRef(0)

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

  // Ranked full-text search (title > tags > content) via the search_posts RPC.
  const runSearch = useCallback(async (searchQuery: string, offset = 0) => {
    const id = ++requestId.current
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)
    setSearched(true)
    setActiveTag(null)

    const { data, error } = await supabase.rpc('search_posts', {
      q: searchQuery,
      page_size: PAGE_SIZE,
      page_offset: offset,
    })
    if (id !== requestId.current) return

    const rows = (error ? [] : (data as SearchRow[] | null) ?? [])
    setResults(prev => (offset === 0 ? rows : [...prev, ...rows]))
    if (offset === 0) setTotal(rows[0]?.total_count ?? 0)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  const handleTagSearch = async (tag: string) => {
    const id = ++requestId.current
    setActiveTag(tag)
    setQuery('')
    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('posts')
      .select(`${POST_CARD_COLUMNS}, profiles(username)`)
      .eq('published', true)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })
    if (id !== requestId.current) return

    const rows = !error && data
      ? (data as unknown as (Post & { profiles: { username: string } | null })[]).map(p => ({
          ...p,
          username: p.profiles?.username ?? null,
        }))
      : []
    setResults(rows)
    setTotal(rows.length)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim()
      setParams(q ? { q } : {}, { replace: true })
      if (q) runSearch(q)
      else if (!activeTag) {
        requestId.current++
        setResults([])
        setTotal(0)
        setSearched(false)
      }
    }, 250)

    return () => clearTimeout(timer)
    // activeTag is read only to avoid clearing tag results; it must not retrigger a search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, runSearch, setParams])

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
            className="w-full hud-panel pl-8 pr-4 py-3 font-mono text-sm border focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder='search titles, tags and content… try "row level" or -react'
            aria-label="Search posts"
            data-testid="search-input"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { requestId.current++; setQuery(''); setActiveTag(null); setResults([]); setTotal(0); setSearched(false) }}
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
            className="hud-panel p-8 text-center border"
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
              // {total} result{total !== 1 ? 's' : ''} found
              {!activeTag && ' · ranked by relevance'}
            </p>
            <div className="space-y-4">
              <AnimatedList>
                {results.map(post => (
                  <div
                    key={post.id}
                    data-testid="search-result"
                    className="hud-panel border p-4 sm:p-6 transition-all group"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <HudMark size="sm" />
                      <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-secondary)' }}>
                        ⏱ {formatReadingTime(post.reading_minutes)}
                      </span>
                    </div>

                    {post.cover_image && (
                      <Link to={`/post/${post.slug}`} tabIndex={-1} aria-hidden="true">
                        <img
                          src={post.cover_image}
                          alt=""
                          className="hud-cover h-36 mb-4"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    )}

                    <h3
                      className="font-bold font-mono text-base sm:text-lg mb-1 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Link to={`/post/${post.slug}`} className="hover:underline">
                        {post.title_highlight ? <Highlight text={post.title_highlight} /> : post.title}
                      </Link>
                    </h3>

                    <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-secondary)' }}>
                      // by{' '}
                      <Link
                        to={`/profile/${post.user_id}`}
                        className="hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        {post.username}
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

                    <p
                      className="text-sm font-mono line-clamp-3 mb-4"
                      style={{ color: 'var(--text-secondary)' }}
                      data-testid="search-snippet"
                    >
                      {post.snippet && stripMarks(post.snippet).trim()
                        ? <Highlight text={post.snippet} />
                        : post.excerpt}
                    </p>

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
            {!activeTag && results.length < total && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="hud-chip"
                  disabled={loadingMore}
                  onClick={() => runSearch(query.trim(), results.length)}
                >
                  {loadingMore ? 'loading…' : `load_more() · ${total - results.length} left`}
                </button>
              </div>
            )}
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
              // full-text search with ranking · or click a tag above
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Search