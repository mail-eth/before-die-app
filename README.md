# Before Die

Before Die is a bilingual emotional milestone wall built with Next.js + Supabase.

> 🚧 **Status:** under construction — we are building this slowly, step by step.

## What is live now
- `/id` and `/en` locale routes
- light / dark theme toggle
- public dream wall UI
- submission form connected to Supabase
- API route (`/api/dreams`) for create + feed

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client/public usage)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only API usage)
- `NEXT_PUBLIC_SITE_URL`

## Database setup
Run SQL from `supabase-schema.sql` to create the `dreams` table and policies.

## Notes
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (never expose in client code).
- If deployment env vars change, redeploy on Vercel so API routes use the latest values.
- This project is intentionally iterative: shipping small improvements continuously.