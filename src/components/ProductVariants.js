/**
 * Product Variants Component
 *
 * Displays a product's detailed information with variant selection, pricing, and image gallery.
 * Handles complex image aggregation from multiple sources to provide comprehensive product imagery.
 *
 * Features:
 * - Variant selection with highlighting
 * - Dynamic image gallery based on selected variant
 * - Price formatting with VAT calculation
 * - Stock status display
 * - HTML product descriptions
 *
 * @module ProductVariants
 */

"use client";

import { useState, useMemo } from "react";
import AdditionalContent from "./AdditionalContent";
import ProductImageGallery from "@/components/ProductImageGallery";

/**
 * Formats a price with VAT included.
 *
 * @param {number} price - Base price before VAT
 * @param {number} vat - VAT percentage (e.g., 22 for 22%)
 * @returns {string} Formatted price string with currency (e.g., "€24.40") or "N/A"
 *
 * @example
 * formatPrice(20, 22) // Returns "€24.40"
 */
const formatPrice = (price, vat) => {
  if (typeof price !== "number") return "N/A";
  const priceWithVat = price * (1 + (vat || 0) / 100);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(priceWithVat);
};

/**
 * Extracts the first (most relevant) price from a pricelist array.
 *
 * @param {Array} pricelist - Array of price objects with price and vat properties
 * @returns {Object|null} First price object or null if empty
 */
const getDisplayPrice = (pricelist = []) => {
  return pricelist.length > 0 ? pricelist[0] : null;
};

/**
 * Product Variants Component
 *
 * Main component for displaying product details with variant selection.
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object containing child_products, images, descriptions, etc.
 * @param {Array} props.product.child_products - Array of variant objects
 * @param {Array} props.product.images - Parent product images
 * @param {string} props.product.short_description - HTML short description
 * @param {string} props.product.detailed_description - HTML detailed description
 * @returns {JSX.Element} Product details with variant selector and image gallery
 */
export default function ProductVariants({ product }) {
  const hasVariants = (product.child_products?.length || 0) > 0;
  // No-variant products: the PARENT itself is the sellable item — its own code (SKU), ean_code,
  // stock_amount and pricelist are used (data model §No-variant products). So fall back to the
  // parent as the "selected variant" when there are no child_products.
  const [selectedVariant, setSelectedVariant] = useState(
    product.child_products?.[0] || product
  );

  const displayPrice = useMemo(
    () => (selectedVariant ? getDisplayPrice(selectedVariant.pricelist) : null),
    [selectedVariant]
  );

  /**
   * Aggregates images from multiple sources in priority order.
   *
   * Image Priority:
   * 1. Selected variant's images (most specific)
   * 2. Parent product images (excluding first, which is used as thumbnail)
   * 3. All other variant images (for comprehensive view)
   *
   * This complex aggregation ensures users see all available product imagery
   * while prioritizing the most relevant images for the selected variant.
   * Duplicates are removed while preserving order.
   *
   * @type {Array<Object>} Array of image objects with `url` property
   */
  const imagesToShow = useMemo(() => {
    // Start with the selected variant's images
    const variantImages = selectedVariant?.images || [];

    // Then ALL parent product images — so a variant with no image of its own still shows the
    // parent gallery (previously the first parent image was dropped, leaving such variants blank).
    const parentImages = product.images || [];

    // Add images from all other child products for comprehensive view
    const allChildImages = (product.child_products || []).flatMap(p => p.images || []);

    // Combine in priority order: selected variant -> parent -> other variants
    const combinedImages = [...variantImages, ...parentImages, ...allChildImages];

    // Remove duplicates while preserving order using Set
    const uniqueImageUrls = [...new Set(combinedImages.filter(Boolean))];

    // Transform to ProductImageGallery's expected format
    return uniqueImageUrls.map(url => ({ url }));
  }, [product, selectedVariant]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ProductImageGallery
          images={imagesToShow}
          altText={selectedVariant?.product_name || product.product_name}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-wider mb-2">
          {product.product_name}
        </h1>
        {/* Subtitle only when it's a real variant (avoids repeating the parent name). */}
        {hasVariants && (
          <p className="text-lg text-foreground mb-4">
            {selectedVariant?.product_name}
          </p>
        )}

        <div
          className="text-foreground prose prose-invert"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />

        {product.child_products && product.child_products.length > 0 && (
          <>
            <h2 className="text-[15px] font-semibold mt-8 mb-4">Available Models</h2>
            <div className="space-y-2 mb-6">
              {product.child_products.map((child) => (
                <button
                  key={child.code}
                  onClick={() => setSelectedVariant(child)}
                  className={`w-full text-left p-3 rounded-md border-2 transition-colors cursor-pointer ${
 selectedVariant?.code === child.code
 ? "bg-cyan-tint border-cyan-400"
 :"bg-background border-transparent border shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
 }`}
                >
                  {child.size || child.product_name}
                </button>
              ))}
            </div>
          </>
        )}

        {selectedVariant && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div
                className={`text-lg ${
 selectedVariant.stock_amount > 0
 ? "text-green-fg"
 :"text-red-fg"
 }`}
              >
                {selectedVariant.stock_amount > 0
                  ? `In Stock (${selectedVariant.stock_amount})`
                  : "Out of Stock"}
              </div>
              <div className="text-xl font-bold">
                {displayPrice
                  ? formatPrice(displayPrice.price, displayPrice.vat)
                  : "Price not available"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {selectedVariant.size && (
                <p>
                  <span className="font-semibold">Size:</span>{" "}
                  {selectedVariant.size}
                </p>
              )}
              <p>
                <span className="font-semibold">SKU:</span>{" "}
                {selectedVariant.code}
              </p>
              <p>
                <span className="font-semibold">EAN:</span>{" "}
                {selectedVariant.ean_code}
              </p>
            </div>
          </div>
        )}

        <h2 className="text-[15px] font-semibold mt-8 mb-4">Details</h2>
        <div
          className="text-muted-foreground prose prose-invert"
          dangerouslySetInnerHTML={{ __html: product.detailed_description }}
        />

        {/* PNV "Dodatna vsebina" blocks — spec tables, extra text, links. */}
        <AdditionalContent product={product} className="mt-8" />
      </div>
    </div>
  );
}
