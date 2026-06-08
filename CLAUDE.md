# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 partner portal for Patrik International built with the App Router architecture. The application provides product browsing, detailed product views, export functionality, and AI-powered category management for partners. Authentication and authorization are handled via Auth0.

## Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (output: standalone)
npm start            # Start production server
npm run lint         # Run ESLint
```

## Architecture

### Authentication & Authorization Flow
- Uses `@auth0/nextjs-auth0` package; Auth0 client initialized in `src/lib/auth0.js`
- **Middleware** lives in `src/proxy.js` (not `middleware.js`) — Next.js is configured to pick it up from there. It runs on all non-static routes, calls `auth0.middleware()`, then enforces the `export` role gate
- Users without the `export` role are redirected to `/unauthorized`
- Role claims are read from the custom Auth0 JWT claim `https://time-4-action.com/roles`, set by an Auth0 Post-Login Action
- Protected layouts additionally wrap children with `auth0.withPageAuthRequired()` (see `src/app/(protected)/product/layout.js`)
- Role checks are duplicated: middleware handles the global redirect, individual pages do fine-grained access checks (e.g. the export page re-checks the `export` role)

### Route Structure
- **Public routes:**
  - `/` - Homepage
  - `/contact` - Contact form (sends email via nodemailer)
  - `/unauthorized` - Shown when user is authenticated but lacks the `export` role
- **Protected routes (require Auth0 login + `export` role):**
  - `/product` - Product grid/list view
  - `/product/[token]` - Individual product detail page with variants
  - `/export` - Export UI with preset configurations and custom export management
  - `/categories` - AI-powered category management; links categories to export configs
  - `/integrations/shopify` - Shopify integration UI: connect a store and configure the one-way product push (stock, products, prices, descriptions, images). **UI-only / mock data so far — no backend wired** (see "Shopify Integration" below)

### API Proxy Pattern
All routes under `src/app/nextapi/` are thin authenticated proxies to the backend. The pattern is: obtain an Auth0 access token via `auth0.getAccessToken()`, then forward the request to `BACKEND` (from `EXPORT_API_URL`) with `Authorization: Bearer <token>`. No business logic lives in these proxies.

Backend proxy endpoints:
- `/nextapi/exports` — CRUD for export configurations (`/exports` on backend)
- `/nextapi/export/custom-export` — CRUD for custom exports (`/custom-export` on backend)
  - `/[id]` — GET, PUT, DELETE a single custom export
  - `/[id]/keys` — manage API keys for a custom export
  - `/[id]/keys/[keyId]` — delete a specific key
  - `/[id]/access` — manage per-user access
  - `/[id]/access/[email]` — remove a specific user's access
  - `/[id]/csv`, `/[id]/json`, `/[id]/xml` — generate export files in each format
- `/nextapi/categories` — CRUD for categories; supports `?exportId=` query param to fetch by export
  - `/import` — bulk category import
  - `/by-export/[exportId]` — fetch categories scoped to an export
- `/nextapi/products/ai-categories` — fetch products with AI-assigned categories (`?exportId=` required); DELETE clears AI categories for an export
- `/nextapi/products/[id]/ai-category` — set/update AI category for a single product
- `/nextapi/ai-categorization` — trigger AI categorization job
- `/nextapi/contact` — sends contact form email via nodemailer

### Key Components
- `ProductGrid` (`src/components/ProductGrid.js`): Client component with grid/list toggle, product selection, and local storage persistence
- `ProductVariants` (`src/components/ProductVariants.js`): Displays product details with variant selection
- `ExportPage` (`src/components/ExportPage.js`): Complex export UI; receives `initialProducts`, `apiUrl`, and `allowedExports` (filtered by user role/ID). Handles both preset export formats (Shopify, Simple, Detailed, Inventory) and custom export configs fetched from the backend. The **Inventory preset** has special behavior: it skips the field-selection step (fixed Shopify inventory columns), replaces the Pricelist Priority panel with a Shopify Location Name input, and only offers CSV download (no JSON/XML). The location name is stored as `inventoryLocationName` on the config and must exactly match the Shopify location name (case-sensitive)
- `CategoriesPage` (`src/components/CategoriesPage.js`): AI category management UI; receives `initialExports` filtered to those the user can access
- `ShopifyIntegrationPage` (`src/components/ShopifyIntegrationPage.js`): Partner-facing Shopify connect/configure UI. **UI-only** — a single `"use client"` component whose state is seeded from module-level `MOCK_*` constants; no backend calls (see "Shopify Integration" below). Receives `initialExports` (reuses the same role/user export filter) and `ownerEmail`
- `Navbar` (`src/components/Navbar.js`): Navigation with Auth0 login/logout buttons and user profile; the user dropdown menu uses the `animate-dropdown` keyframe defined in `globals.css`

### Export & Category Access Filtering
Exports and categories are filtered server-side before passing to client components:
- An export is visible if: its `roles` array is empty/absent OR the user has one of the listed roles, AND its `users` array is empty/absent OR the user's Auth0 `sub` is listed
- Filtering uses the session's `https://time-4-action.com/roles` claim and `user.sub`

### Styling
- Tailwind CSS v4 (using `@tailwindcss/postcss` plugin)
- Custom CSS variables for fonts: `--font-orbitron` and `--font-montserrat`
- Animated blob backgrounds defined in root layout
- Dark theme with cyan/blue accent colors

### Environment Variables
Required variables (see `.env`):
- `EXPORT_API_URL` - Backend API base URL (default: `http://localhost:4000`)
- `GMAIL_EMAIL` - Gmail address for contact form
- `GMAIL_APP_PASSWORD` - Gmail app password for nodemailer
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret
- `AUTH0_SECRET` - Secret for session encryption
- `AUTH0_BASE_URL` - Application base URL (for Auth0 callbacks)
- `APP_BASE_URL` - Application base URL

## Important Notes

### Product Data Structure
A product document in the `products` collection is a **parent** that may hold a `child_products` array of **variants**. Variants — not the parent — are usually the sellable SKUs.

- **Parent** fields: `code`, `token` (URL handle, e.g. `chase-dw-x-downwind`), `product_name`, `short_description`/`detailed_description` (HTML), `images[]` (gallery), `categories[]` (PNV path), `ai_categories[]`, `published`, `active`, `archived`, `stock_amount` (often `0` when variants carry the stock), `pricelist[]` (often empty when variants carry pricing), `ean_code`, `size`.
- **Variant** (`child_products[]`) fields: `code` (the **SKU**), `ean_code` (the **barcode**), `token`, `product_name`, `size` (Shopify Option1 value, e.g. `"77"`), `stock_amount`, `images[]`, `published`/`archived`/`cart`/`new`/`recomended` (per-variant flags), and `pricelist[]`.
- **`pricelist[]`** is an array of named price lists, each `{ name, valid_from, price, vat }` — e.g. `RRP 2025` (`vat: 22`, tax-inclusive) and a future-dated `RRP 2026` (`vat: 0`). There is no single price field; a price is **resolved** from this array using the export config's `pricelistPriority` (see `getPriceFromPriority` in the API). VAT and `valid_from` differ per list, so the chosen list matters.
- **`ai_categories[]`** holds `{ exportId, categoryId, categoryName }` per AI export — the same product can be categorized differently for each export, keyed by `exportId`.
- **Publishing:** both parents and individual variants have a `published` flag. A parent can be published while some variants are not (those are excluded everywhere — exports are always published-only).
- **No-variant products:** if `child_products` is empty, the parent itself is the sellable item and its own `code`/`pricelist`/`stock_amount` are used.
- Export presets transform this data into different formats (Shopify CSV, simple list, detailed data, inventory/Shopify inventory import).

### Shopify Integration (UI-only — backend not yet built)
The `/integrations/shopify` page lets a partner connect their Shopify store and configure a one-way push of catalog data. **As of now this is a front-end-only build** — there are no backend endpoints and no `nextapi` proxies for it yet. The full design lives in `shopify_integration.md` at the repo root.

- **Route:** `src/app/(protected)/integrations/shopify/page.js` (Server Component, `export`-role gated, reuses the same export-config filter as the Export/Categories pages to populate the "Products to sync" selector) + `loading.js` skeleton.
- **Component:** `src/components/ShopifyIntegrationPage.js` — one `"use client"` component. All state is local React state seeded from module-level `MOCK_*` constants (`MOCK_CONNECTION`, `MOCK_LOCATIONS`, `MOCK_EXPORTS`, `MOCK_SYNC_JOBS`, `MOCK_UNMATCHED`, `MOCK_COUNTS`). It renders two states driven by `isConnected`: **NOT CONNECTED** (enter a `myshopify` domain → "Connect", with a security/trust rail) and **CONNECTED** (status summary, needs-attention report, what-to-sync toggles, ownership-mode radios, products/location selectors, pricing = drag-to-reorder pricelist priority + VAT mode + future-dated guard, sync-activity table, disconnect, and a sticky save bar when config is dirty). `isConnected` defaults to `true` so the rich UI shows first.
- **Backend seams (what to wire when the API lands):** the `connect` / `disconnect` / `syncNow` / `saveConfig` handlers and the `MOCK_*` constants are the only things to replace. Per `shopify_integration.md` §10 the API surface is `/api/export/shopify/*`, reached through new thin proxies under `src/app/nextapi/...` following the existing proxy pattern.
- Nav link "Shopify" → `/integrations/shopify` is added in `src/components/Navbar.js` under the `export` role gate.

### Client vs Server Components
- All pages under `/app` are Server Components by default (handle auth checks, API fetching)
- Interactive components like ProductGrid, ExportPage, CategoriesPage use `"use client"` directive
- Server Components fetch data and filter by user permissions; Client Components receive pre-filtered props

### Route Group Convention
- `(protected)` folder is a route group - doesn't affect URL path but allows shared layouts
- The layout.js inside `(protected)` enforces authentication for all nested routes

### Image Configuration
Next.js Image component allows: `imgs.pnvnet.si`, `www.patrikinternational.com/assets/**`, `via.placeholder.com`, `s.gravatar.com`, `lh3.googleusercontent.com`, `encrypted-tbn0.gstatic.com`
