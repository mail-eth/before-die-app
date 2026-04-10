# Before Die

Before Die is a bilingual emotional milestone wall built with Next.js + Supabase.

> 🚧 **Status:** under construction — we are building this slowly, step by step.

## What is live now
- `/id` and `/en` locale routes
- Light / dark theme toggle
- Public dream wall UI
- Submission form connected to Supabase
- API route (`/api/dreams`) for create + feed

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables
Copy `.env.example` to `.env.local` and fill in real values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

⚠️ Never commit real secret values to GitHub.

## Database setup
Run SQL from `supabase-schema.sql` to create the `dreams` table and policies.

## Security notes
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- If a secret is ever exposed, rotate it in Supabase and update Vercel env vars immediately.
- Redeploy after env updates so API routes use the latest values.
- Repo blocks accidental env commits via `.gitignore` and provides safe examples in `.env.example`.
