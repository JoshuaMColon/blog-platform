import { Fragment } from 'react'

// search_posts() wraps matches in U+E000 … U+E001 (never HTML), so we can render
// highlights as React nodes without dangerouslySetInnerHTML.
const OPEN = '\uE000'
const CLOSE = '\uE001'

export const stripMarks = (text: string) => text.replaceAll(OPEN, '').replaceAll(CLOSE, '')

const Highlight = ({ text }: { text: string }) => {
  const parts: { text: string; hit: boolean }[] = []
  for (const chunk of text.split(OPEN)) {
    const close = chunk.indexOf(CLOSE)
    if (close === -1) {
      if (chunk) parts.push({ text: chunk, hit: false })
      continue
    }
    if (close > 0) parts.push({ text: chunk.slice(0, close), hit: true })
    const rest = chunk.slice(close + 1).replaceAll(CLOSE, '')
    if (rest) parts.push({ text: rest, hit: false })
  }
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? <mark key={i} className="hud-mark">{p.text}</mark> : <Fragment key={i}>{p.text}</Fragment>,
      )}
    </>
  )
}

export default Highlight
