# Amanah Jewellery website

React + Vite storefront for AMANAH JEWELLERY: Handcrafted Designer Jewellery.

```bash
npm install
cp .env.example .env.local   # VITE_API_URL = the backend's address
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

The backend (products, checkout with Razorpay, contact, newsletter, admin panel)
is the Next.js app in [`backend/`](backend/README.md). Run both together:

```bash
cd backend && npm run dev -- -p 4000   # API + admin at http://localhost:4000/admin
npm run dev                            # storefront, from the repo root
```

Without `VITE_API_URL` the storefront runs on the demo catalogue in
`src/data/products.js` and its forms say they are not connected.

## Replacing placeholders

The site was built before the brand PDFs were supplied, so some content is
temporary. Each item below is a single place to change.

| What | Where |
| --- | --- |
| Logo (done) | `public/brand/`: transparent ivory/burgundy/gold versions cut from `amanah-logo-original.png` (680×320). Replace them with SVG or high-res exports when available; `src/components/Logo.jsx` picks the file. |
| Campaign / editorial photos | copy into `public/images/`, set `src` in `src/data/media.js` |
| Product catalogue, prices, photos | `src/data/products.js` (all demo data) |
| Collections | `src/data/collections.js` |
| Email, phone, WhatsApp, address, social links | `src/data/site.js` |
| Brand fonts (if the logo presentation names others) | `--ff-display` / `--ff-body` in `src/styles/tokens.css` and the font link in `index.html` |
| Placeholder image labels | set `showImageLabels: false` in `src/data/site.js` |
| "Preview catalogue" notice | shown automatically while `VITE_API_URL` is not set (`demoCatalogue` in `src/data/site.js`) |

Anything with a `null` value in `site.js` is shown as "Coming soon" rather than invented.

## Backend hooks

`src/utils/api.js` is the only place the UI talks to the backend.

- `loadCatalogue()` runs once in `src/main.jsx` before the app renders and swaps the demo
  catalogue for the live one, so every page keeps reading `src/data/products.js`.
- `placeOrder` calls `/api/checkout`, opens Razorpay's payment window, then confirms the payment
  with `/api/checkout/verify`. The bag is emptied only after the backend confirms the order is paid.
- `sendContactMessage` and `subscribeNewsletter` post to `/api/contact` and `/api/newsletter`.
- If the backend answers that a feature is not set up (for example no Razorpay keys yet), the form
  says so; **no order, payment or message is ever reported as successful unless the backend confirms it**.

## Structure

```
src/
  components/   Header, Footer, ProductCard, Gallery, overlays (cart drawer, quick view, search, toasts), UI primitives
  pages/        Home, Shop, Product, Collections, Cart, Checkout, About, Contact, Wishlist, Account, 404
  layouts/      MainLayout
  context/      StoreContext (cart + wishlist persisted to localStorage, toasts, overlay state)
  data/         site, media, collections, products
  hooks/        reveal-on-scroll, body scroll lock, scroll state
  utils/        api, formatting/validation, safe storage
  styles/       tokens, base, layout, components, home, pages
```
