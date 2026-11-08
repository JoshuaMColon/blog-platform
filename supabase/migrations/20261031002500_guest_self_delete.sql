-- A guest session can end itself. I delete the caller's auth.users row only
-- when it is anonymous, and the posts, comments, likes and profile go with
-- it through ON DELETE CASCADE. Both predicates matter: id = auth.uid()
-- stops this from deleting anyone else, and is_anonymous = true stops a
-- normal account from deleting itself by calling the same RPC. Images are
-- removed by the caller through the Storage API first; anything left is
-- orphaned and picked up by the hourly cleanup-demo-files sweep. The
-- Playwright guest tests use this so a CI run leaves nothing behind.
create or replace function public.end_guest_session()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from auth.users
   where id = (select auth.uid())
     and is_anonymous = true;
  get diagnostics removed = row_count;
  return removed = 1;
end;
$$;

revoke execute on function public.end_guest_session() from public, anon;
grant execute on function public.end_guest_session() to authenticated;
