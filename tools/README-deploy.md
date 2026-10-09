# Deploying to Render

The site needs three things in production that it does not need locally: a
database, durable image storage, and an always-on process. This covers each and
flags what costs money.

## What it costs

| Piece | Free option | Paid option |
| --- | --- | --- |
| Database | Neon or Supabase free tier | Render Postgres from ~$7/month |
| Hosting | Render free, but sleeps after 15 min idle | Render Starter, $7/month |
| Images | Cloudflare R2, free to 10GB | AWS S3 |

You can start on all three free tiers. The one thing I would not leave free is
hosting: Render's free service spins down after 15 minutes idle and takes about
a minute to wake, so a customer arriving at an unwarmed site waits. That is a
poor first impression for a shop you want people to contact.

## 1. Database

The simplest route is Render's own Postgres: create an instance in the same
dashboard, then copy its **Internal Database URL** into `DATABASE_URI` on the web
service. Do not use the external URL from inside Render; the internal one does
not bill for bandwidth.

Neon or Supabase both work and have free tiers. If you use one, copy its pooled
connection string.

Whichever you pick, the app switches automatically. Leaving `DATABASE_URI` unset
uses a local SQLite file, which is fine on your laptop and **not** fine in
production, because Render's filesystem is wiped on every deploy.

## 2. Image storage

This one is not optional and is easy to miss. Uploads written to Render's local
disk are deleted on the next deploy. Your product photographs would vanish.

Use Cloudflare R2:

1. Create a bucket, and keep the R2 API token handy
2. Set these on the web service:
   - `IMAGE_STORAGE_BUCKET` — the bucket name
   - `IMAGE_STORAGE_ENDPOINT` — the `https://<accountid>.r2.cloudflarestorage.com` endpoint
   - `IMAGE_STORAGE_ACCESS_KEY_ID` and `IMAGE_STORAGE_SECRET_ACCESS_KEY`
   - `IMAGE_STORAGE_REGION` — `auto`
3. In R2 settings, add a custom domain so uploaded photos have a public URL

The plugin only switches on when `IMAGE_STORAGE_BUCKET` is set, so development
keeps using a local folder and nothing breaks if you forget it locally.

## 3. Secrets

Set these in Render's environment variables. `.env.example` lists them all.

- `PAYLOAD_SECRET` — Render can generate this with `generateValue: true`. Treat
  it as permanent: changing it signs every account out.
- `NEXT_PUBLIC_SERVER_URL` — your live domain, no trailing slash
- `DATABASE_URI` — from step 1
- `CSRF_TRUST_ORIGIN` — your live domain. Without this, sign-in may be rejected
  as a cross-site request.

## 4. Deploy

`render.yaml` declares the service. Connect the repository in Render, apply the
blueprint or fill the settings in by hand, and deploy.

Build: `npm ci && npm run build`
Start: `npm run start`
Health check: `/api/health`

That endpoint returns 200 with `{"status":"ok"}` when the database is reachable.
It deliberately does not fail on a database blip, so a momentary hiccup does not
make the platform restart the app.

## 5. First run

1. Open `https://your-domain.com/admin`
2. Create the first account. It is automatically an Admin.
3. Add your brother as an Editor. See `README-users.md`.

The local `payload.db` is not deployed, so production starts empty apart from
your settings. Either load the catalogue again with `npm run seed` against the
production database, or add products through the admin panel, which is probably
easier at this point since there are only eleven.

## Notes on running the CMS locally

```bash
npm run dev          # site on :3000, admin on :3000/admin
npm run seed         # import public/products into the local database
npm run typecheck
npm run lint
npm run build
node --import tsx tools/verify-access.ts     # proves visitors cannot edit
node --import tsx tools/verify-roundtrip.ts  # proves edits reach the public
```

Set `NEXT_PUBLIC_SERVER_URL` when running the verification scripts against a
local production build rather than the dev server.

One Windows-specific note: pass `node` the relative path to the Next CLI, or use
a small wrapper script. Passing the absolute path through `Start-Process` splits
it on the spaces in `OneDrive - OpsHub` and Next never starts.