# ChezChrystelle Server

Express + MongoDB API for the Chez Chrystelle website.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in MongoDB, JWT, and any auth/email values you want to use locally.
3. Install dependencies with `npm install`.
4. Run `npm run seed` to create starter config, products, and the default store.
5. Start the server with `npm run dev`.

## Local testing

- Standard local auth: set Google OAuth values with `CLIENT_URL=http://localhost:8080` and `GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback`.
- Faster local testing: set `DEV_AUTH_ENABLED=true` and optionally set `DEV_AUTH_EMAIL` / `DEV_AUTH_NAME`.
- If `DEV_AUTH_EMAIL` is included in `INITIAL_ADMIN_EMAILS`, your local dev user will be created as an admin.
- Email is optional in local development. If `RESEND_API_KEY` is empty, contact/order email calls will log and no-op instead of crashing the server.
- If you need to allow multiple frontend origins, set `CORS_ALLOWED_ORIGINS` to a comma-separated list. `CLIENT_URL` is still used as the canonical post-login redirect target.

## Render deployment

- Render must install dev dependencies during the build because TypeScript and the type packages are used at build time.
- Use this build command: `npm ci --include=dev && npm run build`
- Use this start command: `npm start`
- A sample [render.yaml](/Users/daveseidman/Documents/personal/chezchrystelle/website/chezchrystelle-server/render.yaml) is included for reference.

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
