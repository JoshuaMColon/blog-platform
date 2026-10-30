-- Guest demo mode: Supabase anonymous sign-in support, abuse limits for
-- anonymous (demo) users, and hardening of the signup trigger.
-- Additive only: no existing tables, columns or policies are dropped.

-- 1. Helper: is the current request from an anonymous (demo) user?
create or replace function public.is_demo_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- 2. Signup trigger: anonymous users have no email, and profiles.username is
--    NOT NULL + UNIQUE, so give guests a generated handle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.email, 'guest_' || left(replace(new.id::text, '-', ''), 8))
  );
  return new;
end;
$$;

-- 3. Limits for demo users, enforced server-side by BEFORE INSERT/UPDATE triggers.
create or replace function public.enforce_demo_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
    if new.cover_image is not null and new.cover_image <> '' then
      raise exception 'Demo limit: cover images are disabled in the demo.' using errcode = 'P0001';
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
$$;

revoke execute on function public.enforce_demo_limits() from public, anon, authenticated;

drop trigger if exists posts_demo_limits on public.posts;
create trigger posts_demo_limits before insert or update on public.posts
  for each row execute function public.enforce_demo_limits();
drop trigger if exists comments_demo_limits on public.comments;
create trigger comments_demo_limits before insert or update on public.comments
  for each row execute function public.enforce_demo_limits();
drop trigger if exists likes_demo_limits on public.likes;
create trigger likes_demo_limits before insert on public.likes
  for each row execute function public.enforce_demo_limits();
drop trigger if exists follows_demo_limits on public.follows;
create trigger follows_demo_limits before insert on public.follows
  for each row execute function public.enforce_demo_limits();
drop trigger if exists bookmarks_demo_limits on public.bookmarks;
create trigger bookmarks_demo_limits before insert on public.bookmarks
  for each row execute function public.enforce_demo_limits();
drop trigger if exists profiles_demo_limits on public.profiles;
create trigger profiles_demo_limits before update on public.profiles
  for each row execute function public.enforce_demo_limits();

-- 4. Demo users cannot upload to storage (restrictive policy, ANDed with the
--    existing "Authenticated users can upload cover images" policy).
drop policy if exists "Demo users cannot upload files" on storage.objects;
create policy "Demo users cannot upload files"
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (not public.is_demo_user());
