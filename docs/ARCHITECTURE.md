# Architecture Documentation

This document provides detailed technical architecture information for the Patrik Products UI application.

## Table of Contents
1. [Application Architecture](#application-architecture)
2. [Authentication Flow](#authentication-flow)
3. [Routing Strategy](#routing-strategy)
4. [Data Flow Patterns](#data-flow-patterns)
5. [State Management](#state-management)
6. [Styling Architecture](#styling-architecture)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)

---

## Application Architecture

### Technology Stack

```
┌─────────────────────────────────────────┐
│         Next.js 16 App Router           │
├─────────────────────────────────────────┤
│  React 19 (Server & Client Components)  │
├─────────────────────────────────────────┤
│     Tailwind CSS v4 (Styling Layer)     │
├─────────────────────────────────────────┤
│   Auth0 (Authentication & Sessions)     │
└─────────────────────────────────────────┘
```

### Application Layers

```
┌──────────────────────────────────────────────┐
│         Presentation Layer                   │
│  - React Components (Client & Server)       │
│  - Tailwind CSS Styling                     │
│  - Navigation (Navbar)                      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Business Logic Layer                 │
│  - Product filtering & selection            │
│  - Export configuration & CSV generation    │
│  - Form validation                          │
│  - Price calculations                       │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Data Access Layer                    │
│  - API fetch utilities                      │
│  - Auth0 session management                 │
│  - localStorage persistence                 │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         External Services                    │
│  - Backend API (Product data)               │
│  - Auth0 (Authentication)                   │
│  - Gmail SMTP (Email)                       │
└──────────────────────────────────────────────┘
```

---

## Authentication Flow

### Auth0 Integration

**Library**: `@auth0/nextjs-auth0`

**Configuration** (`src/lib/auth0.js`):
```javascript
import { Auth0Client } from '@auth0/nextjs-auth0/server';
export const auth0 = new Auth0Client();
```

### Authentication Sequence

```
User                    Application              Auth0
  |                          |                     |
  |-- Click Login ---------> |                     |
  |                          |-- Redirect -------->|
  |                          |                     |
  |<------------------- Auth0 Login Screen --------|
  |                          |                     |
  |-- Enter Credentials ---->|                     |
  |                          |                     |
  |<------------------- Callback URL --------------|
  |                          |                     |
  |                          |-- Verify Token ---->|
  |                          |<---- User Info -----|
  |                          |                     |
  |<---- Set Session --------|                     |
  |                          |                     |
  |<---- Redirect to App ----|                     |
```

### Route Protection

**Protected Layout** (`src/app/(protected)/product/layout.js`):
```javascript
export default auth0.withPageAuthRequired(
  async function Layout({ children }) {
    return <div className="flex-1">{children}</div>;
  },
  { returnTo: "/product" }
);
```

**Server Component Auth Check**:
```javascript
import { auth0 } from "@/lib/auth0";

const session = await auth0.getSession();
const user = session?.user;

if (!user) {
  redirect("/auth/login");
}
```

**Client Component Auth Check**:
```javascript
import { useUser } from "@auth0/nextjs-auth0/client";

const { user, isLoading, error } = useUser();

if (isLoading) return <div>Loading...</div>;
if (!user) return <div>Please log in</div>;
```

### Auth0 Routes (Automatic)

| Route | Purpose |
|-------|---------|
| `/auth/login` | Initiates Auth0 login flow |
| `/auth/logout` | Logs out user and redirects |
| `/auth/callback` | Handles Auth0 callback |
| `/auth/me` | Returns current user session |

---

## Routing Strategy

### App Router Structure

```
app/
├── layout.js                    # Root layout (all pages)
├── page.js                      # Public homepage
├── contact/
│   └── page.js                  # Public contact page
├── (protected)/                 # Route group (doesn't affect URL)
│   ├── product/
│   │   ├── layout.js            # Protected layout
│   │   ├── page.js              # /product
│   │   ├── loading.js           # Loading UI for /product
│   │   └── [token]/
│   │       └── page.js          # /product/:token
│   └── export/
│       ├── page.js              # /export
│       └── loading.js           # Loading UI for /export
└── nextapi/
    └── contact/
        └── route.js             # POST /nextapi/contact
```

### Route Groups Explained

The `(protected)` folder is a **route group**:
- Parentheses indicate it doesn't affect the URL structure
- Allows shared layouts without changing routes
- `/product` is still `/product`, not `/(protected)/product`

**Benefits**:
- Shared authentication logic
- Consistent layout for protected pages
- Easy to identify protected routes

### Loading States

**Skeleton Loaders** (`loading.js` files):
```javascript
// src/app/(protected)/product/loading.js
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-neutral-800 h-64 rounded-xl"></div>
          <div className="bg-neutral-800 h-4 mt-4 rounded"></div>
        </div>
      ))}
    </div>
  );
}
```

Automatically shown while page data is loading.

---

## Data Flow Patterns

### Server-Side Data Fetching

**Pattern**: Fetch data in Server Components, pass to Client Components

```javascript
// Server Component (page.js)
async function getProducts() {
  const res = await fetch(`${process.env.EXPORT_API_URL}/product`, {
    cache: "no-store", // Always fetch fresh data
  });
  const data = await res.json();
  return data.data || [];
}

export default async function ProductPage() {
  const products = await getProducts();
  return <ProductGrid initialProducts={products} />;
}
```

**Why `cache: "no-store"`?**
- Product data changes frequently (stock, prices)
- Partners need real-time information
- Prevents stale data issues

### Client-Side State Management

```javascript
// Client Component (ProductGrid.js)
"use client";

export default function ProductGrid({ initialProducts }) {
  const [products] = useState(initialProducts);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Products from server (read-only)
  // Selection state managed client-side
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│  Backend API (External)                     │
│  - Products with variants                   │
│  - Pricelists, stock, images                │
└─────────────────────────────────────────────┘
                    ↓
                fetch()
                    ↓
┌─────────────────────────────────────────────┐
│  Server Component (Page)                    │
│  - Fetches data                             │
│  - Checks authentication                    │
│  - Passes data as props                     │
└─────────────────────────────────────────────┘
                    ↓
            initialProducts prop
                    ↓
┌─────────────────────────────────────────────┐
│  Client Component                           │
│  - Manages UI state                         │
│  - Handles user interactions                │
│  - Persists to localStorage                 │
└─────────────────────────────────────────────┘
                    ↓
            User interactions
                    ↓
┌─────────────────────────────────────────────┐
│  Browser Storage                            │
│  - localStorage for selections              │
│  - Session storage for Auth0               │
└─────────────────────────────────────────────┘
```

---

## State Management

### State Architecture

This application uses **React Hooks** for state management (no Redux/Context needed).

### State Types

#### 1. Server State (Read-only)
- Product data from API
- User session from Auth0
- Export configurations from API

**Pattern**:
```javascript
const [products] = useState(initialProducts); // No setter needed
```

#### 2. UI State (Ephemeral)
- Current view (grid/list)
- Open/closed modals
- Active tabs
- Loading states

**Pattern**:
```javascript
const [view, setView] = useState("grid");
const [isModalOpen, setIsModalOpen] = useState(false);
```

#### 3. Persisted State (localStorage)
- Selected products
- User preferences
- Export configurations

**Pattern**:
```javascript
// Load on mount
useEffect(() => {
  const saved = localStorage.getItem("selectedProductTokens");
  if (saved) setSelectedProducts(JSON.parse(saved));
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem("selectedProductTokens", JSON.stringify(selectedProducts));
}, [selectedProducts]);
```

#### 4. Derived State (Computed)
- Filtered products
- Minimum prices
- CSV data

**Pattern**:
```javascript
const filteredProducts = useMemo(() => {
  return products.filter(p => {
    // Apply filters
  });
}, [products, filters]);
```

### Performance Optimizations

#### useMemo
Prevents expensive recalculations:

```javascript
const minPrice = useMemo(() => {
  const allPrices = product.child_products
    .flatMap(child => child.pricelist?.map(p => p.price) || [])
    .filter(price => typeof price === "number");
  return allPrices.length ? Math.min(...allPrices) : "N/A";
}, [product.child_products]);
```

**When to use**:
- Expensive calculations
- Filtering/mapping large arrays
- Complex transformations

#### useCallback
Prevents unnecessary re-renders:

```javascript
const getPriceFromPriority = useCallback((variant) => {
  const enabledPricelists = pricelistPriority
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);
  // ... price logic
}, [pricelistPriority]);
```

**When to use**:
- Functions passed to child components
- Functions used in dependencies of other hooks
- Event handlers in optimized components

---

## Styling Architecture

### Tailwind CSS v4 Configuration

**PostCSS Setup** (`postcss.config.mjs`):
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Design System

#### Color Palette
```css
--color-primary: #01a0be;        /* Cyan - buttons, links */
--color-primary-dark: #018a9f;   /* Darker cyan - hovers */
--color-background: #000000;     /* Black background */
--color-surface: #171717;        /* Neutral-900 */
--color-border: #404040;         /* Neutral-700 */
--color-text: #d4d4d4;           /* Neutral-300 */
--color-text-muted: #737373;     /* Neutral-500 */
```

#### Typography
```css
/* Headings */
font-family: var(--font-orbitron), sans-serif;
font-weight: 700;

/* Body */
font-family: var(--font-montserrat), sans-serif;
font-weight: 400;
```

#### Spacing Scale
```
xs:  4px   (0.5)
sm:  8px   (1)
md:  16px  (2)
lg:  24px  (3)
xl:  32px  (4)
2xl: 48px  (6)
3xl: 64px  (8)
```

#### Border Radius
```
rounded-md:  6px
rounded-lg:  8px
rounded-xl:  12px
rounded-2xl: 16px
```

### Custom Animations

**Blob Animations** (Background effect):
```css
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -50px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(50px, 50px) scale(1.05); }
}

.animate-blob {
  animation: blob 25s ease-in-out infinite;
}
```

**Animation Delays**:
```css
.animation-delay-2s { animation-delay: 2s; }
.animation-delay-4s { animation-delay: 4s; }
.animation-delay-6s { animation-delay: 6s; }
```

### Responsive Breakpoints
```javascript
// Tailwind defaults
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

**Custom useMediaQuery Hook**:
```javascript
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
```

---

## Performance Optimization

### Image Optimization

**Next.js Image Component**:
```javascript
import Image from "next/image";

<Image
  src={imageSrc}
  alt={alt}
  width={400}
  height={300}
  className="object-cover"
  loading="lazy"  // Automatic
  quality={75}    // Default
/>
```

**Remote Image Domains** (`next.config.mjs`):
```javascript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "imgs.pnvnet.si" },
    { protocol: "https", hostname: "www.patrikinternational.com" },
    { protocol: "https", hostname: "s.gravatar.com" },
    { protocol: "https", hostname: "lh3.googleusercontent.com" },
  ],
}
```

### Code Splitting

**Automatic Code Splitting**:
- Each route automatically code-split
- Components imported normally
- No manual splitting needed

**Dynamic Imports** (if needed):
```javascript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only
});
```

### Data Fetching Strategies

```javascript
// Always fresh (product data)
fetch(url, { cache: "no-store" });

// Cache for 60 seconds
fetch(url, { next: { revalidate: 60 } });

// Cache indefinitely (static assets)
fetch(url, { cache: "force-cache" });
```

### Memoization Strategy

**Decision Tree**:
```
Is it an expensive calculation?
├── Yes → Use useMemo
└── No → Use regular variable

Is it a function passed to children?
├── Yes → Use useCallback
└── No → Use regular function

Does it depend on props/state?
├── Yes → Add to dependency array
└── No → Empty dependency array
```

---

## Security Considerations

### Environment Variables

**Never commit secrets to git**:
```env
# ❌ BAD - Contains secrets
.env

# ✅ GOOD - Template only
.env.example
```

**Current .env status**: Contains secrets (should be gitignored)

### Authentication Security

**Session Management**:
- Sessions encrypted with `AUTH0_SECRET`
- HTTPOnly cookies (not accessible via JavaScript)
- Secure flag in production
- SameSite=Lax protection

**CSRF Protection**:
- Auth0 SDK handles CSRF tokens automatically
- State parameter in OAuth flow

### API Security

**CORS Configuration** (Backend responsibility):
```javascript
// Backend should restrict to known origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://partners.patrikinternational.com"
];
```

**No Sensitive Data in Client**:
- API keys stay server-side
- Auth tokens managed by Auth0 SDK
- No credentials in client code

### Input Validation

**Contact Form**:
```javascript
if (!name || !email || !message) {
  return NextResponse.json(
    { error: "Missing required fields" },
    { status: 400 }
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return NextResponse.json(
    { error: "Invalid email format" },
    { status: 400 }
  );
}
```

### XSS Protection

**React Automatic Escaping**:
```javascript
// ✅ Safe - React escapes by default
<div>{userInput}</div>

// ❌ Dangerous - Allows HTML injection
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**HTML Stripping for CSV Export**:
```javascript
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")       // Remove tags
    .replace(/&nbsp;/g, " ")       // Replace entities
    .replace(/&amp;/g, "&")
    .trim();
}
```

### Content Security Policy

**Recommended Headers** (add to `next.config.mjs`):
```javascript
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ];
}
```

---

## Build & Deployment

### Production Build

**Standalone Output** (`next.config.mjs`):
```javascript
output: "standalone"
```

Creates self-contained `.next/standalone` directory with:
- All necessary dependencies
- Optimized production build
- Ready for Docker deployment

### Docker Architecture

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Benefits**:
- Multi-stage builds (smaller image)
- Alpine Linux (minimal size)
- Production-only dependencies
- Fast startup time

---

## Monitoring & Debugging

### Error Boundaries

**Recommended Addition**:
```javascript
// src/components/ErrorBoundary.js
"use client";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

### Logging Strategy

**Development**:
```javascript
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

**Production** (recommended):
- Use structured logging library (Winston, Pino)
- Send errors to monitoring service (Sentry, LogRocket)
- Avoid console.logs in production

---

This architecture supports scalability, maintainability, and performance while maintaining security best practices.
