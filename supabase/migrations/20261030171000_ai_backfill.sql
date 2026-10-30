-- Backfill: queue every published post for embedding + summary, then kick the workers.
-- Idempotent: the workers skip posts whose content_hash already matches.
insert into private.ai_jobs (post_id, kind)
select p.id, k.kind
from public.posts p
cross join (values ('embed'), ('summary')) as k(kind)
where p.published
on conflict (post_id, kind) do update
  set requested_at = now(), attempts = 0, last_error = null, locked_until = null;

select private.kick_ai_workers();
