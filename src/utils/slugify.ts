import type { SupabaseClient } from '@supabase/supabase-js'

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove special characters
    .replace(/[\s_-]+/g, '-')   // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '')    // Remove leading/trailing hyphens
}

export const generateUniqueSlug = async (
  title: string,
  supabase: SupabaseClient,
  excludeId?: string
): Promise<string> => {
  const baseSlug = slugify(title)
  let slug = baseSlug
  let counter = 1

  while (true) {
    let query = supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query

    if (!data || data.length === 0) break

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}