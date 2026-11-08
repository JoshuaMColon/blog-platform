-- There is no roles table. A write is allowed when auth.uid() is the row's
-- owner (user_id, follower_id, or profiles.id). Posts are readable when
-- published, or when the reader is the author. I wrap auth.uid() in a
-- scalar subquery so Postgres evaluates it once per statement (initplan)
-- instead of once per row. ALTER POLICY keeps the name, command, roles and
-- permissiveness; only the expression changes, so who can do what stays
-- the same.

alter policy "Users can add bookmarks"      on public.bookmarks with check ((select auth.uid()) = user_id);
alter policy "Users can remove bookmarks"   on public.bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can view own bookmarks" on public.bookmarks using ((select auth.uid()) = user_id);

alter policy "Users can create comments"     on public.comments with check ((select auth.uid()) = user_id);
alter policy "Users can delete own comments" on public.comments using ((select auth.uid()) = user_id);

alter policy "Users can follow others" on public.follows with check ((select auth.uid()) = follower_id);
alter policy "Users can unfollow"      on public.follows using ((select auth.uid()) = follower_id);

alter policy "Users can add likes"        on public.likes with check ((select auth.uid()) = user_id);
alter policy "Users can remove own likes" on public.likes using ((select auth.uid()) = user_id);

alter policy "Published posts are viewable by everyone" on public.posts using ((published = true) or ((select auth.uid()) = user_id));
alter policy "Users can create posts"     on public.posts with check ((select auth.uid()) = user_id);
alter policy "Users can delete own posts" on public.posts using ((select auth.uid()) = user_id);
alter policy "Users can update own posts" on public.posts using ((select auth.uid()) = user_id);

alter policy "Users can insert own profile" on public.profiles with check ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.profiles using ((select auth.uid()) = id);

-- Authors can edit their own comments. WITH CHECK repeats the owner test
-- so the update can't hand the row to someone else. Demo length limits
-- still apply through comments_demo_limits.
drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments" on public.comments
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- PostgREST will write whichever columns the client sends. I force
-- post_id, user_id and created_at back to the old values, so an edit can
-- change the text and nothing else. Not security definer: it doesn't need
-- to bypass RLS, it only rewrites NEW. EXECUTE is revoked so it isn't an RPC.
create or replace function public.lock_comment_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.post_id := old.post_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;
revoke execute on function public.lock_comment_identity() from public, anon, authenticated;

drop trigger if exists comments_lock_identity on public.comments;
create trigger comments_lock_identity
  before update on public.comments
  for each row execute function public.lock_comment_identity();
