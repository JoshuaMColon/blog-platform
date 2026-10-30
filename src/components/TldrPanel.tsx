import { useEffect, useState } from 'react'
import { fetchSummary, type PostSummary } from '../lib/ai'
import { onLive, postTopic } from '../lib/realtime'

interface Props {
  postId: string
  published: boolean
}

/** Collapsible TL;DR. Refreshes live when the summarize-post worker finishes. */
const TldrPanel = ({ postId, published }: Props) => {
  const [summary, setSummary] = useState<PostSummary | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetchSummary(postId).then(s => {
        if (!alive) return
        setSummary(s)
        setLoaded(true)
      })
    load()
    const off = onLive(postTopic(postId), 'ai', payload => {
      if ((payload as { kind?: string }).kind === 'summary') load()
    })
    return () => {
      alive = false
      off()
    }
  }, [postId])

  if (!loaded) return null
  if (!summary && !published) return null

  return (
    <section
      className="hud-panel hud-tldr border mb-6"
      data-testid="tldr-panel"
      aria-label="TL;DR summary"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-tertiary)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: open ? 'var(--border)' : 'transparent' }}>
        <span className="hud-tldr-led" aria-hidden="true" data-pending={summary ? undefined : 'true'} />
        <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--accent)' }}>// TL;DR</span>
        {summary && (
          <span className="hud-tldr-src" data-testid="tldr-source" title={summary.source === 'llm' ? 'Written by a language model' : 'Key sentences picked from the post'}>
            {summary.source === 'llm' ? 'ai.summary' : 'extractive'}
          </span>
        )}
        <button
          type="button"
          className="hud-chip ml-auto"
          aria-expanded={open}
          aria-controls={`tldr-${postId}`}
          onClick={() => setOpen(o => !o)}
        >
          {open ? 'collapse()' : 'expand()'}
        </button>
      </div>
      {open && (
        <div id={`tldr-${postId}`} className="px-4 py-3">
          {summary ? (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }} data-testid="tldr-text">
              {summary.summary}
            </p>
          ) : (
            <p className="text-xs font-mono hud-tldr-pending" style={{ color: 'var(--text-secondary)' }} data-testid="tldr-pending">
              &gt; summarizing post<span className="hud-ellipsis" />
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default TldrPanel
