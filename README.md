# Blog Platform

A polished full-stack blogging application built with React, TypeScript, Tailwind CSS, and Supabase. This project demonstrates modern front-end architecture, secure authentication, rich text publishing, and a polished responsive user experience.

> Portfolio-ready blog platform with a focus on usability, accessibility, and production-quality engineering.

---

## Overview

This project is a complete blogging platform that supports:

- authenticated user registration and login
- creation, editing, and deletion of personal blog posts
- rich text editing for content creation
- comments, likes, and a clean post feed
- light/dark theme support and responsive design
- Supabase-backed persistence for authentication and data storage

The application is designed to be a professional demonstration of full-stack skills, with a refined UI and robust route protection.

---

## Key Features

- **Full Authentication Flow** — Email/password signup, login, and session management
- **Post Management** — Create, update, delete, and publish blog posts
- **Rich Text Editing** — Author content using a modern editor experience
- **Social Interactions** — Comments and likes on published posts
- **Theme System** — Light and dark mode with user preference support
- **Responsive Layout** — Optimized for desktop, tablet, and mobile screens
- **Protected Routes** — Secure route access for authenticated users only

---

## Technology Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Frontend   | React + TypeScript           |
| Styling    | Tailwind CSS                 |
| Editor     | TipTap                       |
| Backend    | Supabase (Auth + PostgreSQL) |
| Deployment | Vercel                       |

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

   Use the Supabase SQL editor to create the required tables for profiles, posts, comments, and likes.

5. Start the development server

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

---

## Usage

### Visitor Experience

- Users sign in or register to access the blog experience
- Authenticated users can browse published posts and interact with content

### Author Workflow

- Create a new post with title, tags, cover image, and rich text content
- Publish posts publicly or keep them as drafts for later editing
- Update or remove any post authored by the signed-in user

### Interaction Features

- Leave comments on posts
- Like or unlike posts to signal engagement
- Switch between light and dark mode for a tailored reading experience

---

## Project Structure

```
src/
├── components/        # Reusable UI components and feature widgets
├── context/           # Global auth and theme providers
├── lib/               # Supabase client and API helpers
├── pages/             # Route-based page components
└── App.tsx            # Application routes and providers
```

---

## Why This Project

This repository is intended as a professional portfolio piece that highlights:

- modern React and TypeScript development
- integration with a serverless backend platform (Supabase)
- thoughtful UX patterns for authenticated applications
- responsive and accessible UI design

---

## License

MIT

---

_Created by Joshua Colon_
