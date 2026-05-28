# &lt;BlogPlatform /&gt;

A full-stack blog platform built with React, TypeScript, and Supabase. Features a retro/terminal-inspired UI with full light and dark mode support.

🔗 **Live Demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Features

- **Authentication** — Sign up and sign in with email and password
- **Create Posts** — Write and publish blog posts using a rich text editor (TipTap)
- **Edit & Delete** — Full control over your own posts
- **Comments** — Leave comments on any post
- **Likes** — Like and unlike posts
- **Dark / Light Mode** — Follows system preference with a manual toggle
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Protected Routes** — Only authenticated users can create or edit posts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Rich Text Editor | TipTap |
| Backend & Database | Supabase (Auth, PostgreSQL, RLS) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoshuaMColon/blog-platform.git
   cd blog-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root of the project:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You can find these in your Supabase project under **Settings → API**.

4. **Set up the database**

   Run the following SQL in your Supabase **SQL Editor**:

   ```sql
   create table profiles (
     id uuid references auth.users on delete cascade primary key,
     username text unique not null,
     avatar_url text,
     bio text,
     created_at timestamp with time zone default timezone('utc', now())
   );

   create table posts (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references profiles(id) on delete cascade not null,
     title text not null,
     content text not null,
     cover_image text,
     tags text[],
     published boolean default false,
     created_at timestamp with time zone default timezone('utc', now()),
     updated_at timestamp with time zone default timezone('utc', now())
   );

   create table comments (
     id uuid default gen_random_uuid() primary key,
     post_id uuid references posts(id) on delete cascade not null,
     user_id uuid references profiles(id) on delete cascade not null,
     content text not null,
     created_at timestamp with time zone default timezone('utc', now())
   );

   create table likes (
     id uuid default gen_random_uuid() primary key,
     post_id uuid references posts(id) on delete cascade not null,
     user_id uuid references profiles(id) on delete cascade not null,
     unique(post_id, user_id)
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

### As a Visitor
- You will be redirected to the **login page** on arrival
- Create an account using your email and password
- Once signed in, you can browse all published posts on the home feed

### Creating a Post
1. Click **+ new_post()** in the navbar
2. Enter a title, tags (comma separated), and write your content using the rich text editor
3. Click **Publish** to make it live, or **Save Draft** to save privately

### Editing or Deleting a Post
1. Open any post you authored
2. Click **edit()** to update the title, content, or tags
3. Click **delete()** to permanently remove the post

### Comments & Likes
- Scroll to the bottom of any post to leave a comment
- Click the **♡ like button** to like or unlike a post

### Dark / Light Mode
- Click the **☀ light / ⬛ dark** toggle in the navbar to switch themes
- The app also automatically follows your system's color scheme preference

---

## Project Structure

```
src/
├── components/
│   ├── Comments.tsx       # Comments section
│   ├── LikeButton.tsx     # Like/unlike button
│   ├── Navbar.tsx         # Navigation bar
│   ├── ProtectedRoute.tsx # Auth guard for routes
│   └── RichTextEditor.tsx # TipTap rich text editor
├── context/
│   ├── AuthContext.tsx    # Authentication state
│   ├── ThemeContext.tsx   # Light/dark mode state
│   └── useAuth.ts         # Auth hook
├── lib/
│   └── supabase.ts        # Supabase client
├── pages/
│   ├── CreatePost.tsx     # Create new post
│   ├── EditPost.tsx       # Edit existing post
│   ├── Home.tsx           # Post feed
│   ├── Login.tsx          # Login / signup
│   ├── NotFound.tsx       # 404 page
│   └── PostPage.tsx       # Individual post view
└── App.tsx                # Routes and providers
```

---

## License

MIT — feel free to use this project as a reference or starting point.

---

*Built by [Joshua Colon](https://github.com/JoshuaMColon)*
