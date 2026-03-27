# Before Die

Before Die is a bilingual emotional milestone wall built with Next.js.

## V1 included
- `/id` and `/en` locale routes
- light / dark theme toggle
- emotional landing page
- public dream wall UI
- submission form
- API structure ready for Supabase
- preview fallback mode when Supabase env is not configured

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

If env vars are missing, the app still runs in preview mode with sample dreams.

## Database
Use `supabase-schema.sql` as the starting schema for the `dreams` table.
