import DOMPurify from 'dompurify'

// Post content is user-written HTML from the rich-text editor. Sanitize it
// before rendering so nobody (including demo guests) can inject scripts.
export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } })
