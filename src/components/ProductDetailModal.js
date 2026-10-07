"use client";

import { useState, useEffect } from "react";
import AdditionalContent, { PNV_HTML_CLS } from "./AdditionalContent";

/**
 * Shared product-detail modal — opened from the Export preview and the Own Sources preview
 * (both pass products in the internal parent/`child_products` shape). Read-only: image gallery,
 * status, meta, description, a collapsible "More details" block (PNV `additional_content[]`
 * HTML — spec tables, text, links), and a per-variant table (SKU · barcode · option · stock · price).
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-foreground">{product.product_name || "Untitled product"}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {product.vendor && <span>{product.vendor}</span>}
              {product.code && <span className="font-mono">{product.code}</span>}
              {range && (
                <span className="font-semibold text-cyan-fg">
                  {range.min === range.max ? fmtPrice(range.min) : `${fmtPrice(range.min)} – ${fmtPrice(range.max)}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card">
                {images[active] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[active]} alt={product.product_name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><PlaceholderImg className="h-12 w-12 text-muted-foreground/40" /></div>
                )}
                <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold ${hasStock ? "bg-emerald-500/90 text-white" : "bg-accent/90 text-foreground"}`}>
                  {hasStock ? "In stock" : "No stock"}
                </span>
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.slice(0, 8).map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border transition-colors ${i === active ? "border-accent-brand" : "border-border hover:border-input"}`}
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
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {product.categories?.length ? "Categories" : "Tags"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.slice(0, 12).map((c) => (
                      <span key={c} className="rounded-md border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {descriptionHtml && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</p>
              <div
                className={PNV_HTML_CLS}
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          )}

          {/* More details — PNV additional content blocks, collapsed by default */}
          <AdditionalContent product={product} className="mt-6" />

          {/* Variants table */}
          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Variants</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 h-9">SKU</th>
                      <th className="px-3 h-9">Barcode</th>
                      <th className="px-3 h-9">Option</th>
                      <th className="px-3 text-right h-9">Stock</th>
                      <th className="px-3 text-right h-9">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {variants.map((v, i) => {
                      const price = variantPrice(v);
                      const vat = v.pricelist?.[0]?.vat;
                      return (
                        <tr key={v.code || v.token || i} className={v.published === false ?"opacity-50":""}>
                          <td className="px-3 py-2 font-mono text-xs text-foreground">{v.code || "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{v.ean_code || "—"}</td>
                          <td className="px-3 py-2 text-foreground">{v.size || "—"}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${v.stock_amount > 0 ? "text-emerald-fg" : "text-muted-foreground"}`}>{v.stock_amount ?? 0}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-cyan-fg">
                            {price != null ? fmtPrice(price) : "—"}
                            {price != null && vat != null && <span className="ml-1 text-[10px] text-muted-foreground/70">+{vat}%</span>}
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
 on ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-fg-soft" : "border-input bg-muted/60 text-muted-foreground"
 }`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: on ? "#34d399" : "#737373" }} />
      {children}
    </span>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
