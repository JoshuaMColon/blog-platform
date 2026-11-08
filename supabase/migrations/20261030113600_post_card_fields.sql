-- List views were selecting the whole HTML body to show a snippet and a
-- reading time. Both are generated from content, stored, so they can't
-- drift, and the client asks for these columns instead of content.

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
