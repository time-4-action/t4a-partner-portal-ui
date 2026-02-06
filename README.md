# Patrik Products UI - Partner Portal

A Next.js 16 partner portal for Patrik International providing product browsing, detailed product views, and advanced export functionality for partners.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)
![Auth0](https://img.shields.io/badge/Auth0-Protected-EB5424?logo=auth0)

## Overview

This application serves as a B2B portal for Patrik International partners to:
- Browse product catalog with grid/list views
- View detailed product information with variants
- Export product data in multiple formats (Shopify, Simple, Detailed, Inventory)
- Contact the company through a contact form
- Manage product selections with persistent state

## Key Features

### Authentication
- **Auth0 Integration**: Secure authentication with social login support
- **Protected Routes**: Automatic route protection for product and export pages
- **User Profiles**: Display user information with avatar support

### Product Management
- **Grid/List View Toggle**: Flexible product display options
- **Product Selection**: Select multiple products with localStorage persistence
- **Variant Support**: Products with multiple SKUs, pricing tiers, and stock levels
- **Image Galleries**: Multiple product images with carousel navigation
- **Price Display**: Multi-pricelist support with configurable priority

### Export Functionality
- **4 Export Presets**: Shopify CSV, Simple, Detailed, Inventory formats
- **Custom Field Selection**: Choose which fields to include in exports
- **Advanced Filtering**: Search, stock status, price range, categories, AI categories
- **Pricelist Priority**: Drag-and-drop pricelist ordering
- **Save Configurations**: Store and reuse export configurations
- **Live Preview**: See export data before downloading

### Contact System
- **Email Integration**: Contact form with Gmail SMTP
- **Automated Responses**: Confirmation emails sent to submitters

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Auth0 account
- Gmail account (for contact form)
- Backend API running (see API Integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd patrik-products-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in:
   ```env
   # Backend API
   EXPORT_API_URL=http://localhost:4000

   # Email Configuration
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password

   # Auth0 Configuration
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=your-32-character-secret
   AUTH0_BASE_URL=http://localhost:3000
   APP_BASE_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t patrik-products-ui .

# Run container
docker run -p 3000:3000 --env-file .env patrik-products-ui
```

## Project Structure

```
patrik-products-ui/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (protected)/          # Auth-protected routes
│   │   │   ├── product/          # Product browsing & details
│   │   │   └── export/           # Export functionality
│   │   ├── nextapi/              # API route handlers
│   │   ├── contact/              # Contact form page
│   │   ├── layout.js             # Root layout
│   │   └── page.js               # Homepage
│   ├── components/               # React components
│   │   ├── ExportPage.js         # Export UI
│   │   ├── ProductGrid.js        # Product grid/list
│   │   ├── ProductVariants.js    # Variant selector
│   │   ├── Navbar.js             # Navigation
│   │   └── ...                   # Other components
│   └── lib/                      # Utilities
│       └── auth0.js              # Auth0 client
├── public/                       # Static assets
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # Detailed architecture docs
│   ├── API.md                    # API integration docs
│   ├── COMPONENTS.md             # Component documentation
│   └── DEVELOPMENT.md            # Development workflow
├── CLAUDE.md                     # Claude Code guidelines
└── package.json
```

## Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Detailed technical architecture
- **[API.md](./docs/API.md)** - API integration and data structures
- **[COMPONENTS.md](./docs/COMPONENTS.md)** - Component library documentation
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development workflow and best practices
- **[CLAUDE.md](./CLAUDE.md)** - Guidelines for Claude Code

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Styling**: Tailwind CSS v4
- **Authentication**: Auth0 (Next.js SDK)
- **Email**: Nodemailer (Gmail SMTP)
- **Fonts**: Orbitron, Montserrat (Google Fonts)
- **Image Optimization**: Next.js Image component
- **State Management**: React hooks (useState, useMemo, useCallback)
- **Deployment**: Docker, Standalone build

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint code quality checks |

## Key Concepts

### Route Groups
The `(protected)` folder is a Next.js route group that doesn't affect URLs but allows shared layouts. All routes inside inherit the protected layout which enforces Auth0 authentication.

### Server vs Client Components
- **Server Components** (default): Pages that fetch data server-side
- **Client Components** (`"use client"`): Interactive components with state

### Data Flow
1. Server Components fetch from backend API
2. Data passed as props to Client Components
3. Client Components manage UI state (selection, filters, etc.)
4. State persisted to localStorage where appropriate

### Export Presets
- **Shopify**: CSV format for Shopify product imports
- **Simple**: Basic product information for simple integrations
- **Detailed**: Complete product data including descriptions and metadata
- **Inventory**: Focus on stock levels and pricing data

## Development Guidelines

### Code Style
- Use functional components with hooks
- Prefer `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Server Components for data fetching
- Client Components for interactivity

### State Management
- Use `useState` for component state
- Use `useMemo` for derived state
- Use `useCallback` for memoized callbacks
- Use `useEffect` for side effects
- Persist selections to localStorage

### Styling
- Use Tailwind utility classes
- Follow dark theme with cyan accents
- Maintain responsive design patterns
- Use custom animations sparingly

## Troubleshooting

### Authentication Issues
- Verify Auth0 credentials in `.env`
- Check callback URLs in Auth0 dashboard
- Ensure `AUTH0_BASE_URL` matches your domain

### API Connection Errors
- Verify backend API is running
- Check `EXPORT_API_URL` in `.env`
- Ensure CORS is configured on backend

### Email Not Sending
- Verify Gmail credentials
- Enable 2FA and use App Password (not account password)
- Check Gmail security settings

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - Patrik International

## Support

For issues or questions, contact:
- Email: info@patrikinternational.com
- Website: https://www.patrikinternational.com
