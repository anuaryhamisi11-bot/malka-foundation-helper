# Malka Foundation Helper

A private organizational portal for the Malka Foundation: authenticated members
sign in according to a role assigned by an administrator and get access to
internal chat, meetings, projects, documents, notifications, announcements,
an audit log, and (for Admins) user management, settings, and an AI assistant.

There is **no public self-registration**. Every account is created by an
administrator.

## Technology stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- Server-side sessions: signed JWT in an HTTP-only cookie, backed by a
  revocable `Session` row in the database, passwords hashed with bcrypt
- Zod for input validation
- Lucide icons
- S3-compatible object storage for documents (AWS S3 / Cloudflare R2 / etc.)
- Daily.co (optional) for real hosted video meetings
- Any OpenAI-compatible endpoint for the Admin AI assistant
- Deployed to Netlify via `@netlify/plugin-nextjs`

### Two honest technical notes

1. **Chat and notifications use short polling** (the browser re-fetches every
   4-6 seconds), not push-based WebSockets. Netlify Functions cannot hold a
   persistent connection open, so this is the practical real-time approach on
   this hosting model. If you later want instant push delivery, add a
   Pusher/Ably subscription in `app/(portal)/chat/page.tsx` and
   `app/(portal)/notifications/page.tsx` - the message/notification creation
   code already exists and would just publish to that service too.
2. **Video meetings embed Daily.co**, a real hosted WebRTC provider, rather
   than a custom signaling server (which cannot run reliably on serverless
   functions). If `DAILY_API_KEY` is not configured, the meeting scheduler
   can paste any external meeting link (Zoom, Google Meet, etc.) instead.

## Project structure

```
malka-foundation-helper/
├── app/                     Pages and API routes (Next.js App Router)
│   ├── (portal)/            Authenticated pages, shared sidebar/topbar layout
│   ├── api/                 All server-side API routes
│   ├── login/               Public login page
│   ├── layout.tsx, page.tsx, globals.css
├── components/              Shared UI components (layout, chat, meetings)
├── lib/                     Auth, permissions, security, validation, storage, AI
├── prisma/                  schema.prisma (database models) and seed.ts
├── preview/                 Static HTML visual mockups (no real logic)
├── types/                   Shared TypeScript types
├── middleware.ts            Edge-level session check on every request
├── netlify.toml             Netlify build + plugin configuration
├── .env.example             Every environment variable, documented
└── package.json
```

## What you must install/copy

1. Create a folder on your computer, e.g. `malka-foundation-helper`.
2. Copy every file from this package into that folder, preserving the exact
   paths shown above (including folders in parentheses like `(portal)`, and
   dynamic segments in brackets like `[id]` - these are normal Next.js
   folder names, keep them exactly as named).
3. Open a terminal in that folder.

## AI-GENERATED vs MY EXTERNAL CONFIGURATION

**AI-generated (already done for you):** every page, API route, the database
schema, seed script, validation, security logic (auth, RBAC, rate limiting,
audit logging), styling, and this documentation.

**Your external configuration (cannot safely be generated for you):**
- Creating a PostgreSQL database and getting its connection string
- Creating an S3-compatible storage bucket and its access keys
- Getting an AI API key (if you want the Admin AI assistant)
- Getting a Daily.co API key (if you want auto-created video rooms)
- Adding all of the above as environment variables in Netlify
- Connecting the project to GitHub and to Netlify

## Local setup

1. Install Node.js 20 or later.
2. In the project folder, run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (see below).
4. Create the database tables:
   ```
   npx prisma migrate dev --name init
   ```
5. Seed the roles, permissions, and the initial Admin account:
   ```
   npm run db:seed
   ```
6. Start the app locally:
   ```
   npm run dev
   ```
   Visit `http://localhost:3000` and sign in with username `Malka` and
   password `@_.Malka`. **Change this password immediately** from
   Admin -> Manage Users -> Reset password once you're in, or create a new
   personal Admin account and disable this one.

## Environment variables

Fill these into `.env` locally and into Netlify's Environment variables for
production. Every one is explained inline in `.env.example`:

- `DATABASE_URL` - PostgreSQL connection string. Use a serverless-friendly
  Postgres host such as Neon.tech or Supabase, since Netlify Functions are
  stateless and short-lived.
- `AUTH_SECRET` - random signing secret for login sessions. Generate with
  `openssl rand -base64 48`.
- `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`,
  `STORAGE_SECRET_KEY` - your S3-compatible storage for the Documents module.
- `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` - for the Admin AI assistant.
- `DAILY_API_KEY`, `DAILY_API_URL` - optional, for auto-created video rooms.

## Setting up PostgreSQL

Any managed Postgres works. The quickest for a Netlify deployment:

1. Create a free project at [neon.tech](https://neon.tech) or
   [supabase.com](https://supabase.com).
2. Copy the connection string it gives you into `DATABASE_URL`.
3. Run `npx prisma migrate deploy` once (see "Production build" below) to
   create the tables in that database.

## Setting up file storage (Documents module)

1. Create a bucket with any S3-compatible provider (AWS S3, Cloudflare R2,
   Backblaze B2, DigitalOcean Spaces).
2. Create an access key/secret with read/write access to that bucket.
3. Fill `STORAGE_ENDPOINT` (leave blank for real AWS S3), `STORAGE_REGION`,
   `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`.

## Setting up the Admin AI assistant

1. Get an API key from any OpenAI-compatible provider.
2. Set `AI_API_KEY` (and `AI_API_URL`/`AI_MODEL` if you're not using
   OpenAI's default endpoint).
3. If this is left blank, every other feature works normally - only the
   Admin AI page will show a clear "not configured" message instead of a
   fake response.

## Setting up video meetings

1. Create a free account at [daily.co](https://daily.co) and get an API key.
2. Set `DAILY_API_KEY`. New meetings will automatically get a real video
   room.
3. If left blank, meeting organizers can paste any external meeting link
   (Zoom, Google Meet, Teams) into the "External meeting link" field when
   scheduling instead.

## Production build

```
npm run build
npx prisma migrate deploy
```

## Connecting to GitHub and Netlify

1. Create a new empty repository on GitHub.
2. From your project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. In Netlify: **Add new site -> Import an existing project -> Deploy with
   GitHub**, and select this repository.
4. Netlify build settings (should be detected automatically from
   `netlify.toml`, confirm they read):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - The `@netlify/plugin-nextjs` plugin is already configured in
     `netlify.toml` - no manual plugin install needed.
5. In **Site settings -> Environment variables**, add every variable from
   `.env.example` with your real values (never commit the real `.env` file
   to GitHub).
6. Trigger a deploy. Netlify will run `npm run build`, which also runs
   `prisma generate` automatically via the `postinstall` script.
7. After the first successful deploy, run the database migration and seed
   once against your production database (from your own computer, pointed at
   the production `DATABASE_URL`):
   ```
   npx prisma migrate deploy
   npm run db:seed
   ```
8. Netlify will give you a live URL (e.g. `https://your-site.netlify.app`).
   You can add a custom domain from Site settings -> Domain management.

## Verifying everything works

- **Authentication**: visiting any page while signed out redirects to
  `/login`; wrong credentials show an error; correct credentials sign you in.
- **Roles**: sign in as `Malka` (Admin) and confirm the "Administration"
  section appears in the sidebar; create a second user with a different
  role and confirm they do NOT see that section.
- **Chat**: start a conversation between two accounts (two browsers or
  incognito windows) and confirm messages appear on both sides within a
  few seconds.
- **Meetings**: schedule a meeting, open it, and confirm minutes can be
  added and attendance can be recorded.
- **Documents**: upload a file, then download it from a different account
  that is NOT in `allowedRoles` and confirm it is refused.
- **Admin dashboard**: confirm the user/role counts match what is actually
  in the database.

## Troubleshooting

- **"AUTH_SECRET environment variable is not set"** - add `AUTH_SECRET` to
  your environment variables and redeploy.
- **Login always fails** - confirm `npm run db:seed` was run against the
  same `DATABASE_URL` the running app is using.
- **File uploads fail** - confirm all five `STORAGE_*` variables are set and
  the bucket/access key actually has write permission.
- **AI assistant says "not configured"** - set `AI_API_KEY`.
- **Video room does not appear** - set `DAILY_API_KEY`, or paste an external
  meeting link when scheduling.
