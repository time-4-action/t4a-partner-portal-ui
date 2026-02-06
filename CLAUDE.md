# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 partner portal for Patrik International built with the App Router architecture. The application provides product browsing, detailed product views, and export functionality for partners. Authentication is handled via Auth0.

## Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (output: standalone)
npm start            # Start production server
npm run lint         # Run ESLint
```

## Architecture

### Authentication Flow
- Uses `@auth0/nextjs-auth0` package
- Auth0 client initialized in `src/lib/auth0.js`
- Protected routes use the `(protected)` route group convention
- Protected layouts wrap children with `auth0.withPageAuthRequired()` (see `src/app/(protected)/product/layout.js`)
- Auth0 middleware is NOT in a middleware.js file - it's configured in `src/proxy.js` but currently has an API inconsistency issue

### Route Structure
- **Public routes:**
  - `/` - Homepage
  - `/contact` - Contact form (sends email via nodemailer)
- **Protected routes (require Auth0 login):**
  - `/product` - Product grid/list view (fetches from backend API)
  - `/product/[token]` - Individual product detail page with variants
  - `/export` - Advanced export functionality with multiple format presets (Shopify, Simple, Detailed, Inventory)

### API Integration
- Backend API URL configured via `EXPORT_API_URL` environment variable
- Default: `http://localhost:4000`
- Main endpoints:
  - `GET /product` - Fetch all products
  - `GET /product/{token}` - Fetch single product with variants
- All product fetches use `cache: "no-store"` for fresh data
- Products have child_products array containing variants with pricelists, images, stock, and EAN codes

### Key Components
- `ProductGrid` (`src/components/ProductGrid.js`): Client component with grid/list toggle, product selection, and local storage persistence
- `ProductVariants` (`src/components/ProductVariants.js`): Displays product details with variant selection
- `ExportPage` (`src/components/ExportPage.js`): Complex export UI with preset configurations (Shopify, Simple, Detailed, Inventory formats)
- `Navbar` (`src/components/Navbar.js`): Navigation with Auth0 login/logout buttons and user profile

### Styling
- Tailwind CSS v4 (using `@tailwindcss/postcss` plugin)
- Custom CSS variables for fonts: `--font-orbitron` and `--font-montserrat`
- Animated blob backgrounds defined in root layout
- Dark theme with cyan/blue accent colors

### Image Configuration
Next.js Image component is configured to allow images from:
- `imgs.pnvnet.si`
- `www.patrikinternational.com/assets/**`
- `via.placeholder.com`
- `s.gravatar.com` (for Auth0 user avatars)
- `lh3.googleusercontent.com` (for Google profile pictures)

### Environment Variables
Required variables (see `.env`):
- `EXPORT_API_URL` - Backend API base URL
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
Products have a specific structure with:
- Parent product: contains token, product_name, images array, categories
- Child products (variants): array containing SKU, EAN, stock, pricelists with prices
- Export presets transform this data into different formats (Shopify CSV, simple list, detailed data, inventory)

### Client vs Server Components
- All pages under `/app` are Server Components by default (handle auth checks, API fetching)
- Interactive components like ProductGrid, ExportPage use "use client" directive
- Server Components fetch data directly; Client Components receive initialProducts props

### Route Group Convention
- `(protected)` folder is a route group - doesn't affect URL path but allows shared layouts
- The layout.js inside `(protected)` enforces authentication for all nested routes

### Contact Form
- Sends emails via nodemailer configured with Gmail SMTP
- Route handler at `src/app/nextapi/contact/route.js`
- Uses GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables
