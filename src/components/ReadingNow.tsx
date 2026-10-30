import { useEffect, useState } from 'react'
import { joinPresence, postTopic } from '../lib/realtime'

// Presence-based "N reading now" counter. Each open tab on this post is one
// presence entry on the shared post:<id> channel; leaving the page untracks.
const ReadingNow = ({ postId }: { postId: string }) => {
  const [count, setCount] = useState(1)

  useEffect(() => joinPresence(postTopic(postId), n => setCount(Math.max(1, n))), [postId])

  return (
    <span
      className="hud-readout"
      data-testid="reading-now"
      aria-live="polite"
      title="Readers on this post right now (live)"
    >
      <span className="hud-live-dot" aria-hidden="true" />
      <span className="tabular-nums">{count}</span> reading now
    </span>
  )
}

export default ReadingNow
