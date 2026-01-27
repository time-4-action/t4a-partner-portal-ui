"use client";

import { useState, useMemo } from "react";
import ProductImageGallery from "@/components/ProductImageGallery";

// Helper to format price
const formatPrice = (price, vat) => {
  if (typeof price !== "number") return "N/A";
  const priceWithVat = price * (1 + (vat || 0) / 100);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(priceWithVat);
};

// Helper to get the most relevant price from a pricelist
const getDisplayPrice = (pricelist = []) => {
  return pricelist.length > 0 ? pricelist[0] : null;
};

export default function ProductVariants({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.child_products?.[0] || null
  );

  const displayPrice = useMemo(
    () => (selectedVariant ? getDisplayPrice(selectedVariant.pricelist) : null),
    [selectedVariant]
  );

  const imagesToShow = useMemo(() => {
    // Start with the selected variant's images.
    const variantImages = selectedVariant?.images || [];
    // Then, add the parent product's images, but skip the first one.
    const parentImages = (product.images || []).slice(1);
    // Finally, add all images from all child products.
    const allChildImages = (product.child_products || []).flatMap(p => p.images || []);

    // Combine them in order of priority: selected variant -> parent (minus first) -> other variants.
    const combinedImages = [...variantImages, ...parentImages, ...allChildImages];

    // Create a unique list of images based on the URL, preserving the order.
    const uniqueImageUrls = [...new Set(combinedImages.filter(Boolean))];

    // The ProductImageGallery component expects an array of objects with a 'url' property.
    // We map the unique URLs to this structure.
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
        <p className="text-lg text-neutral-300 mb-4">
          {selectedVariant?.product_name}
        </p>

        <div
          className="text-neutral-300 prose prose-invert"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />

        {product.child_products && product.child_products.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-8 mb-4">Available Models</h2>
            <div className="space-y-2 mb-6">
              {product.child_products.map((child) => (
                <button
                  key={child.code}
                  onClick={() => setSelectedVariant(child)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedVariant?.code === child.code
                      ? "bg-cyan-900/50 border-cyan-400"
                      : "bg-neutral-800 border-transparent hover:border-neutral-600"
                  }`}
                >
                  {child.product_name}
                </button>
              ))}
            </div>
          </>
        )}

        {selectedVariant && (
          <div className="bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div
                className={`text-lg ${
                  selectedVariant.stock_amount > 0
                    ? "text-green-400"
                    : "text-red-400"
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
            <div className="text-sm text-neutral-400 space-y-1">
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

        <h2 className="text-2xl font-bold mt-8 mb-4">Details</h2>
        <div
          className="text-neutral-400 prose prose-invert"
          dangerouslySetInnerHTML={{ __html: product.detailed_description }}
        />
      </div>
    </div>
  );
}
