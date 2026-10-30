-- Guest demo mode, part 2: sample content so the demo never looks empty, and an
-- hourly pg_cron job that removes anonymous (demo) users older than a day.
-- Their posts, comments, likes, follows and bookmarks go with them via the
-- existing ON DELETE CASCADE foreign keys. Idempotent and additive.

-- 1. A non-login "Blog Platform Team" author for the sample posts.
--    (No password is set, so nobody can sign in as this account.)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  'b10c0000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'team@blog-platform.demo', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, now(), now(), false
where not exists (
  select 1 from auth.users where id = 'b10c0000-0000-4000-8000-000000000001'
);

update public.profiles
set username = 'blog_team',
    bio = 'Sample posts for the Blog Platform guest demo.'
where id = 'b10c0000-0000-4000-8000-000000000001'
  and username <> 'blog_team';

-- 2. Sample posts (only inserted if their slug is not already taken).
insert into public.posts (user_id, title, slug, content, tags, published, created_at, updated_at)
select 'b10c0000-0000-4000-8000-000000000001', v.title, v.slug, v.content, v.tags, true,
       now() - v.age, now() - v.age
from (values
  ('Welcome to the Blog Platform demo',
   'welcome-to-the-blog-platform-demo',
   '<p>Thanks for stopping by! You are browsing as a <strong>guest</strong>, so you can try everything without creating an account.</p><h2>Things to try</h2><ul><li>Like this post with the heart button</li><li>Leave a comment at the bottom of a post</li><li>Bookmark a post and find it under <code>bookmarks()</code></li><li>Write your own post with the rich-text editor via <code>new_post()</code></li></ul><p>Guest accounts and anything they create are cleaned up automatically after a day.</p>',
   array['welcome','demo'], interval '3 hours'),
  ('How this blog is built: React, TypeScript and Supabase',
   'how-this-blog-is-built',
   '<p>The front end is <strong>React 19</strong> with <strong>TypeScript</strong>, styled with <strong>Tailwind CSS</strong> and animated with Framer Motion. Posts are written in a <strong>TipTap</strong> rich-text editor.</p><p>The back end is <strong>Supabase</strong>: Postgres for posts, comments, likes, follows and bookmarks, Supabase Auth for accounts, and Storage for cover images.</p><blockquote><p>Every table is protected with Row Level Security, so users can only edit or delete their own content.</p></blockquote>',
   array['react','typescript','supabase'], interval '1 day'),
  ('Row Level Security in practice',
   'row-level-security-in-practice',
   '<p>Row Level Security (RLS) moves authorization into the database. Instead of trusting the client, each table gets policies such as:</p><pre><code>create policy "Users can update own posts"
  on posts for update
  using (auth.uid() = user_id);</code></pre><p>Guest users in this demo run under the same policies, plus extra limits enforced by database triggers: a few posts per guest, length caps on posts and comments, and no file uploads.</p>',
   array['postgres','security'], interval '2 days'),
  ('Designing a terminal-inspired UI',
   'designing-a-terminal-inspired-ui',
   '<p>The interface borrows from the terminal: monospace type, <code>function()</code>-style navigation and window-chrome dots on every card.</p><p>Try the theme picker in the navbar to switch palettes, or press <code>t</code> on the sign-in screen to flip between light and dark.</p>',
   array['design','ui'], interval '3 days')
) as v(title, slug, content, tags, age)
where not exists (select 1 from public.posts p where p.slug = v.slug);

-- 3. Cleanup of old demo users.
create extension if not exists pg_cron;

create or replace function public.cleanup_demo_users()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from auth.users
  where is_anonymous = true
    and created_at < now() - interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.cleanup_demo_users() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'cleanup-demo-users';
select cron.schedule('cleanup-demo-users', '17 * * * *', $$select public.cleanup_demo_users();$$);
