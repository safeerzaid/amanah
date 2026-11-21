# Amanah Jewellery backend

Next.js app that serves the storefront's API and the store owner's admin panel.
Data lives on Coolify: Postgres for products, orders and messages, and MinIO for
product photos. Payments go through Razorpay, emails through Resend.

## What's here

| Path | What it does |
| --- | --- |
| `GET /api/products`, `GET /api/products/[id]` | Catalogue in the storefront's product shape (id or slug) |
| `POST /api/checkout` | Prices the bag from the database, saves a PENDING order, opens a Razorpay order |
| `POST /api/checkout/verify` | Checks the Razorpay signature and payment, marks the order PAID, sends emails |
| `POST /api/webhooks/razorpay` | Backup confirmation on `payment.captured` |
| `POST /api/contact`, `POST /api/newsletter` | Contact form and newsletter sign-up |
| `GET /api/health` | Health check for Coolify (checks the database) |
| `/admin` | Admin panel: orders, products and photos, messages and subscribers |

Code map: `src/lib/` holds the shared logic (database, auth, Razorpay, orders,
storage, email), `src/app/api/` the routes, `src/app/admin/` the admin pages and
their server actions, `prisma/` the schema, migrations and seed.

## Run it locally

```bash
cd backend
npm install                   # also generates the Prisma client
cp .env.example .env          # then fill it in; the backend will not start without it
npm run admin:hash -- "a-long-admin-password"   # paste the output into ADMIN_PASSWORD_HASH
npm run db:deploy             # create the tables
npm run db:seed               # load the demo catalogue from ../src/data/products.js
npm run dev                   # admin at /admin — read the port it prints:
                              # Next.js moves to 3001 if 3000 is taken
```

For a database, use the Coolify Postgres public URL (turn public access off
again later), or run `npx prisma dev` for a throwaway local one.

Changing the schema: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name what-changed`
and commit the new folder in `prisma/migrations/`.

## Deploy on Coolify

1. **Postgres:** New Resource → Database → PostgreSQL. Copy its internal URL. Turn on scheduled backups.
2. **MinIO:** New Resource → Service → MinIO. Create a bucket `amanah-products`, set its
   access policy to public read (photos only), and create an access key for the backend.
3. **Backend:** New Resource → Application → this GitHub repo.
   - Base directory: `/backend`
   - Build command: `npm run build` · Start command: `npx prisma migrate deploy && npm start`
   - Port: `3000` · Health check path: `/api/health`
   - Domain: `https://api.<your domain>`
   - Environment variables: everything in `.env.example`, with `DATABASE_URL` set to the
     internal Postgres URL and `STOREFRONT_ORIGIN` set to the storefront's real URL.
4. **Razorpay:** Settings → Webhooks → add `https://api.<your domain>/api/webhooks/razorpay`,
   events `payment.captured` and `payment.failed`, and copy the secret you set into
   `RAZORPAY_WEBHOOK_SECRET`. Turn on automatic capture under payment settings
   (the verify route also captures authorised payments itself).
5. **Seed once (optional):** the seed script reads the storefront's demo data from the
   repo root, so run `npm run db:seed` from your machine against the database's public URL,
   or add the products by hand in `/admin/products`.

## Before going live

- Use Razorpay Test Mode keys until a full test order has gone through, then switch to live keys.
- Razorpay is for India-registered businesses; charging in CAD needs International
  Payments enabled on the account. Otherwise set `STORE_CURRENCY="INR"` and price in rupees.
- Shipping and taxes are not added yet: the amount charged is the bag subtotal.
- Rate limits are kept in memory, which is fine for one backend instance.
