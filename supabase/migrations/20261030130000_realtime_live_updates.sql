-- Live updates over Supabase Realtime.
-- Database triggers broadcast small "something changed" events on public
-- channels; clients re-read through the normal RLS-protected API, so no row
-- data that a reader could not already see is ever pushed.
--   post:<post_id>  event 'likes'    -> { post_id, count }
--   post:<post_id>  event 'comments' -> { post_id, op }
--   feed            event 'new_post' -> { id }   (only once a post is published)
-- Presence ("N reading now") uses the same post:<id> channel and needs no SQL.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.broadcast_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.post_id, old.post_id);
  n int;
begin
  select count(*) into n from public.likes where post_id = pid;
  perform realtime.send(
    jsonb_build_object('post_id', pid, 'count', n),
    'likes', 'post:' || pid::text, false);
  return null;
end;
$$;

create or replace function private.broadcast_comment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.post_id, old.post_id);
begin
  perform realtime.send(
    jsonb_build_object('post_id', pid, 'op', lower(tg_op)),
    'comments', 'post:' || pid::text, false);
  return null;
end;
$$;

create or replace function private.broadcast_new_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.published and (tg_op = 'INSERT' or not coalesce(old.published, false)) then
    perform realtime.send(jsonb_build_object('id', new.id), 'new_post', 'feed', false);
  end if;
  return null;
end;
$$;

revoke execute on function private.broadcast_like_change() from public, anon, authenticated;
revoke execute on function private.broadcast_comment_change() from public, anon, authenticated;
revoke execute on function private.broadcast_new_post() from public, anon, authenticated;

drop trigger if exists likes_broadcast on public.likes;
create trigger likes_broadcast after insert or delete on public.likes
  for each row execute function private.broadcast_like_change();

drop trigger if exists comments_broadcast on public.comments;
create trigger comments_broadcast after insert or update or delete on public.comments
  for each row execute function private.broadcast_comment_change();

drop trigger if exists posts_broadcast_new on public.posts;
create trigger posts_broadcast_new after insert or update of published on public.posts
  for each row execute function private.broadcast_new_post();
