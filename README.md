# Orderlynk — Frontend

React + Vite + TypeScript SPA for Orderlynk: marketplace discovery, storefronts,
cart/checkout, order tracking, and the vendor & admin consoles. Talks to the
Orderlynk backend API (separate repo).

## Quick start (`http://localhost:5173`)

Needs **Node 20+**. With the backend running on `http://localhost:8080`:

```bash
npm install
npm run dev
```

Vite proxies `/api/*` to `http://localhost:8080`, so no extra config is needed in
dev. Open `http://localhost:5173`.

### Demo logins

| Role     | Email                    | Password        |
| -------- | ------------------------ | --------------- |
| Admin    | `admin@orderlynk.app`    | `admin12345`    |
| Vendor   | `mama@orderlynk.app`     | `vendor12345`   |
| Customer | `customer@orderlynk.app` | `customer12345` |

(Seeded by the backend; admin password is changeable via **Account → Change password**.)

## Stack & layout

- **React 18 + Vite + TypeScript + Tailwind**, React Router for routing.
- `context/AuthContext` — JWT in `localStorage`, `/me` hydration.
- `context/CartContext` — single-vendor cart, persisted to `localStorage`.
- `lib/api.ts` — typed API client; `lib/types.ts` mirrors the backend DTOs (UUID ids
  are strings).
- Design system in `index.css` + `tailwind.config.js`: warm "market rails" theme,
  Fraunces / Hanken Grotesk / JetBrains Mono, the signature four-colour rail accent.

Pages: marketplace landing, vendor storefront, product detail, cart, checkout (with
live fee quote), order confirmation, order tracking, account / change-password, vendor
dashboard/products/orders, and admin dashboard/vendors/orders.

## Build

```bash
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
```

For production, set **`VITE_API_URL`** to the backend's URL at build time (the app
calls it directly; ensure the backend's `APP_CORS_ORIGINS` includes this site's URL).

## Deployment

`render.yaml` (in this directory) is a Render Blueprint that deploys the SPA as a
**static site** (`npm run build` → `dist`, with an SPA rewrite to `index.html`). Set
`VITE_API_URL` to the backend URL.
