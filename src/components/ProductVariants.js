/**
 * Product Variants Component
 *
 * Product detail body: image gallery, model (variant) picker, price/stock panel, descriptions
 * and the PNV "More details" blocks. Rendered under the page header on /product/[token].
 *
 * Layout: a 5/12 sticky gallery next to a 7/12 info column, then the additional-content
 * blocks full width below (spec tables need the whole page; text blocks are capped at a
 * reading width inside `AdditionalContent`).
 *
 * @module ProductVariants
 */

"use client";

import { useState, useMemo } from "react";
import AdditionalContent from "./AdditionalContent";
import ProductImageGallery from "@/components/ProductImageGallery";
import { cn } from "@/lib/utils";
import { badge } from "@/lib/ui";

/**
 * Formats a price with VAT included.
 *
 * @param {number} price - Base price before VAT
 * @param {number} vat - VAT percentage (e.g., 22 for 22%)
 * @returns {string} Formatted price string with currency (e.g., "€24.40") or "N/A"
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
 * Chip labels for the model picker. A variant's `size` is the label when it is unique among the
 * variants; when several share a size (e.g. "WB-X 55" and "WB-XT 55"), fall back to the variant
 * name with the prefix common to all variants stripped, so the chips read "X 55" / "XT 55".
 *
 * @param {Array<Object>} variants
 * @returns {Map<string, string>} variant code → label
 */
const variantLabels = (variants) => {
  const names = variants.map((v) => v.product_name || "");
  let prefix = names[0] || "";
  for (const n of names) {
    while (prefix && !n.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  prefix = prefix.slice(0, prefix.lastIndexOf(" ") + 1); // cut back to a word boundary
  const sizeCount = variants.reduce((m, v) => m.set(v.size, (m.get(v.size) || 0) + 1), new Map());
  return new Map(
    variants.map((v) => {
      const sizeUnique = v.size && sizeCount.get(v.size) === 1;
      const stripped = (v.product_name || "").slice(prefix.length).trim();
      return [v.code, sizeUnique ? v.size : stripped || v.size || v.code];
    })
  );
};

// Shared styling for the PNV-authored description HTML (short + detailed).
const DESCRIPTION_CLS =
  "max-w-[70ch] text-sm leading-relaxed text-muted-foreground [&_a]:text-accent-brand [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5";

/**
 * Product Variants Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object containing child_products, images, descriptions, etc.
 * @returns {JSX.Element} Product details with variant selector and image gallery
 */
export default function ProductVariants({ product }) {
  const variants = useMemo(() => product.child_products || [], [product]);
  const hasVariants = variants.length > 0;
  // No-variant products: the PARENT itself is the sellable item — its own code (SKU), ean_code,
  // stock_amount and pricelist are used (data model §No-variant products). So fall back to the
  // parent as the "selected variant" when there are no child_products.
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || product);

  const displayPrice = useMemo(
    () => (selectedVariant ? getDisplayPrice(selectedVariant.pricelist) : null),
    [selectedVariant]
  );

  /**
   * Aggregates images in priority order: selected variant → parent → other variants,
   * de-duplicated while preserving order, in ProductImageGallery's `{ url }` shape.
   */
  const imagesToShow = useMemo(() => {
    const variantImages = selectedVariant?.images || [];
    const parentImages = product.images || [];
    const allChildImages = (product.child_products || []).flatMap((p) => p.images || []);
    const uniqueImageUrls = [...new Set([...variantImages, ...parentImages, ...allChildImages].filter(Boolean))];
    return uniqueImageUrls.map((url) => ({ url }));
  }, [product, selectedVariant]);

  const labels = useMemo(() => variantLabels(variants), [variants]);
  const inStock = (selectedVariant?.stock_amount || 0) > 0;
  const categories = product.categories || [];

  return (
    <div className="max-w-7xl">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
        {/* Gallery — sticks while the (longer) info column scrolls. */}
        <div className="md:col-span-5">
          <div className="md:sticky md:top-20">
            <ProductImageGallery
              images={imagesToShow}
              altText={selectedVariant?.product_name || product.product_name}
            />
          </div>
        </div>

        <div className="md:col-span-7">
          {/* Lead — the short description reads as the product's one-line pitch. */}
          {product.short_description && (
            <div
              className="max-w-[60ch] text-base leading-snug text-foreground [&_p]:my-0 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c} className={cn(badge.base, badge.variant.outline, "font-normal text-muted-foreground")}>{c}</span>
              ))}
            </div>
          )}

          {/* Model picker — chips, the selected one carries the brand accent. */}
          {hasVariants && (
            <div className="mt-7">
              <h2 className="mb-2 text-[13px] font-semibold text-foreground">Model</h2>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Model">
                {variants.map((child) => {
                  const selected = selectedVariant?.code === child.code;
                  const soldOut = !(child.stock_amount > 0);
                  return (
                    <button
                      key={child.code}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedVariant(child)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        selected
                          ? "border-accent-brand bg-accent-brand/10 font-medium text-foreground"
                          : "border-input bg-background text-foreground shadow-xs hover:bg-accent dark:bg-input/30 dark:hover:bg-input/50",
                        soldOut && !selected && "text-muted-foreground"
                      )}
                    >
                      {labels.get(child.code)}
                      {soldOut && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-label="Out of stock" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price + stock + identifiers for the selected model. */}
          {selectedVariant && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <div className="font-display text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                    {displayPrice ? formatPrice(displayPrice.price, displayPrice.vat) : "Price not available"}
                  </div>
                  {displayPrice && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {displayPrice.name ? `${displayPrice.name} · ` : ""}
                      {displayPrice.vat ? `incl. ${displayPrice.vat}% VAT` : "excl. VAT"}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    inStock
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-fg"
                      : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", inStock ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                  {inStock ? `In stock · ${selectedVariant.stock_amount}` : "Out of stock"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-mono text-xs text-foreground">{selectedVariant.code || "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">EAN</dt>
                  <dd className="font-mono text-xs text-foreground">{selectedVariant.ean_code || "—"}</dd>
                </div>
                {selectedVariant.size && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="text-foreground">{selectedVariant.size}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {product.detailed_description && (
            <div className="mt-8">
              <h2 className="mb-2 text-[13px] font-semibold text-foreground">Details</h2>
              <div className={DESCRIPTION_CLS} dangerouslySetInnerHTML={{ __html: product.detailed_description }} />
            </div>
          )}
        </div>
      </div>

      {/* PNV "Dodatna vsebina" blocks — spec tables, extra text, links. Full width below the two
          columns so wide spec tables get the whole page, always expanded. */}
      <AdditionalContent product={product} variant="list" className="mt-12 border-t border-border pt-8" />
    </div>
  );
}
