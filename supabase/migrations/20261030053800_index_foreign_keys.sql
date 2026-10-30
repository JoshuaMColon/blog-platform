-- Advisor fix: cover foreign keys with indexes (speeds up feeds, per-post
-- comment lists, demo-limit counts and ON DELETE CASCADE cleanup).
create index if not exists bookmarks_post_id_idx on public.bookmarks (post_id);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists likes_user_id_idx on public.likes (user_id);
create index if not exists posts_user_id_idx on public.posts (user_id);
