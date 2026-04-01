/**
 * Product Grid Component
 *
 * This client component displays products in either a grid or list view with selection capabilities.
 * Features include:
 * - Toggle between grid and list views
 * - Product selection (desktop: multi-select, mobile: navigate to detail)
 * - LocalStorage persistence of selected products
 * - Copy selected product tokens to clipboard
 * - Select/deselect all functionality
 *
 * @module ProductGrid
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * Product Card Component
 *
 * Renders a single product in either grid or list view.
 * Calculates minimum price from all variants and displays product information.
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object with child_products, images, etc.
 * @param {boolean} props.isSelected - Whether the product is currently selected
 * @param {Function} props.onSelect - Callback when product is clicked/selected
 * @param {string} props.view - Display mode: "grid" or "list"
 * @param {Function} props.onProductNameClick - Callback for detail button click
 * @returns {JSX.Element} Product card in grid or list layout
 */
function ProductCard({
  product,
  view,
  onProductNameClick,
}) {
  const imgSrc = product.images?.[0] || product.child_products?.find(v => v.images?.[0])?.images?.[0] || null;
  const variations = product.child_products?.length || 0;
  const hasStock = product.child_products?.some(v => v.stock_amount > 0) ?? false;
  const allPrices = (product.child_products || []).flatMap(
    v => v.pricelist?.map(p => p.price).filter(p => typeof p === "number") || []
  );
  const minPrice = allPrices.length ? Math.min(...allPrices) : null;

  const PlaceholderImg = () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
      <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  if (view === "list") {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group bg-neutral-900/60 border border-neutral-800/50 hover:border-neutral-700/60 hover:bg-neutral-800/40"
        onClick={() => onProductNameClick(product.token)}
      >
        <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
          {imgSrc ? (
            <Image src={imgSrc} alt={product.product_name} fill sizes="56px" className="object-cover" />
          ) : (
            <PlaceholderImg />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{product.product_name}</p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
            <span className="text-[11px] text-neutral-500">{variations} {variations === 1 ? "variant" : "variants"}</span>
            {minPrice !== null && <span className="text-[11px] font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
            {product.categories?.slice(0, 2).map(cat => (
              <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-600 rounded border border-neutral-700/40 truncate max-w-[100px]">{cat}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-1 rounded-lg ${
            hasStock ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-neutral-600 border border-neutral-700/40"
          }`}>
            {hasStock ? "In Stock" : "No Stock"}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onProductNameClick(product.token); }}
            className="py-1.5 px-3 bg-neutral-800 hover:bg-cyan-600/80 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-all border border-neutral-700/50 hover:border-cyan-500/40"
          >
            Details
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="group relative bg-neutral-900/70 border border-neutral-800/60 hover:border-neutral-600/60 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-black/30"
      onClick={() => onProductNameClick(product.token)}
    >
      <div className="relative aspect-square bg-neutral-800">
        {imgSrc ? (
          <Image src={imgSrc} alt={product.product_name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <PlaceholderImg />
        )}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            hasStock ? "bg-emerald-500/90 text-white" : "bg-neutral-700/90 text-neutral-400"
          }`}>
            {hasStock ? "● In Stock" : "○ No Stock"}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug mb-2">{product.product_name}</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-neutral-500">{variations} {variations === 1 ? "variant" : "variants"}</span>
          {minPrice !== null && <span className="text-xs font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
        </div>
        {product.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {product.categories.slice(0, 2).map(cat => (
              <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-500 rounded-md border border-neutral-700/50 truncate max-w-[90px]">{cat}</span>
            ))}
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onProductNameClick(product.token); }}
          className="w-full py-1.5 bg-neutral-800 hover:bg-cyan-600/80 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-all border border-neutral-700/50 hover:border-cyan-500/40"
        >
          Details
        </button>
      </div>
    </div>
  );
}

/**
 * Custom hook for responsive media query matching.
 *
 * Listens to window.matchMedia changes and updates the component when
 * the media query match state changes. Used to detect desktop vs mobile
 * for different selection behaviors.
 *
 * @param {string} query - CSS media query string (e.g., "(min-width: 640px)")
 * @returns {boolean} Whether the media query currently matches
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 640px)");
 */

/**
 * Product Grid Component
 *
 * Main component that displays a collection of products with selection and view options.
 *
 * Selection behavior:
 * - Desktop (≥640px): Click to toggle multi-select, "Details" button for navigation
 * - Mobile (<640px): Click to navigate directly to product detail page
 *
 * Persistence:
 * - Selected product tokens are saved to localStorage under "selectedProductTokens"
 * - Selection persists across page reloads and navigation
 *
 * @param {Object} props - Component props
 * @param {Array} props.initialProducts - Array of product objects from the API
 * @returns {JSX.Element} Product grid with controls
 */
export default function ProductGrid({ initialProducts = [] }) {
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [view, setView] = useState("grid"); // 'grid' or 'list'

  const handleProductNameClick = (token) => {
    router.push(`/product/${token}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Products Overview</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-800/80 border border-neutral-700/50 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        className={`grid gap-3 ${
          view === "grid"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            : "grid-cols-1"
        }`}
      >
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            view={view}
            onProductNameClick={handleProductNameClick}
          />
        ))}
      </div>
    </>
  );
}