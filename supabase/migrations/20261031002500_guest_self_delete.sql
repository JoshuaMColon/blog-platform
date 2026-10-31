-- Lets a guest (anonymous) session end itself: deletes the caller's own
-- anonymous auth user, and with it their posts, comments, likes and profile via
-- the existing ON DELETE CASCADE keys. Regular accounts are never touched
-- (is_anonymous must be true and the id must be the caller's).
-- Images are removed by the caller first through the Storage API; anything
-- left behind is orphaned and picked up by the hourly cleanup-demo-files sweep.
-- Used by the Playwright guest tests so CI runs leave nothing behind.
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
