"use client";

import { useState } from "react";

/**
 * Collapsible "More details" block for a product's PNV `additional_content[]` — raw HTML
 * blocks (spec tables, text, links) exported from "Dodatna vsebina N". Renders nothing when
 * the product has no non-blank blocks. Shared by the product detail page and the
 * export/own-sources product modal.
 */

// Styling for PNV-authored HTML. The source markup carries inline widths/colours from the
// Patrik site, so tables are forced fluid and any inline `color` is neutralised to keep it
// readable on both themes.
export const PNV_HTML_CLS =
  "prose-sm max-w-none text-sm leading-relaxed text-foreground [&_a]:text-accent-brand [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_*]:!text-inherit [&_a]:!text-accent-brand [&_p]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md " +
  "[&_table]:my-2 [&_table]:!h-auto [&_table]:!w-full [&_table]:border-collapse [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:!w-auto [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-card [&_th]:px-2 [&_th]:py-1 [&_th]:text-left";

export function additionalContentBlocks(product) {
  return (product?.additional_content || []).filter((b) => typeof b === "string" && b.trim());
}

export default function AdditionalContent({ product, defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const blocks = additionalContentBlocks(product);
  if (!blocks.length) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-left transition-colors hover:border-input hover:bg-muted/60"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          More details
          <span className="ml-2 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal">{blocks.length}</span>
        </span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border px-4">
          {blocks.map((html, i) => (
            <div key={i} className="overflow-x-auto py-3">
              <div className={PNV_HTML_CLS} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
