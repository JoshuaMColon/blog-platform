import { supabase } from './supabase'

export interface PostSummary {
  summary: string
  source: 'llm' | 'extractive'
  updated_at: string
}

export interface RelatedPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  tags: string[] | null
  created_at: string
  reading_minutes: number
  /** cosine similarity 0..1, or null when found by shared tags (fallback) */
  similarity: number | null
}

/** TL;DR from post_summaries. Select is open for posts this session can
 *  already see; the worker is the only writer. Null until that job finishes. */
export const fetchSummary = async (postId: string): Promise<PostSummary | null> => {
  const { data } = await supabase
    .from('post_summaries')
    .select('summary, source, updated_at')
    .eq('post_id', postId)
    .maybeSingle()
  return (data as PostSummary | null) ?? null
}

/**
 * related_posts runs as the caller, so RLS still applies and it only
 * returns published posts. Until the embedding exists I fall back to posts
 * that share a tag, and leave similarity null so the card can tell.
 */
export const fetchRelated = async (postId: string, tags: string[], count = 3): Promise<RelatedPost[]> => {
  const { data } = await supabase.rpc('related_posts', { p_post_id: postId, match_count: count })
  if (data && data.length) return data as RelatedPost[]
  if (!tags.length) return []
  const { data: byTag } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, cover_image, tags, created_at, reading_minutes')
    .eq('published', true)
    .neq('id', postId)
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })
    .limit(count)
  return ((byTag ?? []) as Omit<RelatedPost, 'similarity'>[]).map(p => ({ ...p, similarity: null }))
}
