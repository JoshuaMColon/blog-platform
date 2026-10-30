import DOMPurify from 'dompurify'
import { isOwnStorageUrl } from '../lib/images'

// Images in posts may only come from this project's Storage buckets, so posts
// cannot embed tracking pixels or hot-link arbitrary hosts.
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

// Post content is user-written HTML from the rich-text editor. Sanitize it
// before rendering so nobody (including demo guests) can inject scripts.
export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } })
