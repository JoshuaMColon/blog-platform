import type { SupabaseClient } from "@supabase/supabase-js";

// Titles become URL slugs: lowercase, punctuation dropped, separators
// collapsed to a single hyphen.
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Check posts.slug until one is free. excludeId lets an edit keep the slug
// it already has instead of appending -1 to itself.
export const generateUniqueSlug = async (
  title: string,
  supabase: SupabaseClient,
  excludeId?: string,
): Promise<string> => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase.from("posts").select("id").eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query;

    if (!data || data.length === 0) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};
