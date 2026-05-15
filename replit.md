# Ýeňil

Türkmenistanda onlayn töleg we demirýol bilet platformasy — railway tickets, currency exchange (Payeer, Perfect Money, WebMoney), and payments.

## Run & Operate

- `pnpm --filter @workspace/yenil run dev` — run the frontend (port 21053)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET` — for screenshot uploads

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, Font Awesome icons (local), Poppins font
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- External data: Backendless (orders/questions storage), Cloudflare Worker proxy for railway API
- Upload: Cloudinary (screenshot proof uploads)

## Where things live

- `artifacts/yenil/` — React Vite frontend
  - `src/pages/` — Home, Demiryol, Pay, About, Help, Sms
  - `src/components/Layout.tsx` — shared header/footer/nav with dark mode
  - `public/images/` — logos (logo-header.png, logo-demiryol.png, logo-pay.png, etc.)
  - `public/css/all.min.css` — Font Awesome local CSS
  - `public/webfonts/` — Font Awesome webfonts
- `artifacts/api-server/src/routes/` — Express API routes
  - `demiryol.ts` — proxies to Cloudflare Worker for railway ticket lookup
  - `upload.ts` — multipart screenshot upload (Cloudinary or base64 fallback)

## Architecture decisions

- Static site (Vercel) migrated to React Vite + Express on Replit pnpm monorepo
- Font Awesome loaded from local `/public/css/all.min.css` (no CDN dependency)
- Dark/light theme stored in `localStorage` and applied via `body.className`
- Railway ticket lookup proxied through Express → Cloudflare Worker → railway.gov.tm
- Screenshot upload falls back to base64 data URL if Cloudinary not configured
- Backendless used directly from frontend for order/question storage (no DB needed)

## Product

- **Ýeňil demirýollary**: Book Turkmenistan railway tickets without a bank card. Price depends on days until travel (60-80 TMT). Ticket lookup by 6-char booking code.
- **Ýeňil Pay**: Currency exchange — buy/sell Payeer, Perfect Money, WebMoney for TMT (1 USD = 29 TMT buy, 19 TMT sell).
- **Help/FAQ**: Accordion FAQ + question submission form.
- **About**: Company info, team, values, contact.
- **SMS page**: SMS order instructions for offline users.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Font Awesome CSS uses relative paths to `/webfonts/` — both `public/css/` and `public/webfonts/` must be present
- The Cloudflare Worker URL is hardcoded: `https://railway-proxy.menturkmen111.workers.dev`
- Backendless APP_ID and API_KEY are hardcoded in frontend (public credentials for data storage only)
- `busboy` required for multipart form parsing in upload route

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
