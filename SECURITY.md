# Security Notes

## Secrets policy
- Never commit real credentials into this repository.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used on server-side code (API routes / backend).
- `NEXT_PUBLIC_*` variables are public by design and must not contain private secrets.

## If a secret is exposed
1. Rotate the key in Supabase immediately.
2. Update the new value in Vercel Environment Variables.
3. Redeploy production to pick up new variables.
4. Remove exposed files from the repository and block re-commit in `.gitignore`.
5. (Recommended) Rewrite git history to fully purge old secrets from past commits.

## Operational reminder
- Use `.env.example` only for placeholders, never real values.
- Review PRs for accidental key leaks before merge.
