# Miss Nancy Website

Production-ready Next.js 15 website and authenticated workspace for Miss Nancy.

## Includes

- Public marketing site
- Clerk authentication
- Supabase persistence + RLS
- Authenticated `/workspace`
- Streaming AI chat routes
- Tasks, projects, memory items
- Pricing, contact, and book-demo flows
- Stripe checkout route
- HubSpot / Resend / Calendly optional integrations

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Database

Run `supabase/schema.sql` inside your Supabase SQL editor.

## Important

This archive is a reconstructed project package based on the completed build work in chat. Configure all environment variables before local or production use.
