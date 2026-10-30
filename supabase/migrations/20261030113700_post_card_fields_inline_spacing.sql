-- Refine html_to_text: block-level tags become spaces, inline tags (strong, em,
-- code, a, ...) are removed without adding a space, so "<strong>guest</strong>,"
-- reads "guest," rather than "guest ,". Stored generated columns are not
-- recomputed when their function changes, so the two card columns are rebuilt.

alter table public.posts drop column if exists excerpt, drop column if exists reading_minutes;

create or replace function public.html_to_text(html text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    replace(replace(replace(replace(replace(replace(
      regexp_replace(
        regexp_replace(coalesce(html, ''), '</?(p|div|br|hr|h[1-6]|li|ul|ol|blockquote|pre|tr|td|th|table)(\s[^>]*)?/?>', ' ', 'gi'),
        '<[^>]*>', '', 'g'),
      '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    '\s+', ' ', 'g'))
$$;

alter table public.posts
  add column excerpt text
    generated always as (left(public.html_to_text(content), 240)) stored,
  add column reading_minutes integer
    generated always as (
      greatest(1, ceil(coalesce(array_length(regexp_split_to_array(nullif(public.html_to_text(content), ''), ' '), 1), 0) / 200.0))::integer
    ) stored;
