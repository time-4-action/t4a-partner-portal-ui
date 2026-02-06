# API Documentation

This document details all API integrations, endpoints, request/response formats, and data structures used in the Patrik Products UI application.

## Table of Contents
1. [Backend API Integration](#backend-api-integration)
2. [Internal API Routes](#internal-api-routes)
3. [Auth0 API Routes](#auth0-api-routes)
4. [Data Structures](#data-structures)
5. [Error Handling](#error-handling)

---

## Backend API Integration

The application integrates with an external backend API for product data and export configurations.

### Configuration

**Environment Variable**: `EXPORT_API_URL`
- Development: `http://localhost:4000`
- Production: Set in deployment environment

**Base URL Usage**:
```javascript
const API_URL = process.env.EXPORT_API_URL;
```

---

### Product Endpoints

#### Get All Products

**Endpoint**: `GET /product`

**Description**: Fetches all products with variants, pricelists, images, and stock information.

**Request**:
```javascript
const response = await fetch(`${process.env.EXPORT_API_URL}/product`, {
  cache: "no-store", // Always fetch fresh data
});
```

**Response**:
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "token": "unique-product-token-123",
      "code": "PROD-001",
      "product_name": "Example Product",
      "short_description": "<p>Short HTML description</p>",
      "detailed_description": "<p>Detailed HTML description</p>",
      "images": [
        "https://imgs.pnvnet.si/image1.jpg",
        "https://imgs.pnvnet.si/image2.jpg"
      ],
      "categories": ["Electronics", "Gadgets"],
      "new": true,
      "recomended": false,
      "published": true,
      "active": true,
      "ai_categories": [
        {
          "exportId": "export-123",
          "categoryId": "cat-456",
          "categoryName": "Smart Devices"
        }
      ],
      "child_products": [
        {
          "token": "variant-token-456",
          "code": "SKU-001-RED",
          "product_name": "Example Product - Red",
          "ean_code": "1234567890123",
          "stock_amount": 100,
          "images": ["https://imgs.pnvnet.si/variant1.jpg"],
          "pricelist": [
            {
              "name": "Standard Price",
              "price": 99.99,
              "vat": 22,
              "valid_from": "2024-01-01T00:00:00.000Z"
            },
            {
              "name": "Partner Price",
              "price": 79.99,
              "vat": 22,
              "valid_from": "2024-01-01T00:00:00.000Z"
            }
          ]
        }
      ]
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: Server error

**Used In**:
- `src/app/(protected)/product/page.js` - Product grid
- `src/app/(protected)/export/page.js` - Export functionality

---

#### Get Single Product

**Endpoint**: `GET /product/:token`

**Description**: Fetches detailed information for a single product by its token.

**Request**:
```javascript
const response = await fetch(
  `${process.env.EXPORT_API_URL}/product/${token}`,
  { cache: "no-store" }
);
```

**URL Parameters**:
- `token` (string, required): Unique product identifier

**Response**:
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "token": "unique-product-token-123",
    "code": "PROD-001",
    "product_name": "Example Product",
    "short_description": "<p>Short description</p>",
    "detailed_description": "<p>Detailed description</p>",
    "images": ["https://imgs.pnvnet.si/image1.jpg"],
    "categories": ["Electronics"],
    "new": true,
    "recomended": false,
    "published": true,
    "active": true,
    "child_products": [
      {
        "token": "variant-token-456",
        "code": "SKU-001-RED",
        "product_name": "Example Product - Red",
        "ean_code": "1234567890123",
        "stock_amount": 100,
        "images": ["https://imgs.pnvnet.si/variant1.jpg"],
        "pricelist": [
          {
            "name": "Standard Price",
            "price": 99.99,
            "vat": 22,
            "valid_from": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Product not found
- `500 Internal Server Error`: Server error

**Used In**:
- `src/app/(protected)/product/[token]/page.js` - Product detail page

---

### Export Configuration Endpoints

#### Get All Export Configurations

**Endpoint**: `GET /custom-export`

**Description**: Fetches all saved export configurations for the current user.

**Request**:
```javascript
const response = await fetch(`${API_URL}/custom-export`);
```

**Response**:
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Shopify Export",
      "description": "Custom Shopify export with specific fields",
      "preset": "shopify",
      "selectedFields": [
        "Handle",
        "Title",
        "Body (HTML)",
        "Vendor",
        "Type",
        "Tags"
      ],
      "filters": {
        "search": "",
        "stockStatus": "all",
        "minPrice": "",
        "maxPrice": "",
        "category": "all",
        "aiExportId": "all",
        "aiCategory": "all",
        "showNew": false,
        "showRecommended": false,
        "publishedOnly": true
      },
      "pricelistPriority": [
        {
          "name": "Partner Price",
          "validFrom": "2024-01-01T00:00:00.000Z",
          "enabled": true,
          "priority": 1
        },
        {
          "name": "Standard Price",
          "validFrom": "2024-01-01T00:00:00.000Z",
          "enabled": true,
          "priority": 2
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: Server error

**Used In**:
- `src/components/ExportPage.js` - Load saved exports

---

#### Create Export Configuration

**Endpoint**: `POST /custom-export`

**Description**: Saves a new export configuration.

**Request**:
```javascript
const response = await fetch(`${API_URL}/custom-export`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "My Custom Export",
    description: "Description of the export",
    preset: "shopify",
    selectedFields: ["Handle", "Title", "Body (HTML)"],
    filters: {
      search: "",
      stockStatus: "all",
      minPrice: "",
      maxPrice: "",
      category: "all",
      aiExportId: "all",
      aiCategory: "all",
      showNew: false,
      showRecommended: false,
      publishedOnly: true
    },
    pricelistPriority: [
      {
        name: "Partner Price",
        validFrom: "2024-01-01T00:00:00.000Z",
        enabled: true,
        priority: 1
      }
    ]
  }),
});
```

**Request Body**:
```typescript
{
  name: string;                    // Required
  description: string;             // Required
  preset: "shopify" | "simple" | "detailed" | "inventory";
  selectedFields: string[];        // Array of field names
  filters: {
    search: string;
    stockStatus: "all" | "in_stock" | "out_of_stock";
    minPrice: string;
    maxPrice: string;
    category: string;
    aiExportId: string;
    aiCategory: string;
    showNew: boolean;
    showRecommended: boolean;
    publishedOnly: boolean;
  };
  pricelistPriority: Array<{
    name: string;
    validFrom: string;
    enabled: boolean;
    priority: number;
  }>;
}
```

**Response**:
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Custom Export",
    "description": "Description of the export",
    "preset": "shopify",
    "selectedFields": ["Handle", "Title", "Body (HTML)"],
    "filters": { /* ... */ },
    "pricelistPriority": [ /* ... */ ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes**:
- `201 Created`: Success
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Server error

**Used In**:
- `src/components/ExportPage.js` - Save export configuration

---

#### Delete Export Configuration

**Endpoint**: `DELETE /custom-export/:id`

**Description**: Deletes a saved export configuration.

**Request**:
```javascript
const response = await fetch(`${API_URL}/custom-export/${id}`, {
  method: "DELETE",
});
```

**URL Parameters**:
- `id` (string, required): Export configuration ID

**Response**:
```json
{
  "message": "Export configuration deleted successfully"
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Configuration not found
- `500 Internal Server Error`: Server error

**Used In**:
- `src/components/ExportPage.js` - Delete saved export

---

#### Download Export CSV

**Endpoint**: `GET /custom-export/:id/csv`

**Description**: Generates and downloads CSV file for a saved export configuration.

**Request**:
```javascript
window.location.href = `${API_URL}/custom-export/${id}/csv`;
```

**URL Parameters**:
- `id` (string, required): Export configuration ID

**Response**: Binary CSV file download

**Headers**:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export-{timestamp}.csv"
```

**Status Codes**:
- `200 OK`: Success, file download starts
- `404 Not Found`: Configuration not found
- `500 Internal Server Error`: Server error

**Used In**:
- `src/components/ExportPage.js` - Download saved export

---

## Internal API Routes

These are Next.js API routes defined in the application.

### Contact Form

**Endpoint**: `POST /nextapi/contact`

**Description**: Sends contact form email via Gmail SMTP.

**File**: `src/app/nextapi/contact/route.js`

**Request**:
```javascript
const response = await fetch("/nextapi/contact", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Doe",
    company: "Example Corp",
    email: "john@example.com",
    message: "I'm interested in your products..."
  }),
});
```

**Request Body**:
```typescript
{
  name: string;      // Required
  company: string;   // Optional
  email: string;     // Required, validated
  message: string;   // Required
}
```

**Response (Success)**:
```json
{
  "message": "Email sent successfully!"
}
```

**Response (Error)**:
```json
{
  "error": "Missing required fields"
}
// or
{
  "error": "Invalid email format"
}
// or
{
  "error": "Failed to send email"
}
```

**Status Codes**:
- `200 OK`: Email sent successfully
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Email sending failed

**Email Configuration**:
```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
```

**Emails Sent**:
1. **To Company**: Notification with form details
2. **To Submitter**: Confirmation email with copy of message

---

## Auth0 API Routes

These routes are automatically created by the `@auth0/nextjs-auth0` package.

### Login

**Endpoint**: `GET /auth/login`

**Description**: Redirects to Auth0 login page.

**Usage**:
```javascript
<a href="/auth/login">Log In</a>
```

**Behavior**:
- Redirects to Auth0 Universal Login
- Returns to `returnTo` URL after authentication
- Sets session cookie on success

---

### Logout

**Endpoint**: `GET /auth/logout`

**Description**: Logs out user and clears session.

**Usage**:
```javascript
<a href="/auth/logout">Log Out</a>
```

**Behavior**:
- Clears session cookie
- Redirects to Auth0 logout
- Returns to homepage

---

### Callback

**Endpoint**: `GET /auth/callback`

**Description**: Handles Auth0 callback after login.

**Behavior**:
- Exchanges authorization code for tokens
- Creates session
- Redirects to original page or homepage

**Not called directly by application code.**

---

### Get User

**Endpoint**: `GET /auth/me`

**Description**: Returns current user session data.

**Response**:
```json
{
  "user": {
    "sub": "auth0|507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "picture": "https://s.gravatar.com/avatar/...",
    "email_verified": true,
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Used By**:
```javascript
import { useUser } from "@auth0/nextjs-auth0/client";

const { user, isLoading, error } = useUser();
```

---

## Data Structures

### Product Object

```typescript
interface Product {
  _id: string;                    // MongoDB ID
  token: string;                  // Unique product identifier
  code: string;                   // Product code/SKU
  product_name: string;           // Product name
  short_description: string;      // HTML description
  detailed_description: string;   // Detailed HTML description
  images: string[];               // Array of image URLs
  categories: string[];           // Product categories
  new: boolean;                   // Is new product
  recomended: boolean;            // Is recommended
  published: boolean;             // Is published
  active: boolean;                // Is active
  ai_categories: AiCategory[];    // AI categorization
  child_products: Variant[];      // Product variants
}

interface Variant {
  token: string;                  // Unique variant identifier
  code: string;                   // SKU code
  product_name: string;           // Variant name
  ean_code: string;               // EAN barcode
  stock_amount: number;           // Current stock level
  images: string[];               // Variant images
  pricelist: PricelistEntry[];    // Available pricelists
}

interface PricelistEntry {
  name: string;                   // Pricelist name
  price: number;                  // Price value
  vat: number;                    // VAT percentage
  valid_from: string;             // ISO date string
}

interface AiCategory {
  exportId: string;               // Export ID
  categoryId: string;             // Category ID
  categoryName: string;           // Category name
}
```

### Export Configuration Object

```typescript
interface ExportConfiguration {
  _id: string;                    // Configuration ID
  name: string;                   // Configuration name
  description: string;            // Description
  preset: "shopify" | "simple" | "detailed" | "inventory";
  selectedFields: string[];       // Fields to include
  filters: ExportFilters;         // Applied filters
  pricelistPriority: PricelistPriority[];
  createdAt: string;              // ISO date
  updatedAt: string;              // ISO date
}

interface ExportFilters {
  search: string;
  stockStatus: "all" | "in_stock" | "out_of_stock";
  minPrice: string;
  maxPrice: string;
  category: string;
  aiExportId: string;
  aiCategory: string;
  showNew: boolean;
  showRecommended: boolean;
  publishedOnly: boolean;
}

interface PricelistPriority {
  name: string;
  validFrom: string;
  enabled: boolean;
  priority: number;
}
```

---

## Error Handling

### API Error Responses

**Standard Error Format**:
```json
{
  "error": "Error message description"
}
```

**Common Error Codes**:
- `400 Bad Request`: Invalid input, validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Client-Side Error Handling

**Example Pattern**:
```javascript
try {
  const response = await fetch(`${API_URL}/product`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];

} catch (error) {
  console.error("Failed to fetch products:", error);
  return [];
}
```

**Recommended Improvements**:
```javascript
// Add user-facing error messages
const [error, setError] = useState(null);

try {
  // ... fetch logic
} catch (err) {
  setError("Failed to load products. Please try again.");
}

// Display to user
{error && <div className="text-red-500">{error}</div>}
```

---

## Rate Limiting & Caching

### Current Strategy

**Product Data**:
```javascript
fetch(url, { cache: "no-store" })
```
- No caching
- Always fresh data
- Higher server load

**Recommended Improvements**:
```javascript
// Cache for 60 seconds
fetch(url, { next: { revalidate: 60 } })

// Or use SWR for client-side caching
import useSWR from "swr";
const { data, error } = useSWR("/product", fetcher);
```

---

This API documentation covers all current integrations. Update as new endpoints are added.
