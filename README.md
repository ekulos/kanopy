# Kanopy

Kanopy is a Kanban-style task and project management system built with Next.js.

## Features

- **Multi-project** — create and manage multiple separate projects
- **Kanban board** — drag & drop between Todo / In Progress / Done columns
- **List view** — filterable tasks table
- **Subtasks** — task hierarchy with progress tracking
- **Multiple assignees** — assign tasks to multiple team members
- **Comments** — discussion threads on each task
- **CSV import** — bulk import tasks with validation and preview
- **GitHub auth** — secure OAuth login

## Quick setup

```bash
# 1. Clone the repo and install dependencies
git clone <repo>
cd kanopy
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local
# Fill NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# 3. Initialize the database
npm run db:push
npm run db:seed   # optional demo data

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./dev.db` or a PostgreSQL connection string |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | From GitHub → Settings → Developer settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | Same as above |

## GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy the Client ID and Client Secret into `.env.local`

## Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run db:push      # Sync schema (dev, no migration files)
npm run db:migrate   # Create and apply migrations (production)
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data
```

## Stack

- **Next.js 15** — App Router, Server Components, API Routes
- **Prisma** — type-safe ORM with SQLite (dev) / PostgreSQL (prod)
- **NextAuth.js v5** — GitHub authentication
- **Tailwind CSS** — utility-first styling
- **@dnd-kit** — accessible drag & drop
- **Zod** — schema validation
- **papaparse** — client-side CSV parsing

## Extending the project

See the files in `.copilot/` for detailed developer instructions:
- `.copilot/api-routes.md` — API patterns and existing routes
- `.copilot/components.md` — React component conventions
- `.copilot/database.md` — schema, common queries, migrations
- `.github/copilot-instructions/COPILOT.md` — full architecture overview
