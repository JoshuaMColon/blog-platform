-- Wrap auth.uid() in a scalar subquery so Postgres evaluates it once per
-- statement instead of once per row (Supabase advisor: auth_rls_initplan).
-- ALTER POLICY keeps each policy's name, command, roles and permissiveness;
-- only the expression is rewritten, so the semantics are unchanged.

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

-- New: authors can edit their own comments (demo length limits still apply
-- through the comments_demo_limits trigger).
drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments" on public.comments
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Keep a comment attached to its post and author when it is edited.
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
