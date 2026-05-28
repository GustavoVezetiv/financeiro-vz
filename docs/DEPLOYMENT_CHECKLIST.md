# Deployment Checklist

Financeiro VZ private beta deployment checklist for Vercel + Supabase.

## Before Deploy

- Confirm `npm run lint` passes.
- Confirm `npm run build` passes.
- Confirm `.env.local` is not committed.
- Confirm `.env.example` only contains safe public variables.
- Confirm no Supabase service role key exists in frontend code or Vercel variables.
- Confirm unstable imports are limited to the MVP targets: people, categories, accounts payable and income sources.
- Confirm future import targets are marked as "Em breve" and have no active import action.

## Supabase Checklist

- Create or select the Supabase project.
- Run every SQL migration in `supabase/migrations` in chronological order.
- Confirm Row Level Security is enabled for user-owned tables.
- Confirm policies restrict select, insert, update and delete to `auth.uid()`.
- Enable email/password authentication for the beta.
- Configure Auth Site URL with the deployed Vercel URL.
- Configure Redirect URLs:
  - `https://your-vercel-domain.vercel.app/login`
  - `http://localhost:3000/login` for local development
- Keep the anon public key only. Do not expose the service role key.

## Vercel Checklist

- Import the GitHub repository into Vercel.
- Use the default framework preset for Next.js.
- Use build command `npm run build`.
- Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Set `NEXT_PUBLIC_SITE_URL` to the final public Vercel URL.
- Deploy the project.
- After the first deploy, copy the final Vercel URL back into Supabase Auth settings.

## After Deploy Test Checklist

- Open the deployed URL.
- Sign up with email and password.
- Log in.
- Confirm unauthenticated `/dashboard` access redirects to `/login`.
- Confirm authenticated `/dashboard` access works.
- Create a category.
- Create a person.
- Create an account payable.
- Create an income source.
- Log out.
- Log in again.
- Reload `/dashboard` and one CRUD page to confirm the session persists.
- Open `/dashboard/imports` and confirm only MVP imports are active.

## Rollback Notes

- Use Vercel's previous deployment rollback if the frontend deploy breaks.
- If a database migration causes issues, stop using the affected screen and restore from a Supabase backup or point-in-time recovery if enabled.
- Do not run destructive SQL rollback scripts in production without a database backup.
- Keep the previous working deployment available until the post deploy checklist passes.

## Known Limitations

- The app is web-only.
- Imports are stable only for people, categories, accounts payable and income sources.
- Import preview rows can be skipped, but not edited inline yet.
- Missing referenced people or categories are not auto-created.
- Open Finance, OCR, PDF parsing, WhatsApp automation, XP invoice scraping and AI classification are intentionally out of scope.
- Some secondary routes are visible as "Em breve" placeholders for navigation continuity.
