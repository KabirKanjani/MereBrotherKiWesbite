# Kivia Designs

Website and operations system for Kivia Designs, a kurti manufacturing house in Ahmedabad.

Two things live here, sharing one database and one login:

- **The shopfront** — a public catalogue for wholesale buyers and stockists, with enquiries, a
  stockist application form, seasonal ranges, an Instagram strip and a downloadable rate card.
- **The operations system** — buyers, orders, payments, stock and factory-floor job tracking, so
  the shop runs from here rather than from a notebook and a WhatsApp thread.

## Requirements

- Node.js 24
- No database server needed for local work; it uses a SQLite file

## Getting started

```bash
npm install
npm run dev          # site on :3000, admin on :3000/admin
```

The first time you visit `/admin` you are sent to `/admin/create-first-user`. That first account is
always an **Admin**. Add further accounts under **Settings → Staff accounts**, giving your
brother the **Editor** role.

Copy `.env.example` to `.env` if you need to change the defaults. Everything in it has a working
default for local development.

### Importing the existing catalogue

```bash
npm run seed            # products and photos from public/products into the CMS
npm run seed-settings   # shop details, phone and address
npm run seed-social     # recent Instagram posts for the homepage strip
```

`npm run seed` is safe to run more than once; it updates rather than duplicating.

## How content is managed

Everything on the website is edited in the admin panel at `/admin`:

| To change | Go to |
| --- | --- |
| Styles, prices to quote, which appear on the homepage | **The Shop → Styles** |
| Photographs | **The Shop → Photos** |
| Instagram strip on the homepage | **The Shop → Instagram posts** |
| Phone, WhatsApp, address, opening hours | **Settings → Shop details** |
| Wording on the About, Craft, Bulk, Size Guide pages | **Words & pages → Pages** |
| Wholesale buyers | **Orders → Buyers** |
| Orders, with size-wise line items and status | **Orders → Orders** |
| Money received | **Orders → Payments** |
| Stock in and out | **Stock → Stock movements** |
| Designers, machinists, finishers | **Stock → People** |
| What is being made and by whom | **Production → Production jobs** |
| Website enquiries | **Enquiries → Enquiries** |
| Stockist applications | **Enquiries → Stockist applications** |

Two rules are enforced by the system rather than left to memory:

- **Prices are never shown on the website.** A `rate card price` field exists on each style for your
  own reference and is not rendered anywhere. Rate cards are sent as a PDF on request.
- **Drafts stay private.** A style saved as a draft is invisible to visitors until published, and
  this is enforced in the collection's access rules, not just hidden in the interface.

## Money

Every amount is stored as a whole number of paise. Rupees are never stored as decimals, because
binary floating point drifts over a few hundred order lines, and a figure that disagrees with the
bank cannot be reconciled.

`src/lib/money.ts` holds the conversion and formatting helpers, and `tools/test-money.ts` checks
them, including the classic `0.1 + 0.2` case.

## Stock

Stock on hand is not a number that gets overwritten. It is the running total of every movement ever
recorded, per style and per size, so any figure can be explained by tracing the movements behind
it. Quantities are signed: positive for stock in, negative for stock out.

Nothing is auto-deducted when an order is dispatched, deliberately. When you physically hand over
goods is when the movement gets recorded, so stock always reflects what is in the building.

## Checks

```bash
npm run typecheck
npm run lint
npm run build

node --import tsx tools/test-money.ts        # money arithmetic
node --import tsx tools/test-operations.ts   # order totals, balances, stock sums
node --import tsx tools/verify-access.ts     # visitors cannot edit or see drafts
node --import tsx tools/verify-roundtrip.ts  # a CMS edit reaches the public site
node --import tsx tools/check-duplicates.ts  # unique-field collisions
node --import tsx tools/clean-stray-drafts.ts # removes test leftovers
node --import tsx tools/content-status.ts    # what is still missing before launch
```

The browser-driven checks need a Chromium browser and, for the signed-in ones, credentials:

```bash
ADMIN_URL=http://localhost:3100 node --import tsx tools/check-admin-branding.ts
ADMIN_URL=http://localhost:3100 node --import tsx tools/check-admin-css.ts
ADMIN_EMAIL=... ADMIN_PASSWORD=... node --import tsx tools/check-admin-ui.ts
```

Scripts that touch the database should be run with `PAYLOAD_NO_PUSH=1` while a server is running,
otherwise two processes try to reconcile the schema at once and one dies with "index already exists".

## Docs

- `tools/README-admin.md` — using the admin panel without coding
- `tools/README-users.md` — accounts, roles and password resets
- `tools/README-deploy.md` — going live: hosting, database and image storage

## Deploying

Set these, then deploy:

- `PAYLOAD_SECRET` — long random value. Changing it signs everyone out.
- `NEXT_PUBLIC_SERVER_URL` — the live domain, no trailing slash
- `DATABASE_URI` — Postgres. Leaving this unset uses a local SQLite file, which will be wiped on
  every deploy.
- `CSRF_TRUST_ORIGIN` — the live domain, or sign-in may be rejected

Uploaded photographs need object storage such as Cloudflare R2. They cannot use the app's local
disk, which is wiped on every deploy. See `tools/README-deploy.md`.