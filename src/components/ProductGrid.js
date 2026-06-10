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

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import Image from "next/image";

/* ──────────────────────────────────────────────────────────────────────────
 * Search scoring
 *
 * A product matches when EITHER its name fuzzy-matches the query OR any of its
 * codes (parent + every variant SKU/EAN) contains the query. Codes are compared
 * with separators stripped so "4012-345" matches "4012345". Results are sorted
 * by score so the strongest match floats to the top (exact code > substring code
 * > contiguous name > scattered subsequence).
 * ────────────────────────────────────────────────────────────────────────── */

// Strip everything but letters/digits — barcodes & SKUs vary in punctuation.
const cleanCode = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ──────────────────────────────────────────────────────────────────────────
 * Stock status — three states instead of a plain in/out boolean.
 *   full    → every sellable variant has stock          (emerald)
 *   partial → some variants in stock, some sold out      (amber/orange)
 *   none    → nothing in stock                           (neutral)
 * ────────────────────────────────────────────────────────────────────────── */
function getStockLevel(product) {
  const variants = product.child_products || [];
  // No-variant products are sellable via the parent's own stock.
  if (variants.length === 0) return product.stock_amount > 0 ? "full" : "none";
  const inStock = variants.filter(v => v.stock_amount > 0).length;
  if (inStock === 0) return "none";
  if (inStock === variants.length) return "full";
  return "partial";
}

const STOCK_BADGE = {
  full: {
    label: "In Stock",
    dot: "●",
    list: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    card: "bg-emerald-500/90 text-white",
  },
  partial: {
    label: "Partial Stock",
    dot: "◐",
    list: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    card: "bg-amber-500/90 text-white",
  },
  none: {
    label: "No Stock",
    dot: "○",
    list: "bg-neutral-800 text-neutral-600 border border-neutral-700/40",
    card: "bg-neutral-700/90 text-neutral-400",
  },
};

// fzf-style subsequence score. Returns -Infinity when the query chars don't all
// appear in order; otherwise rewards contiguous runs and word-boundary starts.
function fuzzyNameScore(query, text) {
  const q = query;
  const t = (text || "").toLowerCase();
  if (!q) return 0;
  if (!t) return -Infinity;
  if (t.includes(q)) {
    // Direct substring — strong, and even stronger at a word boundary / start.
    const idx = t.indexOf(q);
    const boundary = idx === 0 || /[\s\-/.,]/.test(t[idx - 1]);
    return 60 + (boundary ? 20 : 0) + Math.max(0, 12 - idx / 4);
  }
  let score = 0;
  let ti = 0;
  let prev = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let j = ti; j < t.length; j++) {
      if (t[j] === ch) { found = j; break; }
    }
    if (found === -1) return -Infinity;
    if (found === prev + 1) score += 5;          // contiguous run
    else score += 1;
    if (found === 0 || /[\s\-/.,]/.test(t[found - 1])) score += 3; // word start
    prev = found;
    ti = found + 1;
  }
  return score;
}

// Score one product against a raw query. The match can come from the name (fuzzy)
// or from any parent/variant SKU or EAN code (separator-insensitive substring).
function scoreProduct(product, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;
  const qc = cleanCode(q);

  let best = fuzzyNameScore(q, product.product_name);

  if (qc.length >= 2) {
    const codes = [product.code, product.ean_code];
    for (const v of product.child_products || []) codes.push(v.code, v.ean_code);
    for (const value of codes) {
      const cc = cleanCode(value);
      if (!cc) continue;
      let s = -Infinity;
      if (cc === qc) s = 200;
      else if (cc.startsWith(qc)) s = 150;
      else if (cc.includes(qc)) s = 120;
      if (s > best) best = s;
    }
  }

  return best;
}

// Fallback artwork when a product (and its variants) have no image.
function PlaceholderImg() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
      <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

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
  const stock = STOCK_BADGE[getStockLevel(product)];
  const allPrices = (product.child_products || []).flatMap(
    v => v.pricelist?.map(p => p.price).filter(p => typeof p === "number") || []
  );
  const minPrice = allPrices.length ? Math.min(...allPrices) : null;

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
          <span className={`hidden sm:inline text-[10px] font-semibold px-2 py-1 rounded-lg ${stock.list}`}>
            {stock.label}
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
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stock.card}`}>
            {stock.dot} {stock.label}
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
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 200);

  const handleProductNameClick = (token) => {
    router.push(`/product/${token}`);
  };

  // Filter + rank by the fuzzy/code score. Empty query → original order.
  const results = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return products.map((product) => ({ product }));
    return products
      .map((product) => ({ product, score: scoreProduct(product, q) }))
      .filter((r) => r.score > -Infinity)
      .sort((a, b) => b.score - a.score);
  }, [products, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Compact header — small icon + title + badge on one line, matching the Export / Shopify pages. */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10">
            <svg className="h-5 w-5 text-[#01a0be]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white">Products Overview</h1>
            <p className="text-xs text-neutral-500">
              {isSearching
                ? `${results.length} of ${products.length} products`
                : `${products.length} products`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU or EAN…"
              aria-label="Search products"
              className="w-full rounded-xl border border-neutral-700/50 bg-neutral-800/80 py-2 pl-9 pr-9 text-sm text-white placeholder-neutral-500 transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 transition-colors hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
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
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <p className="text-sm font-medium text-neutral-300">No products match “{debouncedQuery.trim()}”</p>
          <p className="mt-1 text-xs text-neutral-500">Try a different name, SKU, or EAN code.</p>
          <button
            onClick={() => setQuery("")}
            className="mt-4 rounded-lg border border-neutral-700/50 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-cyan-500/40 hover:text-white"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            view === "grid"
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              : "grid-cols-1"
          }`}
        >
          {results.map(({ product }) => (
            <ProductCard
              key={product._id}
              product={product}
              view={view}
              onProductNameClick={handleProductNameClick}
            />
          ))}
        </div>
      )}
    </>
  );
}