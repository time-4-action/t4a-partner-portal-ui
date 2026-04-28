# Components

> Complete reference for all React components in the application.
>
> **See also:** [Architecture](./ARCHITECTURE.md) | [Design System](./DESIGN_SYSTEM.md)

## Table of Contents

1. [Navigation Components](#navigation-components)
2. [Product Display Components](#product-display-components)
3. [Export Components](#export-components)
4. [Authentication Components](#authentication-components)
5. [Page Components](#page-components)
6. [Utility Hooks](#utility-hooks)
7. [Component Relationships](#component-relationships)

---

## Navigation Components

### Navbar

**File**: `src/components/Navbar.js`
**Type**: Client Component

**Description**: Main navigation bar with responsive design, user authentication status, and profile menu.

**Features**:
- Logo and brand name
- Navigation links (Home, Products, Export, Contact)
- User profile dropdown
- Mobile hamburger menu
- Auth0 integration

**Props**: None

**State**:
```javascript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
```

**Usage**:
```javascript
import Navbar from "@/components/Navbar";

<Navbar />
```

**Styling**:
- Sticky positioning at top
- Backdrop blur effect
- Responsive breakpoints at `md` (768px)
- Cyan accent colors for active states

**Dependencies**:
- `@auth0/nextjs-auth0/client` - `useUser` hook
- `next/link` - Navigation links
- `Profile` component - User profile display

---

## Product Display Components

### ProductGrid

**File**: `src/components/ProductGrid.js`
**Type**: Client Component

**Description**: Displays products in grid or list view with selection capabilities and localStorage persistence.

**Props**:
```typescript
interface ProductGridProps {
  initialProducts: Product[];  // Product data from server
}
```

**State**:
```javascript
const [products] = useState(initialProducts);
const [view, setView] = useState("grid");  // "grid" | "list"
const [selectedProducts, setSelectedProducts] = useState([]);
const [copyStatus, setCopyStatus] = useState("");
```

**Features**:
- Grid/List view toggle
- Product selection with checkboxes
- Select all / Deselect all
- Copy selected tokens to clipboard
- localStorage persistence
- Responsive grid (1, 2, or 3 columns)
- Minimum price calculation
- Variant count display

**Usage**:
```javascript
import ProductGrid from "@/components/ProductGrid";

<ProductGrid initialProducts={products} />
```

**Key Functions**:
```javascript
// Toggle product selection
const toggleProductSelection = (token) => {
  setSelectedProducts(prev =>
    prev.includes(token)
      ? prev.filter(t => t !== token)
      : [...prev, token]
  );
};

// Calculate minimum price
const minPrice = useMemo(() => {
  const allPrices = product.child_products
    .flatMap(child => child.pricelist?.map(p => p.price) || [])
    .filter(price => typeof price === "number");
  return allPrices.length ? Math.min(...allPrices) : "N/A";
}, [product.child_products]);
```

**localStorage Keys**:
- `selectedProductTokens`: Array of selected product tokens

**Responsive Behavior**:
- Mobile (< 640px): Single column
- Tablet (640px - 1024px): Two columns
- Desktop (> 1024px): Three columns

---

### ProductVariants

**File**: `src/components/ProductVariants.js`
**Type**: Client Component

**Description**: Displays product details with variant selection, pricing, stock, and images.

**Props**:
```typescript
interface ProductVariantsProps {
  product: Product;  // Product with variants
}
```

**State**:
```javascript
const [selectedVariant, setSelectedVariant] = useState(0);  // Index of selected variant
```

**Features**:
- Variant dropdown selector
- Price display with VAT
- Stock status indicator
- SKU and EAN display
- Multiple image sources (variant images + parent images)
- Image gallery integration
- Responsive layout

**Usage**:
```javascript
import ProductVariants from "@/components/ProductVariants";

<ProductVariants product={product} />
```

**Price Calculation**:
```javascript
const price = useMemo(() => {
  const variant = product.child_products?.[selectedVariant];
  const priceEntry = variant?.pricelist?.[0];
  if (!priceEntry?.price) return null;

  const basePrice = priceEntry.price;
  const vat = priceEntry.vat || 0;
  const totalPrice = basePrice * (1 + vat / 100);

  return {
    base: basePrice.toFixed(2),
    vat: vat,
    total: totalPrice.toFixed(2),
  };
}, [product, selectedVariant]);
```

**Image Priority**:
1. Variant-specific images
2. Parent product images
3. Placeholder image

**Stock Display**:
- Green badge: In Stock (> 0)
- Red badge: Out of Stock (= 0)

---

### ProductImageGallery

**File**: `src/components/ProductImageGallery.js`
**Type**: Client Component

**Description**: Image carousel with navigation arrows and dot indicators.

**Props**:
```typescript
interface ProductImageGalleryProps {
  images: string[];  // Array of image URLs
  alt: string;       // Alt text for images
}
```

**State**:
```javascript
const [currentIndex, setCurrentIndex] = useState(0);
```

**Features**:
- Previous/Next navigation
- Dot indicators for image count
- Click to jump to specific image
- Auto-reset when images change
- Responsive image sizing
- Placeholder support

**Usage**:
```javascript
import ProductImageGallery from "@/components/ProductImageGallery";

<ProductImageGallery
  images={productImages}
  alt="Product Name"
/>
```

**Navigation**:
```javascript
const goToPrevious = () => {
  setCurrentIndex((prevIndex) =>
    prevIndex === 0 ? images.length - 1 : prevIndex - 1
  );
};

const goToNext = () => {
  setCurrentIndex((prevIndex) =>
    prevIndex === images.length - 1 ? 0 : prevIndex + 1
  );
};

const goToSlide = (index) => {
  setCurrentIndex(index);
};
```

**Reset Behavior**:
```javascript
useEffect(() => {
  setCurrentIndex(0);
}, [images]);
```

---

## Export Components

### ExportPage

**File**: `src/components/ExportPage.js`
**Type**: Client Component

**Description**: Comprehensive CSV export builder with presets, filtering, field selection, and save functionality.

**Props**:
```typescript
interface ExportPageProps {
  initialProducts: Product[];  // All products from API
}
```

**State**:
```javascript
const [selectedPreset, setSelectedPreset] = useState("shopify");
const [selectedFields, setSelectedFields] = useState([...defaultFields]);
const [filters, setFilters] = useState({
  search: "",
  stockStatus: "all",
  minPrice: "",
  maxPrice: "",
  category: "all",
  aiExportId: "all",
  aiCategory: "all",
  showNew: false,
  showRecommended: false,
  publishedOnly: false,
});
const [pricelistPriority, setPricelistPriority] = useState([]);
const [savedExports, setSavedExports] = useState([]);
const [activeTab, setActiveTab] = useState("configure");
const [showSaveModal, setShowSaveModal] = useState(false);
const [saveName, setSaveName] = useState("");
const [saveDescription, setSaveDescription] = useState("");
```

**Features**:
- **4 Export Presets**: Shopify, Simple, Detailed, Inventory
- **Field Selection**: Checkbox selection of CSV columns
- **Advanced Filtering**:
  - Text search (name, code, SKU, EAN)
  - Stock status (all, in stock, out of stock)
  - Price range (min/max)
  - Categories
  - AI export categories
  - Product flags (new, recommended, published)
- **Pricelist Priority**: Drag-drop ordering
- **Live Preview**: First 10 rows of CSV
- **Save/Load**: Store configurations to backend
- **Direct Download**: Generate and download CSV

**Export Presets**:

#### Shopify Preset
```javascript
{
  name: "shopify",
  description: "Shopify CSV import format",
  fields: [
    "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags",
    "Published", "Option1 Name", "Option1 Value", "Variant SKU",
    "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
    "Variant Inventory Policy", "Variant Fulfillment Service",
    "Variant Price", "Variant Compare At Price", "Variant Requires Shipping",
    "Variant Taxable", "Variant Barcode", "Image Src", "Image Position",
    "Image Alt Text", "Gift Card", "SEO Title", "SEO Description",
    "Google Shopping / Google Product Category", "Variant Image",
    "Variant Weight Unit", "Variant Tax Code", "Cost per item", "Status"
  ]
}
```

#### Simple Preset
```javascript
{
  name: "simple",
  description: "Basic product information",
  fields: [
    "Product Name", "SKU", "EAN", "Price", "Stock", "Category"
  ]
}
```

#### Detailed Preset
```javascript
{
  name: "detailed",
  description: "Complete product data",
  fields: [
    "Product Code", "Product Name", "Variant Name", "SKU", "EAN",
    "Short Description", "Detailed Description", "Categories",
    "Price", "VAT", "Stock", "Images", "New", "Recommended",
    "Published", "AI Categories"
  ]
}
```

#### Inventory Preset
```javascript
{
  name: "inventory",
  description: "Stock and pricing focus",
  fields: [
    "SKU", "Product Name", "Stock Amount", "Price", "Pricelist Name"
  ]
}
```

**Filtering Logic**:
```javascript
const filteredProducts = useMemo(() => {
  return initialProducts.filter(product => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        product.product_name?.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.child_products?.some(v =>
          v.code?.toLowerCase().includes(searchLower) ||
          v.ean_code?.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }

    // Stock status filter
    if (filters.stockStatus !== "all") {
      const hasStock = product.child_products?.some(v => v.stock_amount > 0);
      if (filters.stockStatus === "in_stock" && !hasStock) return false;
      if (filters.stockStatus === "out_of_stock" && hasStock) return false;
    }

    // Price filter
    const price = getPriceFromPriority(product.child_products?.[0]);
    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;

    // Category filter
    if (filters.category !== "all" && !product.categories?.includes(filters.category)) {
      return false;
    }

    // Flags
    if (filters.showNew && !product.new) return false;
    if (filters.showRecommended && !product.recomended) return false;
    // publishedOnly is applied as a pre-pass (see note below), so no check here.

    return true;
  });
}, [initialProducts, filters, getPriceFromPriority]);

// publishedOnly cascades into variants: before the filter runs, unpublished
// parents are dropped and each surviving parent's child_products is narrowed
// to only published variants. Downstream row generation then naturally emits
// no rows for unpublished variants.
```

**CSV Generation**:
```javascript
const generateCSVData = useCallback(() => {
  const rows = [];

  // Add header row
  rows.push(selectedFields.join(","));

  // Add data rows
  filteredProducts.forEach(product => {
    product.child_products?.forEach((variant, idx) => {
      const row = selectedFields.map(field => {
        const value = getFieldValue(product, variant, field, idx === 0);
        return escapeCSV(value);
      });
      rows.push(row.join(","));
    });
  });

  return rows.join("\n");
}, [selectedPreset, selectedFields, filteredProducts, getPriceFromPriority]);
```

**Drag & Drop**:
```javascript
const handleDragStart = (e, index) => {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", index);
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

const handleDrop = (e, dropIndex) => {
  e.preventDefault();
  const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

  const newPriority = [...pricelistPriority];
  const [draggedItem] = newPriority.splice(dragIndex, 1);
  newPriority.splice(dropIndex, 0, draggedItem);

  // Update priority numbers
  const updated = newPriority.map((item, idx) => ({
    ...item,
    priority: idx + 1,
  }));

  setPricelistPriority(updated);
};
```

**Save Configuration**:
```javascript
const handleSaveExport = async () => {
  try {
    const response = await fetch(`${API_URL}/custom-export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveName,
        description: saveDescription,
        preset: selectedPreset,
        selectedFields,
        filters,
        pricelistPriority,
      }),
    });

    const data = await response.json();
    setSavedExports([...savedExports, data.data]);
    setShowSaveModal(false);
  } catch (error) {
    console.error("Failed to save export:", error);
  }
};
```

**Download CSV**:
```javascript
const handleDownload = () => {
  const csvContent = generateCSVData();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `export-${Date.now()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

**Utility Functions**:
```javascript
// Strip HTML tags
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

// Escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
```

---

## Authentication Components

### LoginButton

**File**: `src/components/LoginButton.js`
**Type**: Client Component

**Description**: Simple button that redirects to Auth0 login.

**Props**: None

**Usage**:
```javascript
import LoginButton from "@/components/LoginButton";

<LoginButton />
```

**Implementation**:
```javascript
export default function LoginButton() {
  return (
    <a
      href="/auth/login"
      className="px-6 py-2 bg-[#01a0be] text-white rounded-lg hover:bg-[#018a9f]"
    >
      Log In
    </a>
  );
}
```

---

### LogoutButton

**File**: `src/components/LogoutButton.js`
**Type**: Client Component

**Description**: Simple button that redirects to Auth0 logout.

**Props**: None

**Usage**:
```javascript
import LogoutButton from "@/components/LogoutButton";

<LogoutButton />
```

**Implementation**:
```javascript
export default function LogoutButton() {
  return (
    <a
      href="/auth/logout"
      className="px-4 py-2 text-neutral-300 hover:text-white"
    >
      Log Out
    </a>
  );
}
```

---

### Profile

**File**: `src/components/Profile.js`
**Type**: Client Component

**Description**: Displays user profile information with avatar, name, and email.

**Props**:
```typescript
interface ProfileProps {
  user: {
    name?: string;
    email?: string;
    picture?: string;
  };
}
```

**Features**:
- User avatar (from Auth0 or fallback SVG)
- Display name
- Email address
- Image error handling
- Responsive layout

**Usage**:
```javascript
import Profile from "@/components/Profile";
import { useUser } from "@auth0/nextjs-auth0/client";

const { user } = useUser();

<Profile user={user} />
```

**Avatar Fallback**:
```javascript
const [imageError, setImageError] = useState(false);

const handleImageError = () => {
  setImageError(true);
};

{user.picture && !imageError ? (
  <Image
    src={user.picture}
    alt={user.name || "User"}
    width={40}
    height={40}
    className="rounded-full"
    onError={handleImageError}
  />
) : (
  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
    <svg>...</svg>
  </div>
)}
```

---

## Page Components

### Homepage

**File**: `src/app/page.js`
**Type**: Server Component

**Description**: Dual-view homepage showing login prompt for non-authenticated users and catalog access for authenticated users.

**Features**:
- Auth0 session check
- Conditional rendering
- Hero section with animated blobs
- Call-to-action buttons

**Implementation**:
```javascript
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div>
      {user ? (
        // Authenticated view
        <div>
          <h1>Welcome, {user.name}!</h1>
          <Link href="/product">Browse Catalog</Link>
        </div>
      ) : (
        // Guest view
        <div>
          <h1>Partner Portal</h1>
          <a href="/auth/login">Sign In</a>
        </div>
      )}
    </div>
  );
}
```

---

### Contact Page

**File**: `src/app/contact/page.js`
**Type**: Client Component

**Description**: Contact form for submitting inquiries.

**State**:
```javascript
const [formData, setFormData] = useState({
  name: "",
  company: "",
  email: "",
  message: "",
});
const [status, setStatus] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Features**:
- Form validation
- Email submission via API
- Success/error messages
- Loading state
- Auto-reset on success

**Form Submission**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setStatus("");

  try {
    const response = await fetch("/nextapi/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      setStatus("success");
      setFormData({ name: "", company: "", email: "", message: "" });
    } else {
      setStatus("error");
    }
  } catch (error) {
    setStatus("error");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Product Page

**File**: `src/app/(protected)/product/page.js`
**Type**: Server Component

**Description**: Product catalog page with grid/list view.

**Features**:
- Auth protection via layout
- Server-side data fetching
- Renders ProductGrid component

**Implementation**:
```javascript
async function getProducts() {
  const res = await fetch(`${process.env.EXPORT_API_URL}/product`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.data || [];
}

export default async function ProductPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Product Catalog</h1>
      <ProductGrid initialProducts={products} />
    </div>
  );
}
```

---

### Product Detail Page

**File**: `src/app/(protected)/product/[token]/page.js`
**Type**: Server Component

**Description**: Individual product detail page with variants.

**Features**:
- Dynamic route with product token
- Server-side product fetch
- Renders ProductVariants component
- 404 handling for invalid tokens

**Implementation**:
```javascript
async function getProduct(token) {
  const res = await fetch(`${process.env.EXPORT_API_URL}/product/${token}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.data;
}

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.token);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductVariants product={product} />
    </div>
  );
}
```

---

### Export Page

**File**: `src/app/(protected)/export/page.js`
**Type**: Server Component

**Description**: CSV export configuration page.

**Features**:
- Auth protection
- Server-side product fetch
- Renders ExportPage component

**Implementation**:
```javascript
async function getProducts() {
  const res = await fetch(`${process.env.EXPORT_API_URL}/product`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.data || [];
}

export default async function ExportConfigPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Export Products</h1>
      <ExportPage initialProducts={products} />
    </div>
  );
}
```

---

## Utility Hooks

### useMediaQuery

**Location**: Used in `ProductGrid.js`

**Description**: Custom hook to detect responsive breakpoints.

**Usage**:
```javascript
const isMobile = useMediaQuery("(max-width: 640px)");
```

**Implementation**:
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

**Common Queries**:
```javascript
// Mobile
useMediaQuery("(max-width: 640px)")

// Tablet
useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

// Desktop
useMediaQuery("(min-width: 1025px)")

// Dark mode preference
useMediaQuery("(prefers-color-scheme: dark)")
```

---

## Component Relationships

```
App
├── layout.js (Root Layout)
│   └── Navbar
│       ├── LoginButton / LogoutButton
│       └── Profile
├── page.js (Homepage)
├── contact/page.js (Contact Form)
└── (protected)/
    ├── product/
    │   ├── layout.js (Auth-protected layout)
    │   ├── page.js
    │   │   └── ProductGrid
    │   └── [token]/page.js
    │       └── ProductVariants
    │           └── ProductImageGallery
    └── export/page.js
        └── ExportPage
```

---

## Best Practices

### Component Design
- Use functional components with hooks
- Separate concerns (Server vs Client)
- Keep components focused and single-purpose
- Extract reusable logic to custom hooks

### Performance
- Use `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Avoid unnecessary re-renders
- Lazy load heavy components

### State Management
- Keep state as local as possible
- Use server components for data fetching
- Persist important state to localStorage
- Avoid prop drilling (consider Context if needed)

### Styling
- Use Tailwind utility classes
- Follow design system colors and spacing
- Maintain responsive design
- Use semantic class names when needed

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

---

---

<div align="center">

[Back to Documentation Index](./README.md)

</div>
