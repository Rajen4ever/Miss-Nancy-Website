# Phase 5 — Run instructions

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Database setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the full SQL from `supabase/schema.sql`.

## Clerk ↔ Supabase JWT + RLS

1. In Clerk, create a JWT template for Supabase.
2. Name it `supabase`, or change `CLERK_SUPABASE_JWT_TEMPLATE`.
3. Ensure Clerk user ID is present in `sub`.
4. Supabase RLS reads `auth.jwt() ->> 'sub'`.

## Vercel deployment checklist

1. Import the project into Vercel.
2. Add all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to the production domain.
4. Configure Clerk production redirect URLs and allowed origins.
5. Add production Supabase URL, anon key, and service role key.
6. Add production Stripe keys, webhook secret, and `STRIPE_OPERATOR_PRICE_ID`.
7. Add optional production values for:
   - `AI_GATEWAY_API_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `HUBSPOT_*`
   - `NEXT_PUBLIC_CALENDLY_URL`
8. Redeploy after saving environment variables.

## Test runner commands

```bash
npm run type-check
npm run lint
npm run test
npm run test:watch
npm run build
```
