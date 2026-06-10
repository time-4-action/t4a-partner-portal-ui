"use client";

import { useState, useEffect } from "react";

/**
 * Shared product-detail modal — opened from the Export preview and the Own Sources preview
 * (both pass products in the internal parent/`child_products` shape). Read-only: image gallery,
 * status, meta, description, and a per-variant table (SKU · barcode · option · stock · price).
 *
 * Works for both Patrik products (PNV) and imported feed products — they use the same fields.
 */

const ACCENT = "#01a0be";

// Lowest/highest price across a variant's pricelist (variants carry pricing).
function variantPrice(v) {
  const prices = (v.pricelist || []).map((p) => p.price).filter((p) => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}

function priceRange(product) {
  const variants = product.child_products || [];
  const all = [
    ...(product.pricelist || []).map((p) => p.price),
    ...variants.flatMap((v) => (v.pricelist || []).map((p) => p.price)),
  ].filter((p) => typeof p === "number");
  if (!all.length) return null;
  const min = Math.min(...all), max = Math.max(...all);
  return { min, max };
}

const fmtPrice = (n) => `€${Number(n).toFixed(2)}`;

const PlaceholderImg = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function ProductDetailModal({ product, onClose }) {
  // Gather every image (parent gallery + variant images), de-duplicated, order preserved.
  const variants = product.child_products || [];
  const images = [...new Set([...(product.images || []), ...variants.flatMap((v) => v.images || [])])].filter(Boolean);
  const [active, setActive] = useState(0);

  // Lock background scroll + close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const range = priceRange(product);
  const hasStock = variants.some((v) => v.stock_amount > 0) || product.stock_amount > 0;
  const labels = product.categories?.length ? product.categories : product.tags || [];
  const descriptionHtml = product.detailed_description || product.short_description || "";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-800 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">{product.product_name || "Untitled product"}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              {product.vendor && <span>{product.vendor}</span>}
              {product.code && <span className="font-mono">{product.code}</span>}
              {range && (
                <span className="font-semibold text-cyan-400">
                  {range.min === range.max ? fmtPrice(range.min) : `${fmtPrice(range.min)} – ${fmtPrice(range.max)}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                {images[active] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[active]} alt={product.product_name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-12 w-12 text-neutral-700" /></div>
                )}
                <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold ${hasStock ? "bg-emerald-500/90 text-white" : "bg-neutral-700/90 text-neutral-300"}`}>
                  {hasStock ? "In stock" : "No stock"}
                </span>
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.slice(0, 8).map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border transition-colors ${i === active ? "border-[#01a0be]" : "border-neutral-800 hover:border-neutral-600"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <StatusChip on={product.published}>{product.published ? "Published" : "Draft"}</StatusChip>
                {product.active === false && <StatusChip on={false}>Inactive</StatusChip>}
                {product.archived && <StatusChip on={false}>Archived</StatusChip>}
              </div>

              <dl className="space-y-2 text-sm">
                <MetaRow label="Variants">{variants.length || "—"}</MetaRow>
                {product.ean_code && <MetaRow label="Barcode"><span className="font-mono text-xs">{product.ean_code}</span></MetaRow>}
                {product.size && <MetaRow label="Size">{product.size}</MetaRow>}
                {product.token && <MetaRow label="Handle"><span className="font-mono text-xs">{product.token}</span></MetaRow>}
              </dl>

              {labels.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {product.categories?.length ? "Categories" : "Tags"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.slice(0, 12).map((c) => (
                      <span key={c} className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {descriptionHtml && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Description</p>
              <div
                className="prose-sm max-w-none text-sm leading-relaxed text-neutral-300 [&_a]:text-[#01a0be] [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          )}

          {/* Variants table */}
          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Variants</p>
              <div className="overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/60 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Barcode</th>
                      <th className="px-3 py-2">Option</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {variants.map((v, i) => {
                      const price = variantPrice(v);
                      const vat = v.pricelist?.[0]?.vat;
                      return (
                        <tr key={v.code || v.token || i} className={v.published === false ? "opacity-50" : ""}>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-200">{v.code || "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-500">{v.ean_code || "—"}</td>
                          <td className="px-3 py-2 text-neutral-300">{v.size || "—"}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${v.stock_amount > 0 ? "text-emerald-400" : "text-neutral-500"}`}>{v.stock_amount ?? 0}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-cyan-400">
                            {price != null ? fmtPrice(price) : "—"}
                            {price != null && vat != null && <span className="ml-1 text-[10px] text-neutral-600">+{vat}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ on, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        on ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-neutral-700 bg-neutral-800/60 text-neutral-400"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: on ? "#34d399" : "#737373" }} />
      {children}
    </span>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-800/60 pb-2">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-200">{children}</dd>
    </div>
  );
}
