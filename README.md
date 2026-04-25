# ChezChrystelle Server

Express + MongoDB API for the Chez Chrystelle website.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in MongoDB, JWT, and any auth/email values you want to use locally.
3. Install dependencies with `npm install`.
4. Run `npm run seed` to create starter config, products, and the default store.
5. Run `npm run migrate` to apply any pending tracked migrations.
6. Start the server with `npm run dev`.

## Sync local and remote databases

- Set `LOCAL_MONGODB_URI` to your local Mongo database URI.
- Set `REMOTE_MONGODB_URI` to your hosted Mongo database URI.
- Set `SYNC_PUSH_PASSWORD` to a password you will type before any `push`.
- Pull remote data down into local:
  - `npm run sync:pull`
- Push local data up into remote:
  - `npm run sync:push`
- Include `users` only when you explicitly want them:
  - `npm run sync:pull -- --include-users`
  - `npm run sync:push -- --include-users`

By default these sync scripts fully replace the target collections for:
- `configs`
- `orders`
- `products`
- `stores`
- `storememberships`

`users` is intentionally excluded unless you pass `--include-users` or set `SYNC_INCLUDE_USERS=true`.

Each sync is interactive:
- `pull` shows you the local collections that will be deleted and asks for `Y/N`.
- `push` first requires `SYNC_PUSH_PASSWORD`, then shows you the remote collections that will be deleted and asks for `Y/N`.

## Local testing

- Standard local auth: set Google OAuth values with `CLIENT_URL=http://localhost:8080` and `GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback`.
- Faster local testing: set `DEV_AUTH_ENABLED=true` and optionally set `DEV_AUTH_EMAIL` / `DEV_AUTH_NAME`.
- If `DEV_AUTH_EMAIL` is included in `INITIAL_ADMIN_EMAILS`, your local dev user will be created as an admin.
- Email is optional in local development. If `RESEND_API_KEY` is empty, contact/order email calls will log and no-op instead of crashing the server.
- If you need to allow multiple frontend origins, set `CORS_ALLOWED_ORIGINS` to a comma-separated list. `CLIENT_URL` is still used as the canonical post-login redirect target.

## Render deployment

- Render must install dev dependencies during the build because TypeScript and the type packages are used at build time.
- Use this build command: `npm ci --include=dev && npm run build`
- Use this pre-deploy command: `npm run migrate`
- Use this start command: `npm start`
- A sample [render.yaml](/Users/daveseidman/Documents/personal/chezchrystelle/website/chezchrystelle-server/render.yaml) is included for reference.

## Migrations

- Migrations live in `src/migrations/`.
- `npm run migrate` records completed migrations in the `migrationruns` collection and only applies new ones.
- The migration runner is designed for Render's `Pre-deploy command`, so deploys can stay in sync with schema changes.
- Keep migrations forward-only and idempotent where possible.

## Important env vars

- `CLIENT_URL`: the deployed frontend origin.
- `CORS_ALLOWED_ORIGINS`: optional extra origins allowed by CORS, such as the temporary GitHub Pages domain during rollout.
- `GOOGLE_CALLBACK_URL`: the backend callback URL registered in Google.
- `INITIAL_ADMIN_EMAILS`: comma-separated emails that should auto-promote to admin on first login.
- `RESEND_API_KEY` and `EMAIL_FROM`: required for contact/order emails.
- `DEV_AUTH_ENABLED`: optional local-only shortcut login route at `/auth/dev-login`.

## Routes

- `GET /health`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /api/config/public`
- `GET /api/stores/public`
- `GET /api/products/public`
- `POST /api/contact`
- `GET /api/auth/me`
- `GET /api/orders/me`
- `POST /api/orders`
- `GET|PATCH /api/admin/users`
- `GET|POST|PATCH|DELETE /api/admin/stores`
- `GET|POST|PATCH|DELETE /api/admin/products`
- `GET|PATCH /api/admin/orders`
- `GET|PUT /api/admin/config`
