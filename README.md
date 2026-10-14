# WHELPS

WHELPS is a Next.js adoption-management application backed by PostgreSQL. The database is configured for Supabase Cloud and keeps the existing server-managed authentication and session flow.

## Local development

Requirements: Node.js, Docker Desktop, and the Supabase CLI (the npm scripts can invoke a locally installed CLI).

```bash
npm install
npm run db:start
npm run db:reset
```

Copy `.env.example` to `.env.local`, then use the local database URL printed by `supabase status` as `DATABASE_URL`. Start the app with:

```bash
npm run dev
```

## Supabase Cloud deployment

1. Create a Supabase project and save its database password.
2. Link this repository: `npx supabase link --project-ref YOUR_PROJECT_REF`.
3. Apply the committed migration and pet seed: `npm run db:push`.
4. In the application host, set `DATABASE_URL` to the Supabase **transaction pooler** URI (port `6543`) from the project's Connect dialog. Do not expose it with a `NEXT_PUBLIC_` prefix.
5. Set `DATABASE_POOL_SIZE` (default `3`) according to the deployment's concurrency and Supabase compute tier.
6. Set `WHELPS_ADMIN_NAME`, `WHELPS_ADMIN_EMAIL`, and a 12+ character `WHELPS_ADMIN_PASSWORD`, then run `npm run provision-admin` once against the cloud database.
7. Deploy the Next.js application and run `npm run build` as the build command.

Run `npm run db:check` with `DATABASE_URL` configured to verify the deployed schema and seed data.

The runtime client uses TLS, disables prepared statements for Supavisor transaction mode, and reuses a small connection pool. All application tables have RLS enabled and grants to Supabase's `anon` and `authenticated` Data API roles revoked; application access is only through the server-side API routes.

For migrations or native PostgreSQL tools, use the direct connection or Supavisor session mode rather than the transaction-pooler URI.
