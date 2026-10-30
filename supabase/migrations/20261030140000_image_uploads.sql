-- Image uploads: covers + in-editor images in public buckets, writes limited
-- to the uploader's own uid folder, small caps for demo guests, and a
-- scheduled sweep that removes guest/orphaned files through the Storage API.

-- 1) Buckets: public read via CDN URL, 2 MB cap, raster images only.
update storage.buckets
   set file_size_limit = 2097152,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'covers';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 2097152,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies. Public buckets serve /object/public/* without RLS, so no
--    broad SELECT policy is needed (it would only let clients list everyone's
--    files). Users may only see / write / delete inside "<their uid>/".
drop policy if exists "Anyone can view cover images" on storage.objects;
drop policy if exists "Authenticated users can upload cover images" on storage.objects;
drop policy if exists "Users can update their own cover images" on storage.objects;
drop policy if exists "Users can delete their own cover images" on storage.objects;
drop policy if exists "Demo users cannot upload files" on storage.objects;

create policy "Users can list their own images" on storage.objects
  for select to authenticated
  using (bucket_id in ('covers','post-images')
         and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload images to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('covers','post-images')
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update their own images" on storage.objects
  for update to authenticated
  using (bucket_id in ('covers','post-images')
         and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('covers','post-images')
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('covers','post-images')
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Guests: at most 5 stored images in total. Counted by a security-definer
-- helper (a policy that queries storage.objects itself recurses). It lives in
-- the non-exposed "private" schema, so it is not callable through the API.
create or replace function private.my_image_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from storage.objects
   where bucket_id in ('covers','post-images')
     and owner_id = (select auth.uid())::text;
$$;
revoke execute on function private.my_image_count() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.my_image_count() to authenticated;

create policy "Guests can store at most 5 images" on storage.objects
  as restrictive for insert to authenticated
  with check (not (select public.is_demo_user()) or (select private.my_image_count()) < 5);

-- 3) Demo limits: guests may now set a cover, but only one from their own folder.
create or replace function public.enforce_demo_limits()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  uid uuid := auth.uid();
  n int;
begin
  if not public.is_demo_user() then
    return new;
  end if;

  if tg_table_name = 'posts' then
    if char_length(coalesce(new.title, '')) > 120 then
      raise exception 'Demo limit: post titles can be at most 120 characters.' using errcode = 'P0001';
    end if;
    if char_length(coalesce(new.content, '')) > 10000 then
      raise exception 'Demo limit: posts can be at most 10,000 characters.' using errcode = 'P0001';
    end if;
    if coalesce(array_length(new.tags, 1), 0) > 5 then
      raise exception 'Demo limit: at most 5 tags per post.' using errcode = 'P0001';
    end if;
    if coalesce(new.cover_image, '') <> ''
       and new.cover_image not like
         'https://ghhrqiwrnquyvgpnhhxd.supabase.co/storage/v1/object/public/covers/' || uid::text || '/%' then
      raise exception 'Demo limit: guests can only use cover images they uploaded.' using errcode = 'P0001';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into n from public.posts where user_id = uid;
      if n >= 3 then
        raise exception 'Demo limit: guests can create up to 3 posts.' using errcode = 'P0001';
      end if;
    end if;
  elsif tg_table_name = 'comments' then
    if char_length(coalesce(new.content, '')) > 500 then
      raise exception 'Demo limit: comments can be at most 500 characters.' using errcode = 'P0001';
    end if;
    select count(*) into n from public.comments where user_id = uid;
    if n >= 20 then
      raise exception 'Demo limit: guests can post up to 20 comments.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'likes' then
    select count(*) into n from public.likes where user_id = uid;
    if n >= 50 then
      raise exception 'Demo limit: guests can like up to 50 posts.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'follows' then
    select count(*) into n from public.follows where follower_id = uid;
    if n >= 20 then
      raise exception 'Demo limit: guests can follow up to 20 people.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'bookmarks' then
    select count(*) into n from public.bookmarks where user_id = uid;
    if n >= 50 then
      raise exception 'Demo limit: guests can bookmark up to 50 posts.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'profiles' then
    if new.username is distinct from old.username then
      raise exception 'Demo limit: guests cannot change their username.' using errcode = 'P0001';
    end if;
    if char_length(coalesce(new.bio, '')) > 300 then
      raise exception 'Demo limit: bios can be at most 300 characters.' using errcode = 'P0001';
    end if;
    if new.avatar_url is distinct from old.avatar_url then
      raise exception 'Demo limit: guests cannot change their avatar.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$function$;

-- 4) Internal token so pg_cron / pg_net can call Edge Functions without any
--    project key. Stored in Vault; Edge Functions verify it through an RPC
--    that only the service role can execute.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'internal_fn_token') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'),
                                'internal_fn_token',
                                'Shared token for pg_net -> Edge Function calls');
  end if;
end $$;

create or replace function public.internal_token_ok(token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from vault.decrypted_secrets
                  where name = 'internal_fn_token' and decrypted_secret = token);
$$;
revoke execute on function public.internal_token_ok(text) from public, anon, authenticated;
grant execute on function public.internal_token_ok(text) to service_role;

-- Files to sweep: anything owned by a guest older than 23h (users themselves
-- are deleted at 24h) and anything whose owner no longer exists.
create or replace function public.demo_files_to_purge(max_rows int default 500)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.bucket_id, o.name
    from storage.objects o
    left join auth.users u on u.id::text = o.owner_id
   where o.bucket_id in ('covers','post-images')
     and o.owner_id is not null
     and (u.id is null
          or (u.is_anonymous and u.created_at < now() - interval '23 hours'))
   limit max_rows;
$$;
revoke execute on function public.demo_files_to_purge(int) from public, anon, authenticated;
grant execute on function public.demo_files_to_purge(int) to service_role;

-- 5) Hourly sweep via pg_net -> Edge Function (runs 10 min before user cleanup).
create extension if not exists pg_net with schema extensions;

select cron.unschedule('cleanup-demo-files')
 where exists (select 1 from cron.job where jobname = 'cleanup-demo-files');

select cron.schedule(
  'cleanup-demo-files',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://ghhrqiwrnquyvgpnhhxd.supabase.co/functions/v1/cleanup-demo-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-token', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
