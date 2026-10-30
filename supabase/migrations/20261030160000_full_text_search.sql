-- Full-text search over posts: weighted tsvector (title A, tags B, content C) + GIN index,
-- and a ranked, highlighted search RPC that runs with the caller's rights (RLS applies).

-- HTML -> plain text (tags stripped, common entities decoded). Immutable so it can feed a generated column.
create or replace function private.post_plaintext(html text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select regexp_replace(
    replace(replace(replace(replace(replace(replace(
      regexp_replace(coalesce(html, ''), '<[^>]*>', ' ', 'g'),
      '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    '\s+', ' ', 'g')
$$;

-- array_to_string is only STABLE, so wrap it for the generated column.
create or replace function private.tags_text(tags text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$ select coalesce(array_to_string(tags, ' '), '') $$;

revoke all on function private.post_plaintext(text) from public;
revoke all on function private.tags_text(text[]) from public;
-- private is not exposed by the API; anon/authenticated need USAGE only so search_posts (security invoker)
-- can call post_plaintext. Every other function in private has EXECUTE revoked from them.
grant usage on schema private to anon, authenticated;
-- Needed so inserts/updates by signed-in users can compute the generated column.
grant execute on function private.post_plaintext(text) to anon, authenticated, service_role;
grant execute on function private.tags_text(text[]) to anon, authenticated, service_role;

alter table public.posts
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, private.tags_text(tags)), 'B') ||
    setweight(to_tsvector('english'::regconfig, private.post_plaintext(content)), 'C')
  ) stored;

create index if not exists posts_search_tsv_idx on public.posts using gin (search_tsv);

-- Ranked search. Plain input is matched as you type (every word as a prefix, AND-ed);
-- input with quotes, "-word" or "or" uses web-search syntax. Highlights are marked with
-- U+E000 / U+E001 so the client renders them as <mark> without trusting HTML.
create or replace function public.search_posts(q text, page_size integer default 20, page_offset integer default 0)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  reading_minutes integer,
  tags text[],
  created_at timestamptz,
  user_id uuid,
  cover_image text,
  username text,
  rank real,
  title_highlight text,
  snippet text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  input text := left(btrim(coalesce(q, '')), 200);
  words text[];
  tsq tsquery;
  sel_on constant text := chr(57344);
  sel_off constant text := chr(57345);
begin
  if input = '' then
    return;
  end if;

  if input ~ '"' or input ~ '(^|\s)-\S' or input ~* '\sor\s' then
    tsq := websearch_to_tsquery('english'::regconfig, input);
  else
    select array_agg(w) into words
    from (
      select w
      from regexp_split_to_table(lower(regexp_replace(input, '[^[:alnum:]]+', ' ', 'g')), '\s+') as w
      where w <> ''
      limit 8
    ) s;
    if words is null then
      return;
    end if;
    tsq := to_tsquery('english'::regconfig,
      (select string_agg(w || ':*', ' & ') from unnest(words) as w));
  end if;

  if tsq is null or numnode(tsq) = 0 then
    return;
  end if;

  return query
  with matches as (
    select p.id, p.slug, p.title, p.excerpt, p.reading_minutes, p.tags, p.created_at,
           p.user_id, p.cover_image, p.content,
           ts_rank_cd(p.search_tsv, tsq, 32) as rank,
           count(*) over () as total_count
    from public.posts p
    where p.published
      and p.search_tsv @@ tsq
    order by rank desc, p.created_at desc
    limit least(greatest(coalesce(page_size, 20), 1), 50)
    offset greatest(coalesce(page_offset, 0), 0)
  )
  select m.id, m.slug, m.title, m.excerpt, m.reading_minutes, m.tags, m.created_at,
         m.user_id, m.cover_image, pr.username, m.rank,
         ts_headline('english'::regconfig, m.title, tsq,
           'HighlightAll=true, StartSel=' || sel_on || ', StopSel=' || sel_off),
         ts_headline('english'::regconfig, private.post_plaintext(m.content), tsq,
           'MaxFragments=2, MaxWords=26, MinWords=10, FragmentDelimiter=" … ", StartSel=' || sel_on || ', StopSel=' || sel_off),
         m.total_count
  from matches m
  left join public.profiles pr on pr.id = m.user_id
  order by m.rank desc, m.created_at desc;
end;
$$;

revoke all on function public.search_posts(text, integer, integer) from public;
grant execute on function public.search_posts(text, integer, integer) to anon, authenticated;
