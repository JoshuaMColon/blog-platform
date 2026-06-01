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