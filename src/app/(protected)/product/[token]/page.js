/**
 * Product Detail Page (Protected Route)
 *
 * This server component fetches a single product by its token and displays
 * detailed information including variants, pricing, and images.
 * Protected by Auth0 authentication via the (protected) route group.
 *
 * @module ProductDetailPage
 */

import Link from "next/link";
import ProductVariants from "@/components/ProductVariants";
import PageHeader from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { btn } from "@/lib/ui";

/**
 * Component displayed when a product is not found.
 *
 * @returns {JSX.Element} Product not found message
 */
const ProductNotFound = () => (
    <div className="p-4 md:p-8 text-foreground">
        Product not found.
    </div>
);

/**
 * Fetches a single product by its unique token from the backend API.
 *
 * Uses the EXPORT_API_URL environment variable with a fallback to localhost.
 * The fetch uses `cache: "no-store"` to ensure fresh product data.
 *
 * @async
 * @param {string} token - The unique product token identifier
 * @returns {Promise<Object>} Product data object with a `data` property containing the product
 * @throws {Error} If the API request fails or returns a non-OK status
 *
 * @example
 * const productData = await getProduct("abc123");
 * const product = productData.data;
 */
async function getProduct(token) {
    const apiUrl = process.env.EXPORT_API_URL || "http://localhost:3000";
    const res = await fetch(`${apiUrl}/product/${token}`, {
        cache: "no-store",
    });

    console.log(`${apiUrl}/product/${token}`);


    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error("Failed to fetch product");
    }

    return res.json();
}

/**
 * Product Detail Page Component
 *
 * Server component that renders a single product's detailed view with variants.
 * Handles parameter resolution (Next.js 15+ dynamic params can be promises),
 * product fetching, and error states.
 *
 * @async
 * @param {Object} props - Component props
 * @param {Promise<Object>|Object} props.params - Route parameters (can be a promise in Next.js 15+)
 * @param {string} props.params.token - The product token from the URL
 * @returns {Promise<JSX.Element>} The rendered product detail page or not found message
 *
 * @example
 * // URL: /product/abc123
 * // params = { token: "abc123" }
 */
export default async function ProductDetailPage({ params }) {
    // In Next.js 15+, params can be a promise when dynamically rendered
    // We await it to get the resolved value
    const resolvedParams = await params;
    const { token } = resolvedParams;

    if (!token) {
        return <ProductNotFound />;
    }

    const productData = await getProduct(token);

    // Validate that the API returned a valid product within the 'data' property
    if (!productData || !productData.data) {
        return <ProductNotFound />;
    }

    const product = productData.data;

    const variantCount = product.child_products?.length || 0;

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title={product.product_name}
                badge={product.code && <span className="font-mono text-xs text-muted-foreground">{product.code}</span>}
                description={variantCount ? `${variantCount} ${variantCount === 1 ? "model" : "models"}` : undefined}
                right={
                    <Link href="/product" className={cn(btn.base, btn.variant.outline, btn.size.sm)}>
                        <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        All products
                    </Link>
                }
            />
            <div className="flex-1 p-4 md:p-8">
                <ProductVariants product={product} />
            </div>
        </div>
    );
}
