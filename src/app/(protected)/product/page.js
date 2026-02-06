/**
 * Product List Page (Protected Route)
 *
 * This server component fetches all products from the backend API and displays them
 * in a grid or list view. The page is protected by Auth0 authentication via the
 * (protected) route group layout.
 *
 * @module ProductPage
 */

import { auth0 } from "@/lib/auth0";
import ProductGrid from "@/components/ProductGrid";

/**
 * Fetches all products from the backend API.
 *
 * This function implements a fallback chain for environment variable configuration:
 * 1. EXPORT_API_URL (server-side only)
 * 2. NEXT_PUBLIC_EXPORT_API_URL (client and server)
 * 3. http://localhost:4000 (development default)
 *
 * The fetch uses `cache: "no-store"` to ensure fresh data on every request,
 * bypassing Next.js's default caching behavior.
 *
 * @async
 * @returns {Promise<Object>} Product data object with a `data` array property
 * @throws {Error} If the API request fails or returns a non-OK status
 *
 * @example
 * const productsData = await getProducts();
 * const products = productsData?.data ?? [];
 */
async function getProducts() {
  const apiUrl =
    process.env.EXPORT_API_URL ||
    process.env.NEXT_PUBLIC_EXPORT_API_URL ||
    "http://localhost:4000";

  const res = await fetch(`${apiUrl}/product`, {
    cache: "no-store"
  });

  if (!res.ok) {
    // Enhanced error logging with response body for debugging
    const body = await res.text().catch(() => "");
    console.error("API error:", res.status, body);
    throw new Error(`Failed to fetch products (${res.status})`);
  }

  return res.json();
}

/**
 * Product Page Component
 *
 * Server component that fetches products and renders the ProductGrid.
 * Protected by Auth0 authentication via the (protected) route group.
 *
 * @async
 * @returns {Promise<JSX.Element>} The rendered product page
 */
export default async function ProductPage() {
  const productsData = await getProducts();
  const products = productsData?.data ?? [];

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        <ProductGrid initialProducts={products} />
      </div>
    </div>
  );
}
