# Amader Shop — Deshi Grocery Storefront

Next.js 16 (App Router, TypeScript) e-commerce frontend for a Bangladeshi
grocery store, with a Prisma + Neon PostgreSQL backend, order API,
Bangladeshi payment provider skeletons (bKash / Nagad / Rocket) and
Steadfast courier booking.

## Architecture

```
app/                    Pages: /, /category/[slug], /product/[slug],
                        /cart, /checkout, /search
app/api/                Route handlers:
  categories            GET  → category list
  products              GET  → list (?category=&q=&sort=)
  products/[slug]       GET  → product + related
  orders                POST → place an order
  orders/[orderNumber]  GET  → customer-safe order tracking
  payments/[provider]/create|callback  POST → 501 until configured
  courier/steadfast/book POST → book a Steadfast consignment
components/             UI components (ProductCard, Header, CartDrawer…)
context/CartContext.tsx Client cart state (localStorage)
lib/
  products.ts           Mock catalog (24 invented products, 7 categories)
  catalog.ts            Data access: Prisma first, mock fallback
  db.ts                 PrismaClient singleton (Neon serverless adapter)
  orders.ts             Order creation/tracking (DB or ephemeral memory)
  payments/             Provider contracts + bKash/Nagad/Rocket skeletons
  courier/steadfast.ts  Steadfast create_order client
prisma/
  schema.prisma         PostgreSQL data model
  migrations/0001_init  Initial migration SQL (generated offline)
  seed.ts               Seeds categories + products from mock data
```

**Mock-first:** with no `DATABASE_URL` set, every read falls back to
`lib/products.ts` and orders live in an ephemeral in-memory store, so the
app builds and runs fully offline. Set `DATABASE_URL` to persist.

## Setup

```bash
npm install
```

### With a database (Neon)

1. Create a project at https://neon.tech and copy the pooled connection string.
2. `cp .env.example .env` and set `DATABASE_URL` (and `DIRECT_URL`).
3. Apply migrations and seed:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
4. `npm run dev`

> Production note: the live Vercel deployment reads `DATABASE_URL` from the
> project's production environment variables, so redeploy after changing it.

### Without a database

Just `npm run dev` — the storefront runs on mock data.

## Environment variables

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | Prisma/Neon connection (pooled). Without it: mock mode |
| `DIRECT_URL` | Optional direct connection for migrations |
| `BKASH_APP_KEY/APP_SECRET/USERNAME/PASSWORD/BASE_URL` | bKash tokenized checkout |
| `NAGAD_MERCHANT_ID/MERCHANT_NUMBER/PUBLIC_KEY/PRIVATE_KEY/BASE_URL` | Nagad checkout |
| `ROCKET_*` | Rocket via aggregator/enterprise API (TBD) |
| `STEADFAST_API_KEY/STEADFAST_SECRET_KEY[/BASE_URL]` | Steadfast consignment booking |

See `.env.example` for details. Never commit a real `.env`.

## Admin panel

Visit `/admin` (redirects to `/admin/login`). Protected by a password
(`ADMIN_PASSWORD` env var) checked with a timing-safe comparison; sessions
are HMAC-SHA256 signed cookies (`amader_admin`, HttpOnly, 7 days). Route
protection runs in `middleware.ts`; API routes check `requireAdminApi()`.

Manage from the panel: dashboard (revenue, orders, low stock, 7-day chart),
orders (filter/search, status flow Confirm → Pack → Ship → Deliver, payment
toggle), products (CRUD, delete blocked when in order history), categories
(inline CRUD, delete blocked when products exist), customers, promo codes
(DB-backed; checkout validates server-side), and settings (announcement bar
text, delivery charge, free-delivery threshold).

## Promo codes

Promo rules live in the `Promo` table (managed at `/admin/promos`) and are
validated **server-side** in `POST /api/orders` via `applyPromoAsync()`
(the checkout page only shows a live estimate with the sync `applyPromo()`):

| Code | Deal | Min. order | Max discount |
|---|---|---|---|
| `AMADER10` | 10% off | ৳500 | ৳500 |

Codes are case-insensitive; only `active` promos apply. The discount is
stored on the order (`discount`, `promoCode` columns). When the database is
unreachable, the hardcoded `PROMOS` fallback in `lib/promos.ts` is used.

## What's stubbed (honest TODOs)

- **Online payments:** `POST /api/payments/{bkash,nagad,rocket}/create|callback`
  return `501 PROVIDER_NOT_CONFIGURED`. Real flows are skeletoned in
  `lib/payments/` — bKash grant→create→execute is fully written and only
  needs credentials; Nagad needs the RSA encrypt/sign step; Rocket needs an
  aggregator or DBBL enterprise API. Nothing fakes a charge.
- **Steadfast:** `lib/courier/steadfast.ts` calls the real
  `create_order` API when keys are set; booking is manual via
  `POST /api/courier/steadfast/book` (never automatic).
- **Orders without a DB** are kept in process memory and lost on restart.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:seed` | `prisma db seed` (needs `DATABASE_URL`) |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma migrate deploy` | Apply migrations (needs `DATABASE_URL`) |
| `npx prisma studio` | Browse data (needs `DATABASE_URL`) |

## Hero images

The three hero banners (`public/hero-1.jpg` … `hero-3.jpg`) are stored as
base64 **text** in `scripts/hero-images.base64.json` because the GitHub
snapshot-push API used for deploys only accepts UTF-8 text files — binary
JPGs cannot be pushed through it. `scripts/decode-hero-images.mjs` restores
them into `public/` and runs automatically via the `postinstall` hook, so a
fresh `npm install` (locally or on Vercel) always produces working images
with no manual step. To replace a banner: overwrite the JPG in `public/`,
re-encode it into the JSON, and push — the hook does the rest.
