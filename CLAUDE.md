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
  - `/integrations/shopify` - Shopify integration: connect stores and manage the one-way product push per source (see "Shopify Integration" below). `/integrations/shopify-deprecated` is the same UI with `variant="prerelease"` (bring-your-own-app connect)

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
- `ShopifyIntegrationPage` (`src/components/ShopifyIntegrationPage.js`): orchestrator for the Shopify integration (store list + selection, URL-param handling, toasts). Everything for one store lives under `src/components/shopify/` (see "Shopify Integration" below)
- `Navbar` (`src/components/Navbar.js`): Left sidebar — a port of the admin's `components/nav.tsx` (220px / 60px collapsible rail, accordion sections with coloured icon chips persisted in localStorage, theme toggle + user block at the bottom, mobile top bar + slide-out drawer). Sections are gated by the `export` role
- `PageHeader` (`src/components/ui/PageHeader.js`): the sticky h-14 page title bar (title · count/badge pill · description · right actions) every page starts with; pages then render their body in a `p-4 md:p-8` block

### Export & Category Access Filtering
Exports and categories are filtered server-side before passing to client components:
- An export is visible if: its `roles` array is empty/absent OR the user has one of the listed roles, AND its `users` array is empty/absent OR the user's Auth0 `sub` is listed
- Filtering uses the session's `https://time-4-action.com/roles` claim and `user.sub`

### Styling
- Tailwind CSS v4 (using `@tailwindcss/postcss` plugin); icons from `lucide-react`
- **Visual system is 1:1 with t4a-admin** (`../t4a-admin`): the same app shell (`body` = `flex h-screen overflow-hidden`, sidebar + one scrolling `<main>`), Geist Sans / Geist Mono, the shadcn-style tokens copied from the admin's `app/globals.css`, the same page header, buttons, inputs, selects, dialogs, tables, badges, skeletons and the light / system / dark toggle. When adding UI, copy what the admin does for the equivalent element — the class recipes live in `src/lib/ui.js` (`btn`, `input`, `textarea`, `badge`, `card`, `dialog`, `popover`, `table`, `countPill` …) and are meant to be used with `cn()` from `src/lib/utils.js`.
- Page pattern: `<div className="flex flex-col min-h-full"><PageHeader …/><div className="flex-1 p-4 md:p-8">…</div></div>` (see ProductGrid / ExportPage). Buttons are `h-9` (`h-8` small) `rounded-md font-medium`; primary = `bg-primary`, secondary = outline (`border bg-background shadow-xs hover:bg-accent`), destructive = `bg-destructive`. Inputs/selects are `h-9 rounded-md border-input bg-transparent dark:bg-input/30` with the `ring-[3px] ring-ring/50` focus. Dialogs: overlay `bg-black/50`, panel `rounded-lg border bg-background shadow-lg`. Popovers/menus: `rounded-md border bg-popover p-1 shadow-md`. No gradients, glows or translucent surfaces.
- **Themes:** light is the default; `.dark` on `<html>` switches (Tailwind `dark:` variant is available via `@custom-variant`). Plumbing: `src/lib/theme.js` (storage key `theme` = light|dark|system, inline before-paint bootstrap script), `src/lib/theme-context.js` (`ThemeProvider` / `useTheme`, ported from the admin), `src/components/ThemeToggle.js` (three-way segmented control, lives in the Navbar).
- **Tokens** (`src/app/globals.css`, exposed through `@theme inline`). Never use raw `neutral-*`, `black`/`white` surfaces or the old `#01a0be` cyan in UI code:
  - Surfaces: `bg-background` (page), `bg-card` / `bg-surface` (cards, solid), `bg-popover` (menus, modals), `bg-muted` (inputs, hover rows, subtle panels — `/40` etc. for tints), `bg-accent` (hover surface, secondary buttons), `bg-sidebar` (nav chrome), `bg-foreground/[0.03]` (frosted fills), `bg-black/50` (overlays)
  - Borders: `border-border` (hairlines, also `divide-border`), `border-input` (form controls), `ring-ring` (focus)
  - Text: `text-foreground`, `text-muted-foreground` (+ `/70`, `/40` for fainter)
  - Brand: `bg-primary text-primary-foreground` for primary buttons/switch-on/progress (near-black on light, near-white on dark — as in the admin); `text-accent-brand` / `border-accent-brand` / `bg-accent-brand/10` for the teal brand accent (links, active markers, tints)
  - Status text: `text-{cyan|amber|red|emerald|green|purple|violet|blue|orange|pink}-fg` (+ `-soft`, `-softer`, `-deep`) — 600 on light, 400 on dark like the admin's `text-amber-600 dark:text-amber-400`; tinted backgrounds/borders like `bg-amber-500/10` stay as-is
  - Shadows: `shadow-sm` cards, `shadow-md` popovers, `shadow-lg` dialogs (no coloured glows); toasts: `bg-emerald-tint` / `bg-red-tint`
- Loading states use the admin's `.skeleton` shimmer class (not `animate-pulse`); `.reveal` and `.overline` helpers are available too

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

- **Parent** fields: `code`, `token` (URL handle, e.g. `chase-dw-x-downwind`), `product_name`, `short_description`/`detailed_description` (HTML), `images[]` (gallery), `additional_content[]` (raw HTML blocks from PNV "Dodatna vsebina N"), `categories[]` (PNV path), `ai_categories[]`, `published`, `active`, `archived`, `stock_amount` (often `0` when variants carry the stock), `pricelist[]` (often empty when variants carry pricing), `ean_code`, `size`.
- **Variant** (`child_products[]`) fields: `code` (the **SKU**), `ean_code` (the **barcode**), `token`, `product_name`, `size` (Shopify Option1 value, e.g. `"77"`), `stock_amount`, `images[]`, `published`/`archived`/`cart`/`new`/`recomended` (per-variant flags), and `pricelist[]`.
- **`pricelist[]`** is an array of named price lists, each `{ name, valid_from, price, vat }` — e.g. `RRP 2025` (`vat: 22`, tax-inclusive) and a future-dated `RRP 2026` (`vat: 0`). There is no single price field; a price is **resolved** from this array using the export config's `pricelistPriority` (see `getPriceFromPriority` in the API). VAT and `valid_from` differ per list, so the chosen list matters.
- **`ai_categories[]`** holds `{ exportId, categoryId, categoryName }` per AI export — the same product can be categorized differently for each export, keyed by `exportId`.
- **Publishing:** both parents and individual variants have a `published` flag. A parent can be published while some variants are not (those are excluded everywhere — exports are always published-only).
- **No-variant products:** if `child_products` is empty, the parent itself is the sellable item and its own `code`/`pricelist`/`stock_amount` are used.
- Export presets transform this data into different formats (Shopify CSV, simple list, detailed data, inventory/Shopify inventory import).

### Shopify Integration
The `/integrations/shopify` page manages any number of connected Shopify stores; each store pushes one or more **sources** (a Patrik export config or an Own Source feed) to its own Shopify location with its own settings. Backend: `/api/export/shopify/*` (API repo `src/controllers/shopifyController.js`), reached through the thin proxies under `src/app/nextapi/export/shopify/`.

- **Route:** `src/app/(protected)/integrations/shopify/page.js` (Server Component; loads connections, Shopify-preset exports, pricelists, feeds and AI exports, then renders the client page) + `loading.js` skeleton. `initialConnections === null` (fetch failed) switches the client into a mock-data demo; `[]` shows the connect screen.
- **Page order:** header → `StoreSwitcher` → `StoreOverview` (status · last sync · sync state · issues · Sync now · overflow menu) → `SourcesSection` (read-only rows; Configure opens a modal) → `SyncActivity` (stats + latest 5 runs, run detail + history modals) → `AttentionSection` (unmatched + deleted-in-store, grouped/filterable) → `ApiAccessSection` (Sources API keys, managed in a modal) → `DangerZone` (disconnect behind a confirmation).
- **Components** (`src/components/shopify/`): `shared.js` holds the status vocabulary (`RUN_STATUS`, `storeStatus`), `SYNC_FLAGS` / `OWNERSHIP_MODES`, UTC formatters, the demo `MOCK_*` data and the primitives (`Badge`, `Button`, `Modal` with focus trap, `Menu`, `Section`, `Field`, `Toggle`, `Segmented`, `Disclosure`, `Toasts`). `ConnectionPanel.js` owns one store's state and every mutation (`persistScopes`, sync/poll, recreate, rename, reconnect, disconnect). `SourceConfigModal.js` is the single add/configure form — it edits a **draft** scope (`normalizeScope` gives a key-ordered object so dirtiness is a JSON compare), Save is disabled until dirty, and it closes only after the parent's save resolves `{ ok: true }`. `ConnectStore.js` holds the connect screens (standard OAuth + deprecated bring-your-own-app wizard).
- **Save contract:** there is no page-level save bar — every change is persisted from its modal. `buildConfigPayload` PUTs `{ shopifyLocationId, config: { …firstScopeFields, scopes[] } }`; each scope always carries its full per-source config (ownership, sync flags, pricing incl. `priceFactor` / `priceRounding` / compare-at / sale policy, `variantOptionName`, `titlePrefix`, `pricelistPriority`, `publicationIds`, `aiExportId`) and its Sources-API identity (`id` / `name` / `enabled`) so a save can never strip or inherit another source's value. `src/lib/priceRounding.js` and `src/lib/comparePrice.js` are literal ports of the API's normalizers — change both sides together.
- Nav link "Shopify" → `/integrations/shopify` in `src/components/Navbar.js` (export role gate).

### Client vs Server Components
- All pages under `/app` are Server Components by default (handle auth checks, API fetching)
- Interactive components like ProductGrid, ExportPage, CategoriesPage use `"use client"` directive
- Server Components fetch data and filter by user permissions; Client Components receive pre-filtered props

### Route Group Convention
- `(protected)` folder is a route group - doesn't affect URL path but allows shared layouts
- The layout.js inside `(protected)` enforces authentication for all nested routes

### Image Configuration
Next.js Image component allows: `imgs.pnvnet.si`, `www.patrikinternational.com/assets/**`, `via.placeholder.com`, `s.gravatar.com`, `lh3.googleusercontent.com`, `encrypted-tbn0.gstatic.com`
