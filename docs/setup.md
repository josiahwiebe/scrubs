# Setup

## Development

Install dependencies:

```bash
bun install
```

This repo uses Bun (`packageManager` is `bun@1.3.x`). If `bun` is installed but
not on your shell path, use the full binary path or add it to `PATH`:

```bash
export PATH="$HOME/.bun/bin:$PATH"
```

Run app + Convex locally:

```bash
bun run dev
```

Run only the web app:

```bash
bun run dev:web
```

## Build / Run

```bash
bun run build
bun run start
```

## Quality checks

```bash
bun run typecheck
bun run lint
```

## Environment variables

Local app variables in `.env.local`:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `CONVEX_DEPLOYMENT`

Convex deployment variables:

- `SITE_URL` (for local dev: `http://localhost:5296`)
- `BETTER_AUTH_SECRET`
- `PERSONAL_TEAM_OWNER_EMAILS` (optional comma-separated owner email allowlist for free unlimited teams)
- `PERSONAL_TEAM_SLUGS` (optional comma-separated team slug allowlist for free unlimited teams)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `RAILWAY_ACCESS_KEY_ID`
- `RAILWAY_SECRET_ACCESS_KEY`
- `RAILWAY_ENDPOINT`
- `RAILWAY_PUBLIC_URL` or `RAILWAY_ENDPOINT`
- `RAILWAY_BUCKET_NAME` (optional, defaults to `videos`)
- `RAILWAY_REGION` (optional, defaults to `us-east-1`)
- `RAILWAY_PUBLIC_URL_INCLUDE_BUCKET` (optional)

Better Auth secrets live in Convex, not `.env.local`:

```bash
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
bunx convex env set SITE_URL http://localhost:5296
```

Stripe webhook endpoint (for the Convex Stripe component):

- `https://<your-deployment>.convex.site/stripe/webhook`

Mux webhook endpoint:

- `https://<your-deployment>.convex.site/webhooks/mux`

Better Auth endpoint:

- App proxy: `/api/auth/*`
- Convex backing route: `https://<your-deployment>.convex.site/api/auth/*`

Cloudflare Stream is not wired in yet. Until the video pipeline is migrated,
Mux remains required for upload processing, HLS playback, thumbnails, and
webhooks.
