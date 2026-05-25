# Deployment

## Deploying to Vercel (with Convex)

This repo is configured so Vercel runs:

```bash
bun run build:vercel
```

`build:vercel` runs Convex deployment first, then runs the app build via Convex:

```bash
bunx convex deploy --cmd 'bun run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

Required Vercel environment variable:

- `CONVEX_DEPLOY_KEY` (create a production deploy key in Convex and add it in Vercel project settings)
- `VITE_CONVEX_SITE_URL` (same deployment as `VITE_CONVEX_URL`, ending in `.convex.site`)

Required Convex environment variables:

- `SITE_URL` (your deployed app URL)
- `BETTER_AUTH_SECRET`
- Stripe variables listed in [setup](setup.md)
- Mux and Railway/S3 variables listed in [setup](setup.md)
