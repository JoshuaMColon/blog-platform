export const calculateReadingTime = (content: string): number => {
  // Strip HTML tags to get plain text
  const plainText = content.replace(/<[^>]*>/g, '')
  
  // Average reading speed is 200 words per minute
  const words = plainText.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(words / 200)
  
  // Minimum 1 minute
  return Math.max(1, minutes)
}

export const formatReadingTime = (minutes: number): string => {
  if (minutes === 1) return '1 min read'
  return `${minutes} min read`
}
/**
 * Columns needed to render a post card. `excerpt` and `reading_minutes` are
 * generated columns in Postgres, so feeds never download full post bodies.
 */
export const POST_CARD_COLUMNS: string =
  'id, slug, title, excerpt, reading_minutes, tags, created_at, user_id, cover_image'
