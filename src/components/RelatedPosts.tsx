import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRelated, type RelatedPost } from '../lib/ai'
import { onLive, postTopic } from '../lib/realtime'
import { formatReadingTime } from '../utils/readingTime'

interface Props {
  postId: string
  tags: string[]
}

/** "Related posts" by embedding similarity (pgvector), refreshed when the embedding updates. */
const RelatedPosts = ({ postId, tags }: Props) => {
  const [items, setItems] = useState<RelatedPost[] | null>(null)
  const tagKey = tags.join('\u0000')

  useEffect(() => {
    let alive = true
    const tagList = tagKey ? tagKey.split('\u0000') : []
    const load = () =>
      fetchRelated(postId, tagList).then(r => {
        if (alive) setItems(r)
      })
    load()
    const off = onLive(postTopic(postId), 'ai', payload => {
      if ((payload as { kind?: string }).kind === 'embed') load()
    })
    return () => {
      alive = false
      off()
    }
  }, [postId, tagKey])

  if (!items || !items.length) return null

  return (
    <section className="mt-10" aria-labelledby="related-heading" data-testid="related-posts">
      <h2 id="related-heading" className="font-mono text-xs tracking-wider mb-3" style={{ color: 'var(--accent)' }}>
        // related_posts
        <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
          {items[0].similarity === null ? 'by shared tags' : 'by semantic similarity'}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(p => (
          <Link
            key={p.id}
            to={`/post/${p.slug}`}
            className="hud-panel hud-related-card group block border"
            data-testid="related-post"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-tertiary)' }}
          >
            {p.cover_image && <img src={p.cover_image} alt="" loading="lazy" className="hud-related-cover" />}
            <div className="p-3">
              <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {p.title}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                {p.similarity !== null && (
                  <span className="hud-match" data-testid="related-match">{Math.round(p.similarity * 100)}% match</span>
                )}
                <span>⏱ {formatReadingTime(p.reading_minutes)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default RelatedPosts
