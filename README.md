# Blog Platform

[![CI](https://github.com/JoshuaMColon/blog-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JoshuaMColon/blog-platform/actions/workflows/ci.yml)

A full-stack blogging app built with React 19, TypeScript, Tailwind CSS and Supabase. It covers sign-up and login, a TipTap rich-text editor, comments, likes, follows, bookmarks, tag search and a one-click guest demo, with Postgres row-level security (RLS) doing the access control.

**Live:** https://blog-platform-one-xi.vercel.app

> A portfolio project. It's a working app with real auth and data, not a hardened production service; see [Known limits](#known-limits).

---

## Features

- **Auth**: email/password sign-up and login, plus an optional anonymous **guest demo**
- **Posts**: create, edit, delete, draft or publish, with tags, a cover image and rich text (TipTap)
- **Image uploads**: cover images and inline editor images (button, paste or drop), resized and compressed to WebP in the browser, stored in Supabase Storage under each user's own folder
- **Social**: comments (edit and delete your own), likes, follows, bookmarks and a following feed
- **Notifications**: get notified when someone follows you, likes your post or comments on it. A navbar bell shows a live unread badge (private Realtime channel), with a dropdown, a full `/notifications` page and mark-as-read
- **Live updates**: comments and like counts update in real time, the feed shows an "N new posts" pill, and post pages show how many people are reading right now (Supabase Realtime broadcast + presence)
- **Discovery**: ranked Postgres full-text search over titles, tags and content (prefix matching as you type, `"phrases"` and `-exclusions`, highlighted snippets, covers on results), plus tag filters
- **AI**: a **TL;DR** panel on every post and **Related posts** found by meaning (pgvector + the built-in `gte-small` embedding model). Both are computed by Edge Functions on publish/update; summaries use an LLM when `OPENAI_API_KEY` is set and a local extractive summarizer otherwise
- **Themes**: five colour themes with a light/dark toggle
- **Feel**: subtle press feedback on every control (mouse and touch), spinners on async actions, and optimistic likes that roll back if the write fails
- **SEO**: per-page titles, meta description, Open Graph/Twitter cards, `robots.txt` and a generated `sitemap.xml`

---

## Technology Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Frontend   | React 19 + TypeScript, Vite, React Router 7    |
| Styling    | Tailwind CSS, framer-motion                    |
| Editor     | TipTap (lazy-loaded on the create/edit routes) |
| Backend    | Supabase (Auth, Postgres + RLS, Realtime, Storage, Cron) |
| Testing/CI | GitHub Actions, ESLint, TypeScript, Playwright |
| Deployment | Vercel (SPA rewrite in `vercel.json`)          |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/JoshuaMColon/blog-platform.git
   cd blog-platform
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure environment variables

   Create a `.env` file in the project root:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Initialize the Supabase schema

   The base tables (`profiles`, `posts`, `comments`, `likes`, `follows`, `bookmarks`) were created in the Supabase dashboard and aren't in this repo yet. Everything added since then (guest demo, RLS tuning, generated excerpt/reading-time columns) is in `supabase/migrations/`.

5. Start the development server

   ```bash
   npm run dev
   ```

   Open http://localhost:5173.

6. Checks and tests

   ```bash
   npm run typecheck && npm run lint && npm run build
   npx playwright install chromium   # first run only
   npm run test:e2e                  # builds, serves with vite preview, runs Playwright
   ```

   Set `BASE_URL=https://your-preview.vercel.app` to run the same tests against a deployed preview.

---

## Usage

### Visitor Experience

- Post pages (`/post/<slug>`) and search are public; the home feed, following, bookmarks and all writes need an account or the guest demo

### Author Workflow

- Create a new post with title, tags, cover image, and rich text content
- Publish posts publicly or keep them as drafts for later editing
- Update or remove any post authored by the signed-in user

### Interaction Features

- Leave comments on posts, and edit or delete your own
- Like or unlike posts, follow authors and bookmark posts
- Get follow / like / comment notifications in the navbar bell and on `/notifications`
- Pick one of five themes and toggle light/dark

---

## Project Structure

```
src/
├── components/        # Reusable UI components and feature widgets
├── context/           # Global auth and theme providers
├── hooks/             # useDocumentTitle (per-page title/meta)
├── lib/               # Supabase client, shared Realtime channels, image upload helpers, notifications store, AI reads
├── pages/             # Route-based page components (heavy ones lazy-loaded)
├── utils/             # sanitising, slugs, reading time, press feedback
└── App.tsx            # Application routes and providers
e2e/                   # Playwright tests
scripts/               # generate-sitemap.mjs (runs after vite build)
supabase/migrations/   # SQL migrations
supabase/functions/    # Edge Functions (Deno): cleanup-demo-files, embed-post, summarize-post
```

---

## Guest demo mode

The login screen has a **Try the demo** button that signs visitors in with Supabase anonymous auth.

Linking to **`/demo`** (an alias for `/login?demo=1`) starts the guest session straight away, so a link from elsewhere (like the portfolio) lands in the demo in one click. Visitors who are already signed in just go to the feed, and if anonymous sign-ins are off the login screen explains that instead.

- Guests can read everything and create posts, comments, likes, follows and bookmarks within small caps (3 posts, 20 comments, 50 likes, 5 images, length limits). RLS still stops them editing or deleting anyone else's content.
- A **DEMO** badge shows in the navbar while you're signed in as a guest.
- A `pg_cron` job (`cleanup-demo-users`, hourly) deletes anonymous users older than 24 hours. Their content goes with them through cascading foreign keys.
- A second job (`cleanup-demo-files`, hourly) calls an Edge Function that deletes guests' uploaded images (and any orphaned files) through the Storage API.
- Sample posts are seeded by the `blog_team` account.
- **Requires:** Supabase Dashboard → Authentication → Sign In / Providers → **Allow anonymous sign-ins**. Until that's on, the button shows a friendly "not switched on yet" message.

Database changes live in `supabase/migrations/`.

### How access control works

```mermaid
flowchart TD
    V[Visitor] -->|email + password| U[Authenticated user]
    V -->|Try the demo| G["Anonymous guest<br/>(is_anonymous = true)"]
    U --> API[Supabase REST API]
    G --> API
    API --> RLS{"RLS policies<br/>(select auth.uid()) = user_id"}
    RLS -->|own rows only| W["insert / update / delete<br/>posts, comments, likes,<br/>follows, bookmarks, profile"]
    RLS -->|anyone| R["read published posts,<br/>comments, likes, profiles"]
    G --> T{"Demo-limit triggers"}
    T -->|"over cap: 3 posts, 20 comments,<br/>50 likes, 5 images, length limits"| X["Error: Demo limit ..."]
    T -->|"within cap"| RLS
    C["pg_cron: cleanup-demo-users<br/>(hourly)"] -->|"delete guests older than 24h<br/>(content cascades)"| G
```

- Every write policy checks ownership with `(select auth.uid())`, so Postgres evaluates it once per query instead of once per row.
- A `BEFORE UPDATE` trigger on `comments` stops `post_id`, `user_id` and `created_at` from changing when someone edits a comment.
- `posts.excerpt` and `posts.reading_minutes` are generated columns, so feed cards never download full post bodies.

---

## Live updates (Realtime)

Database triggers broadcast small "something changed" events on **public** Realtime channels. Clients then re-read through the normal RLS-protected API, so a broadcast never carries row data a reader couldn't already see (drafts never trigger anything).

| Channel          | Event      | Sent when                                   | Client reaction                       |
| ---------------- | ---------- | ------------------------------------------- | ------------------------------------- |
| `post:<post_id>` | `likes`    | a like is added or removed                  | like button re-reads count and state  |
| `post:<post_id>` | `comments` | a comment is added, edited or deleted       | comment list re-reads                 |
| `post:<post_id>` | presence   | a tab opens or leaves the post              | "N reading now" counter               |
| `feed`           | `new_post` | a post is inserted published, or published  | "↑ N new posts" pill on the feed      |

```mermaid
sequenceDiagram
    participant A as Reader A (post page)
    participant RT as Supabase Realtime
    participant DB as Postgres
    participant B as Reader B
    A->>RT: join post:<id> (broadcast + presence)
    B->>RT: join post:<id>
    RT-->>A: presence sync (2 reading now)
    B->>DB: insert comment (RLS: own user_id)
    DB->>RT: trigger: realtime.send('comments', post:<id>)
    RT-->>A: comments event
    A->>DB: select comments (RLS)
```

`src/lib/realtime.ts` keeps **one ref-counted channel per topic** (the like button, comments and presence counter on a post page share it), and every component unsubscribes on unmount; the socket channel is removed shortly after its last user goes away.

---

## Notifications

`public.notifications` holds one row per event for the **recipient** (`user_id`), written only by `security definer` triggers in the non-exposed `private` schema:

| Source table | Trigger | Notification | Undo |
| --- | --- | --- | --- |
| `follows` | `follows_notify` | `follow` → `/profile/<actor>` | unfollow deletes it |
| `likes` | `likes_notify` | `like` → `/post/<slug>` | unlike deletes it |
| `comments` | `comments_notify` | `comment` → `/post/<slug>#comments` | deleting the comment cascades |

- **Never yourself:** triggers skip self-actions and a `check (user_id <> actor_id)` backs that up. Likes and follows are de-duplicated with a unique index, so liking, unliking and liking again leaves one notification.
- **RLS:** clients can only `select`/`delete` their own rows and only `update (read_at)` (column-level grant). There is no insert grant at all. Rows older than 90 days are pruned by `pg_cron`.
- **Live badge:** a statement-level trigger sends one tiny `{op}` ping per affected recipient with `realtime.send(..., 'user:<uid>', private => true)`. An RLS policy on `realtime.messages` only lets `auth.uid()` join its own `user:<uid>` topic, and the client then re-reads its notifications through RLS, so the ping carries no data.

```mermaid
sequenceDiagram
    participant B as User B
    participant DB as Postgres
    participant RT as Supabase Realtime (private)
    participant A as User A (bell)
    A->>RT: join user:<A> (RLS on realtime.messages)
    B->>DB: insert like on A's post
    DB->>DB: likes_notify → insert notifications (user_id = A)
    DB->>RT: statement trigger: realtime.send('notifications', user:<A>, private)
    RT-->>A: ping
    A->>DB: select notifications (RLS: own rows) → badge + dropdown
    A->>DB: update read_at (mark as read) → ping → other tabs update
```

`src/lib/notifications.ts` keeps one shared store per signed-in user (read through `useSyncExternalStore`), so the bell, the dropdown and the page share one channel and one unread count across components.

---

## Full-text search

`posts.search_tsv` is a **stored generated** `tsvector` (title weight **A**, tags **B**, content **C** with HTML stripped by `private.post_plaintext`) with a **GIN** index, so it can never drift from the post and needs no trigger.

`public.search_posts(q, page_size, page_offset)` is a `security invoker` RPC (RLS still applies, and it only returns published posts):

- **Query parsing:** plain input matches every word as a prefix (`row lev` finds "Row Level Security"); input with quotes, `-word` or `or` uses `websearch_to_tsquery`. Stop-word-only or junk input returns nothing instead of erroring.
- **Ranking:** `ts_rank_cd` (normalised by length), newest first on ties. `page_size` is clamped to 1–50 and a `total_count` comes back for "load more".
- **Highlights:** `ts_headline` for the title and a two-fragment content snippet. Matches are wrapped in the private-use characters U+E000/U+E001 instead of HTML, and `Highlight.tsx` turns them into `<mark>` elements, so no server HTML is ever injected.

```mermaid
flowchart LR
    I["/search?q=row lev"] -->|debounced 250 ms| R["rpc search_posts(q)"]
    R --> Q{"quotes / -word / or?"}
    Q -->|yes| W[websearch_to_tsquery]
    Q -->|no| P["to_tsquery('row:* & lev:*')"]
    W --> G[("GIN posts_search_tsv_idx")]
    P --> G
    G --> K["ts_rank_cd + ts_headline<br/>(published only, RLS)"]
    K --> C["cards: cover, highlighted title + snippet"]
```

---

## AI: TL;DR and related posts

Nothing AI runs in the browser and no key ships to the client. Two queue workers run as **Edge Functions** (`verify_jwt` off, authenticated by the Vault `internal_fn_token` like the cleanup job):

- **`embed-post`** embeds title + tags + plain text (first ~2,000 chars) with Supabase's built-in **`gte-small`** model (384 dims, normalised, no API key) into `public.post_embeddings` (`extensions.vector(384)`, **HNSW** cosine index).
- **`summarize-post`** writes `public.post_summaries`. If the **`OPENAI_API_KEY`** Edge Function secret is set it asks `gpt-4o-mini` (override with `OPENAI_MODEL`) for a 2-3 sentence summary; otherwise, or if that call fails, it uses an **extractive** summarizer (term-frequency sentence scoring with title and position bonuses, code blocks skipped, top 3 sentences in order). The panel labels which one wrote it.

**When it runs:** an `after insert/update of title, content, tags, published` trigger queues both jobs in `private.ai_jobs` (re-edits coalesce into one row) and pokes both workers via `pg_net`. A `pg_cron` job (`ai-jobs-retry`, every 5 min) re-pokes them while work is queued. Each job stores a `content_hash`, so unchanged posts are skipped, and an edit made mid-run re-queues instead of being lost. Migration `20261030171000_ai_backfill.sql` queues every existing published post.

**Rate limiting:** each author gets at most **30 runs per hour per kind** (tracked in `private.ai_runs`). Extra work stays queued for the cron retry. Each invocation takes at most 3 batches of 5 jobs, and a job is dropped after 5 failed attempts.

**Access:** anyone can `select` embeddings and summaries of posts they can see (published, or their own draft). Only `service_role` can write, and the worker RPCs (`ai_claim_jobs`, `ai_complete_*`, `ai_fail_job`) are `service_role`-only. `public.related_posts(p_post_id, match_count)` is `security invoker`: it returns the nearest published posts with a `similarity` score, capped at 6. The UI falls back to posts with shared tags until an embedding exists. When a worker finishes, it broadcasts `ai` on the post's Realtime topic, so the TL;DR and related cards update without a reload.

```mermaid
sequenceDiagram
    participant A as Author
    participant DB as Postgres
    participant E as embed-post (gte-small)
    participant S as summarize-post
    participant R as Reader
    A->>DB: publish / update post
    DB->>DB: trigger → private.ai_jobs (coalesced)
    DB-)E: pg_net + x-internal-token
    DB-)S: pg_net + x-internal-token
    E->>DB: ai_claim_jobs (rate limit, hash skip)
    E->>DB: ai_complete_embedding → post_embeddings
    S->>DB: ai_claim_jobs
    alt OPENAI_API_KEY set
        S->>S: LLM summary
    else no key / LLM error
        S->>S: extractive summary
    end
    S->>DB: ai_complete_summary → post_summaries
    DB-)R: realtime "ai" on post:{id}
    R->>DB: post_summaries + rpc related_posts
```

**Enabling LLM summaries (optional):** Supabase Dashboard → Edge Functions → Secrets → add `OPENAI_API_KEY`, then re-queue with `delete from public.post_summaries;` followed by the backfill migration's SQL.

---

## Image uploads (Storage)

| Bucket | Used for | Max longest edge | Limits (enforced by Storage) |
| --- | --- | --- | --- |
| `covers` | post cover images (cards + post header) | 1600 px | 2 MB, JPEG/PNG/WebP/GIF |
| `post-images` | images inside post content | 1400 px | 2 MB, JPEG/PNG/WebP/GIF |

- **Client side** (`src/lib/images.ts`): accepts JPG/PNG/WebP/GIF up to 10 MB, downsizes with a canvas and re-encodes to WebP (JPEG fallback), lowering quality until it fits under 2 MB. A 4.9 MB PNG becomes a ~120 KB WebP. Animated GIFs become a still image.
- **Paths** are `<bucket>/<uid>/<random uuid>.webp`. RLS only allows insert/update/delete (and listing) inside your own `<uid>/` folder. Both buckets are public, so images are served from the public CDN URL, and nobody can list other users' files.
- **Guests** can store at most 5 images (a restrictive policy backed by a security-definer counter in the non-exposed `private` schema). They can only set covers from their own folder.
- **Rendering:** the sanitizer only keeps `<img>` tags whose `src` is in this project's buckets, so posts can't embed tracking pixels or hot-link other sites. Images are lazy-loaded.

```mermaid
flowchart LR
    F[File picked / pasted / dropped] --> V{"type + size<br/>check"}
    V -->|ok| C["canvas resize<br/>→ WebP ≤ 2 MB"]
    C --> S["Storage upload<br/>covers/ or post-images/&lt;uid&gt;/…"]
    S --> P{"RLS: own folder?<br/>guest &lt; 5 images?"}
    P -->|yes| U[public URL → cover_image / &lt;img&gt;]
    P -->|no| E[toast: friendly error]
    J["pg_cron: cleanup-demo-files"] -->|"pg_net + internal token"| EF["Edge Function<br/>(service role)"]
    EF -->|"Storage API remove()"| S
```

The Edge Function (`supabase/functions/cleanup-demo-files`) checks a random token stored in Supabase Vault, so it needs no project key in the database or the repo.

---

## Performance & Lighthouse

Lighthouse (lab run, mobile uses the default Moto G Power throttling, desktop the desktop preset) on the live site. "Home" is `/`, which redirects logged-out visitors to `/login`.

| Page | Device  | Performance (before → after) | Accessibility | Best Practices | SEO        |
| ---- | ------- | ---------------------------- | ------------- | -------------- | ---------- |
| Home | Mobile  | 95 → 88                      | 91 → 94       | 96 → 96        | 82 → 100   |
| Home | Desktop | 100 → 99                     | 91 → 94       | 100 → 100      | 82 → 100   |
| Post | Mobile  | 80 → 84                      | 85 → 90       | 100 → 100      | 82 → 100   |
| Post | Desktop | 99 → 90                      | 85 → 90       | 100 → 100      | 82 → 100   |

_30 Oct 2026. "Before" is a single run; "after" is the median of three runs after the perf/SEO pass. Lab performance scores on this setup swing by 10+ points between runs (for example, post desktop scored 89, 99 and 90), so treat performance differences of that size as noise. The accessibility, SEO and best-practices changes are stable. The remaining accessibility misses are colour contrast and links distinguished only by colour, both theme decisions that were left as is on purpose._

---

## Known limits

- **Contrast:** some theme accent colours fail WCAG AA contrast on light backgrounds, which is most of the Accessibility deduction. The themes haven't been changed.
- **Guest demo** needs **Allow anonymous sign-ins** turned on in Supabase, and ideally CAPTCHA to slow down bots.
- **Leaked-password protection** (Supabase Auth → Attack Protection) is off.
- **The base schema** isn't checked in as a migration (see step 4).
- **Search** uses the English dictionary only (stemming and stop words), so posts in other languages match less well.
- **AI** embeddings are English-first and see only the first ~512 tokens of a post. Extractive summaries pick existing sentences, so very short posts get their whole text as the TL;DR.
- **The main JS bundle** is still about 190 KB gzipped (Supabase client, framer-motion, router); the editor and authoring pages are split out.

---

_Created by Joshua Colon_
