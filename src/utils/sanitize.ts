import DOMPurify from 'dompurify'
import { isOwnStorageUrl } from '../lib/images'

// Post HTML is rendered with dangerouslySetInnerHTML, so it has to be
// cleaned first. DOMPurify's HTML profile drops scripts and event
// handlers. Images are a separate hole: I only keep an <img> whose src is
// this project's public Storage buckets, and I strip srcset so a cleaned
// src can't be paired with a remote candidate. That blocks tracking pixels
// and hotlinks, including from a guest post.
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.nodeName === 'IMG') {
    const src = node.getAttribute('src') ?? ''
    if (!isOwnStorageUrl(src)) {
      node.remove()
      return
    }
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
    node.removeAttribute('srcset')
  }
})

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } })
