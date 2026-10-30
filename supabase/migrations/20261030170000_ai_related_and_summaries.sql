-- AI features: pgvector embeddings for "Related posts" and TL;DR summaries.
-- Work is queued by a trigger on publish/update and done by two Edge Functions
-- (embed-post, summarize-post) that are only callable with the Vault internal token.
-- Clients can read results for posts they can see; nobody but service_role can write.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------- results
create table if not exists public.post_embeddings (
  post_id uuid primary key references public.posts (id) on delete cascade,
  embedding extensions.vector(384) not null,
  content_hash text not null,
  model text not null default 'gte-small',
  updated_at timestamptz not null default now()
);

create index if not exists post_embeddings_hnsw_idx
  on public.post_embeddings using hnsw (embedding extensions.vector_cosine_ops);

create table if not exists public.post_summaries (
  post_id uuid primary key references public.posts (id) on delete cascade,
  summary text not null check (char_length(summary) between 1 and 1200),
  source text not null check (source in ('llm', 'extractive')),
  content_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.post_embeddings enable row level security;
alter table public.post_summaries enable row level security;

revoke all on public.post_embeddings from anon, authenticated;
revoke all on public.post_summaries from anon, authenticated;
grant select on public.post_embeddings to anon, authenticated;
grant select on public.post_summaries to anon, authenticated;

create policy "Embeddings of visible posts are readable"
  on public.post_embeddings for select to anon, authenticated
  using (exists (select 1 from public.posts p
                 where p.id = post_id and (p.published or p.user_id = (select auth.uid()))));

create policy "Summaries of visible posts are readable"
  on public.post_summaries for select to anon, authenticated
  using (exists (select 1 from public.posts p
                 where p.id = post_id and (p.published or p.user_id = (select auth.uid()))));

-- ---------------------------------------------------------------- queue
create table if not exists private.ai_jobs (
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null check (kind in ('embed', 'summary')),
  requested_at timestamptz not null default now(),
  attempts integer not null default 0,
  locked_until timestamptz,
  last_error text,
  primary key (post_id, kind)
);

-- One row per processed job, for the per-author hourly rate limit.
create table if not exists private.ai_runs (
  id bigint generated always as identity primary key,
  author_id uuid not null,
  kind text not null,
  ran_at timestamptz not null default now()
);
create index if not exists ai_runs_author_kind_time_idx on private.ai_runs (author_id, kind, ran_at desc);

revoke all on private.ai_jobs from public, anon, authenticated;
revoke all on private.ai_runs from public, anon, authenticated;

-- Stable fingerprint of what the AI output depends on.
create or replace function private.post_ai_hash(p public.posts)
returns text
language sql
immutable
set search_path = ''
as $$
  select md5(coalesce(p.title, '') || E'\x1f' || coalesce(array_to_string(p.tags, ','), '') || E'\x1f' || coalesce(p.content, ''))
$$;
revoke all on function private.post_ai_hash(public.posts) from public, anon, authenticated;

-- Fire-and-forget call to both workers (pg_net only sends after commit).
create or replace function private.kick_ai_workers()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tok text := (select decrypted_secret from vault.decrypted_secrets where name = 'internal_fn_token');
  fn text;
begin
  if tok is null then
    return;
  end if;
  foreach fn in array array['embed-post', 'summarize-post'] loop
    perform net.http_post(
      url := 'https://ghhrqiwrnquyvgpnhhxd.supabase.co/functions/v1/' || fn,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', tok),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  end loop;
end;
$$;
revoke all on function private.kick_ai_workers() from public, anon, authenticated;

create or replace function private.enqueue_post_ai()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.published then
    return null;
  end if;
  if tg_op = 'UPDATE'
     and old.published
     and old.title is not distinct from new.title
     and old.content is not distinct from new.content
     and old.tags is not distinct from new.tags then
    return null;
  end if;

  insert into private.ai_jobs (post_id, kind)
  values (new.id, 'embed'), (new.id, 'summary')
  on conflict (post_id, kind) do update
    set requested_at = now(), attempts = 0, last_error = null, locked_until = null;

  perform private.kick_ai_workers();
  return null;
end;
$$;
revoke all on function private.enqueue_post_ai() from public, anon, authenticated;

drop trigger if exists posts_enqueue_ai on public.posts;
create trigger posts_enqueue_ai
  after insert or update of title, content, tags, published on public.posts
  for each row execute function private.enqueue_post_ai();

-- ---------------------------------------------------------------- worker RPCs (service_role only)
-- Claims up to max_jobs jobs of one kind. Skips unchanged posts, unpublished posts,
-- jobs that failed 5 times, and authors over 30 runs/hour (rate limit; they stay queued).
create or replace function public.ai_claim_jobs(job_kind text, max_jobs integer default 5)
returns table (post_id uuid, title text, content text, tags text[], content_hash text, requested_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  -- Drop jobs that no longer need work.
  delete from private.ai_jobs j
  using public.posts p
  where j.kind = job_kind and p.id = j.post_id
    and (not p.published
         or (job_kind = 'embed' and exists (select 1 from public.post_embeddings e
                                           where e.post_id = p.id and e.content_hash = private.post_ai_hash(p)))
         or (job_kind = 'summary' and exists (select 1 from public.post_summaries s
                                             where s.post_id = p.id and s.content_hash = private.post_ai_hash(p))));

  return query
  with picked as (
    select j.post_id, p.user_id
    from private.ai_jobs j
    join public.posts p on p.id = j.post_id
    where j.kind = job_kind
      and j.attempts < 5
      and (j.locked_until is null or j.locked_until < now())
      and (select count(*) from private.ai_runs r
           where r.author_id = p.user_id and r.kind = job_kind
             and r.ran_at > now() - interval '1 hour') < 30
    order by j.requested_at
    limit least(greatest(coalesce(max_jobs, 5), 1), 10)
    for update of j skip locked
  ),
  runs as (
    insert into private.ai_runs (author_id, kind)
    select pk.user_id, job_kind from picked pk
  ),
  locked as (
    update private.ai_jobs j
    set locked_until = now() + interval '2 minutes', attempts = j.attempts + 1
    from picked pk
    where j.post_id = pk.post_id and j.kind = job_kind
    returning j.post_id, j.requested_at
  )
  select p.id, p.title, p.content, p.tags, private.post_ai_hash(p), l.requested_at
  from locked l
  join public.posts p on p.id = l.post_id;
end;
$$;

create or replace function public.ai_complete_embedding(
  p_post_id uuid, p_embedding text, p_content_hash text, p_requested_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.post_embeddings (post_id, embedding, content_hash, updated_at)
  values (p_post_id, p_embedding::extensions.vector(384), p_content_hash, now())
  on conflict (post_id) do update
    set embedding = excluded.embedding, content_hash = excluded.content_hash, updated_at = now();
  -- Keep the job if the post was edited again while we were working.
  delete from private.ai_jobs where post_id = p_post_id and kind = 'embed' and requested_at <= p_requested_at;
  update private.ai_jobs set locked_until = null where post_id = p_post_id and kind = 'embed';
  perform realtime.send(jsonb_build_object('post_id', p_post_id, 'kind', 'embed'), 'ai', 'post:' || p_post_id::text, false);
end;
$$;

create or replace function public.ai_complete_summary(
  p_post_id uuid, p_summary text, p_source text, p_content_hash text, p_requested_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.post_summaries (post_id, summary, source, content_hash, updated_at)
  values (p_post_id, left(btrim(p_summary), 1200), p_source, p_content_hash, now())
  on conflict (post_id) do update
    set summary = excluded.summary, source = excluded.source,
        content_hash = excluded.content_hash, updated_at = now();
  delete from private.ai_jobs where post_id = p_post_id and kind = 'summary' and requested_at <= p_requested_at;
  update private.ai_jobs set locked_until = null where post_id = p_post_id and kind = 'summary';
  perform realtime.send(jsonb_build_object('post_id', p_post_id, 'kind', 'summary'), 'ai', 'post:' || p_post_id::text, false);
end;
$$;

create or replace function public.ai_fail_job(p_post_id uuid, job_kind text, p_error text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.ai_jobs
  set last_error = left(p_error, 500), locked_until = now() + interval '1 minute'
  where post_id = p_post_id and kind = job_kind;
$$;

revoke all on function public.ai_claim_jobs(text, integer) from public, anon, authenticated;
revoke all on function public.ai_complete_embedding(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.ai_complete_summary(uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.ai_fail_job(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ai_claim_jobs(text, integer) to service_role;
grant execute on function public.ai_complete_embedding(uuid, text, text, timestamptz) to service_role;
grant execute on function public.ai_complete_summary(uuid, text, text, text, timestamptz) to service_role;
grant execute on function public.ai_fail_job(uuid, text, text) to service_role;

-- ---------------------------------------------------------------- related posts (public)
create or replace function public.related_posts(p_post_id uuid, match_count integer default 3)
returns table (
  id uuid, slug text, title text, excerpt text, cover_image text, tags text[],
  created_at timestamptz, reading_minutes integer, similarity real
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  target extensions.vector(384);
begin
  -- RLS: you only get a vector for a post you can see.
  select e.embedding into target from public.post_embeddings e where e.post_id = p_post_id;
  if target is null then
    return;
  end if;

  return query
  select p.id, p.slug, p.title, p.excerpt, p.cover_image, p.tags, p.created_at, p.reading_minutes,
         (1 - (e.embedding operator(extensions.<=>) target))::real
  from public.post_embeddings e
  join public.posts p on p.id = e.post_id
  where e.post_id <> p_post_id and p.published
  order by e.embedding operator(extensions.<=>) target
  limit least(greatest(coalesce(match_count, 3), 1), 6);
end;
$$;
revoke all on function public.related_posts(uuid, integer) from public;
grant execute on function public.related_posts(uuid, integer) to anon, authenticated;

-- ---------------------------------------------------------------- schedules
-- Retry/safety net: kick the workers every 5 minutes while anything is queued.
select cron.unschedule('ai-jobs-retry') where exists (select 1 from cron.job where jobname = 'ai-jobs-retry');
select cron.schedule('ai-jobs-retry', '*/5 * * * *',
  $$ select private.kick_ai_workers() where exists (select 1 from private.ai_jobs where attempts < 5) $$);

select cron.unschedule('prune-ai-runs') where exists (select 1 from cron.job where jobname = 'prune-ai-runs');
select cron.schedule('prune-ai-runs', '23 4 * * *',
  $$ delete from private.ai_runs where ran_at < now() - interval '2 days' $$);
