<div align="center">

# Patrik Products UI

### B2B Partner Portal for Patrik International

A modern, dark-themed partner portal built with Next.js 16 — enabling partners to browse products, manage exports, and streamline their product data workflows.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Auth0](https://img.shields.io/badge/Auth0-Protected-EB5424?style=for-the-badge&logo=auth0)](https://auth0.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)

</div>

---

## What It Does

Patrik Products UI is a **B2B partner portal** that gives authorized partners secure access to Patrik International's product catalog. Partners can browse products, view detailed variant information with live pricing and stock data, and export product data in multiple formats for use in their own systems.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Product Catalog** | Browse products in grid or list view with search and filtering |
| **Product Details** | View variants, SKUs, EAN codes, stock levels, and multi-pricelist pricing |
| **Data Export** | Export product data as CSV, JSON, or XML with 4 built-in presets |
| **Custom Exports** | Save reusable export configurations with custom field selection |
| **AI Categories** | AI-powered product categorization linked to export configs |
| **Contact Form** | Built-in contact form with Gmail SMTP integration |

### Export Presets

- **Shopify** — Ready-to-import CSV matching Shopify's product import schema
- **Simple** — Basic product info (name, SKU, EAN, price, stock, category)
- **Detailed** — Complete product data including descriptions, images, and metadata
- **Inventory** — Shopify inventory import format with location-based stock levels

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Auth | [Auth0](https://auth0.com/) (Next.js SDK v4) |
| Email | [Nodemailer](https://nodemailer.com/) (Gmail SMTP) |
| Fonts | [Orbitron](https://fonts.google.com/specimen/Orbitron) + [Montserrat](https://fonts.google.com/specimen/Montserrat) |
| Deployment | Docker (standalone build) |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Auth0 account** — [sign up free](https://auth0.com/)
- **Gmail App Password** — for contact form ([how to generate](https://myaccount.google.com/apppasswords))
- **Backend API** running ([patrik-products-export](../))

### Install & Run

```bash
# Clone and install
git clone <repository-url>
cd patrik-products-ui
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPORT_API_URL` | Backend API base URL | `http://localhost:4000` |
| `GMAIL_EMAIL` | Gmail address for contact form | `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail app password | `xxxx-xxxx-xxxx-xxxx` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `your-tenant.auth0.com` |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | — |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | — |
| `AUTH0_SECRET` | Session encryption secret (32+ chars) | `openssl rand -hex 32` |
| `AUTH0_BASE_URL` | Application base URL | `http://localhost:3000` |
| `APP_BASE_URL` | Application base URL | `http://localhost:3000` |

### Production

```bash
# Build and start
npm run build
npm start

# Or with Docker (production images are built by CI, see docs/DEPLOYMENT.md)
docker build -t t4a-partner-portal-ui .
docker run -p 3000:3000 --env-file .env t4a-partner-portal-ui
```

---

## Project Structure

```
patrik-products-ui/
├── src/
│   ├── app/
│   │   ├── (protected)/              # Auth-gated routes
│   │   │   ├── product/              # /product — catalog grid
│   │   │   │   └── [token]/          # /product/:token — detail page
│   │   │   ├── export/               # /export — export builder
│   │   │   └── categories/           # /categories — AI categories
│   │   ├── nextapi/                  # API proxy routes → backend
│   │   ├── contact/                  # /contact — contact form
│   │   ├── layout.js                 # Root layout + animated background
│   │   └── page.js                   # Homepage (guest / logged-in views)
│   ├── components/                   # React components
│   │   ├── ExportPage.js             # Export builder UI
│   │   ├── ProductGrid.js            # Product grid/list view
│   │   ├── ProductVariants.js        # Variant selector + pricing
│   │   ├── ProductImageGallery.js    # Image carousel
│   │   ├── CategoriesPage.js         # AI category management
│   │   ├── Navbar.js                 # Navigation bar
│   │   └── ...                       # Auth + profile components
│   ├── lib/
│   │   └── auth0.js                  # Auth0 client config
│   └── proxy.js                      # Middleware (role-based access)
├── docs/                             # Documentation
├── public/                           # Static assets
├── CLAUDE.md                         # Claude Code guidelines
└── package.json
```

---

## Architecture Overview

The app follows a **Server Component + Client Component** pattern:

```
Backend API ──fetch()──> Server Components ──props──> Client Components ──> Browser
                              │                            │
                         Auth checks               UI state + interactions
                         Data fetching             localStorage persistence
```

- **Server Components** handle authentication, data fetching, and permission filtering
- **Client Components** manage interactive UI state (selections, filters, views)
- **API Proxy** routes (`/nextapi/*`) forward authenticated requests to the backend
- **Middleware** (`proxy.js`) enforces the `export` role gate on all protected routes

> For a deep dive, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Create production build (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## Documentation

Detailed documentation lives in the [`docs/`](./docs/) folder:

| Document | What It Covers |
|----------|---------------|
| [Architecture](./docs/ARCHITECTURE.md) | Application layers, auth flow, data flow, state management, security |
| [API Reference](./docs/API.md) | All backend & internal endpoints, request/response formats, data structures |
| [Components](./docs/COMPONENTS.md) | Complete component library with props, state, and usage examples |
| [Development Guide](./docs/DEVELOPMENT.md) | Setup, workflow, common tasks, debugging, deployment |
| [Roles & Auth](./docs/ROLES_AUTH.md) | Auth0 integration, role definitions, token flow, RBAC |
| [Design System](./docs/DESIGN_SYSTEM.md) | Colors, typography, component patterns, animations |

---

## License

Proprietary - Patrik International

## Contact

- **Email:** info@patrikinternational.com
- **Website:** [patrikinternational.com](https://www.patrikinternational.com)
