-- Lightweight card fields so list views don't download the full post HTML.
-- Both columns are generated from content, so they can never drift out of sync.

create or replace function public.html_to_text(html text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    replace(replace(replace(replace(replace(replace(
      regexp_replace(coalesce(html, ''), '<[^>]*>', ' ', 'g'),
      '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    '\s+', ' ', 'g'))
$$;

alter table public.posts
  add column if not exists excerpt text
    generated always as (left(public.html_to_text(content), 240)) stored,
  add column if not exists reading_minutes integer
    generated always as (
      greatest(1, ceil(coalesce(array_length(regexp_split_to_array(nullif(public.html_to_text(content), ''), ' '), 1), 0) / 200.0))::integer
    ) stored;
