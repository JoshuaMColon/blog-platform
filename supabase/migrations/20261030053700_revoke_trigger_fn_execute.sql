-- handle_new_user is security definer, so a signed-in user must not be able
-- to call it as /rest/v1/rpc/handle_new_user. I revoke EXECUTE from the API
-- roles. It only runs as the trigger on auth.users.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
