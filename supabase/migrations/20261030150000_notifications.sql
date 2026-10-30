-- Notifications: someone followed you, liked your post or commented on it.
-- Rows are written only by SECURITY DEFINER triggers (clients cannot insert),
-- you never get notified about your own actions, and RLS lets each user read,
-- mark-read and delete only their own rows. A private Realtime channel
-- (user:<uid>) pings the recipient so the navbar badge updates live; the
-- message carries no content, the client re-reads through RLS.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,  -- recipient
  actor_id    uuid not null references public.profiles(id) on delete cascade,  -- who did it
  type        text not null check (type in ('follow', 'like', 'comment')),
  post_id     uuid references public.posts(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint notifications_not_self check (user_id <> actor_id),
  constraint notifications_post_shape check ((type = 'follow') = (post_id is null)),
  constraint notifications_comment_shape check ((type = 'comment') = (comment_id is not null))
);

-- One "liked your post" / "followed you" per actor (re-liking does not spam).
create unique index if not exists notifications_once_per_actor
  on public.notifications (user_id, actor_id, type, post_id) nulls not distinct
  where type in ('like', 'follow');
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;
create index if not exists notifications_actor_id_idx on public.notifications (actor_id);
create index if not exists notifications_post_id_idx on public.notifications (post_id);
create index if not exists notifications_comment_id_idx on public.notifications (comment_id);

alter table public.notifications enable row level security;

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;  -- only read_at is writable

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Writers (triggers on the social tables)
-- ---------------------------------------------------------------------------
create or replace function private.notify_follow()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.following_id <> new.follower_id then
      insert into public.notifications (user_id, actor_id, type)
      values (new.following_id, new.follower_id, 'follow')
      on conflict do nothing;
    end if;
    return null;
  end if;
  -- unfollow: the notification is no longer true
  delete from public.notifications
   where type = 'follow' and user_id = old.following_id and actor_id = old.follower_id;
  return null;
end;
$$;

create or replace function private.notify_like()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
begin
  if tg_op = 'INSERT' then
    select p.user_id into author from public.posts p where p.id = new.post_id;
    if author is not null and author <> new.user_id then
      insert into public.notifications (user_id, actor_id, type, post_id)
      values (author, new.user_id, 'like', new.post_id)
      on conflict do nothing;
    end if;
    return null;
  end if;
  delete from public.notifications
   where type = 'like' and post_id = old.post_id and actor_id = old.user_id;
  return null;
end;
$$;

create or replace function private.notify_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
begin
  select p.user_id into author from public.posts p where p.id = new.post_id;
  if author is not null and author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_id)
    values (author, new.user_id, 'comment', new.post_id, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists follows_notify on public.follows;
create trigger follows_notify after insert or delete on public.follows
  for each row execute function private.notify_follow();
drop trigger if exists likes_notify on public.likes;
create trigger likes_notify after insert or delete on public.likes
  for each row execute function private.notify_like();
drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments
  for each row execute function private.notify_comment();
-- (deleting a comment removes its notification through the comment_id FK)

-- ---------------------------------------------------------------------------
-- Live badge: one tiny private broadcast per affected recipient per statement
-- ---------------------------------------------------------------------------
create or replace function private.broadcast_notification_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select distinct user_id from changed loop
    perform realtime.send(jsonb_build_object('op', 'insert'), 'notifications', 'user:' || r.user_id::text, true);
  end loop;
  return null;
end;
$$;

create or replace function private.broadcast_notification_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select distinct user_id from changed loop
    perform realtime.send(jsonb_build_object('op', lower(tg_op)), 'notifications', 'user:' || r.user_id::text, true);
  end loop;
  return null;
end;
$$;

drop trigger if exists notifications_broadcast_insert on public.notifications;
create trigger notifications_broadcast_insert after insert on public.notifications
  referencing new table as changed
  for each statement execute function private.broadcast_notification_insert();
drop trigger if exists notifications_broadcast_update on public.notifications;
create trigger notifications_broadcast_update after update on public.notifications
  referencing new table as changed
  for each statement execute function private.broadcast_notification_change();
drop trigger if exists notifications_broadcast_delete on public.notifications;
create trigger notifications_broadcast_delete after delete on public.notifications
  referencing old table as changed
  for each statement execute function private.broadcast_notification_change();

revoke execute on function private.notify_follow(), private.notify_like(), private.notify_comment(),
  private.broadcast_notification_insert(), private.broadcast_notification_change()
  from public, anon, authenticated;

-- Only you can join your private user:<uid> channel. No INSERT policy, so
-- clients cannot broadcast on private channels themselves.
drop policy if exists "Users can receive their own notification pings" on realtime.messages;
create policy "Users can receive their own notification pings"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) = 'user:' || (select auth.uid())::text
  );

-- Keep the table small: drop notifications older than 90 days, nightly.
select cron.unschedule('prune-notifications')
  where exists (select 1 from cron.job where jobname = 'prune-notifications');
select cron.schedule('prune-notifications', '17 4 * * *',
  $$delete from public.notifications where created_at < now() - interval '90 days'$$);
