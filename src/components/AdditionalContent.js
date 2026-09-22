"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders a product's PNV `additional_content[]` — raw HTML blocks (spec tables, text, links)
 * exported from "Dodatna vsebina N". Renders nothing when the product has no non-blank blocks.
 *
 * Two layouts:
 * - `collapsible` (default) — a single "More details" toggle; used in the export/own-sources
 *   product modal where vertical space is scarce.
 * - `list` — a titled section with every block always visible; used on the product detail
 *   page. A block that is a table gets the full width in a bordered wrap, a text block is
 *   capped at a reading width — the structure tells the two apart, not decoration.
 */

// Base styling for PNV-authored HTML. The source markup carries inline widths, colours,
// font sizes and centring from the Patrik site, so: inline `color` is neutralised for both
// themes, oversized inline `font-size` on spans (e.g. a 36px "Buy now") is reset, centred
// paragraphs are re-aligned left, and tables are forced fluid.
export const PNV_HTML_CLS =
  "text-sm leading-relaxed text-foreground " +
  "[&_*]:!text-inherit [&_a]:!text-accent-brand [&_a]:font-medium [&_a]:underline-offset-2 hover:[&_a]:underline " +
  "[&_span]:!text-[length:inherit] [&_p]:my-2 [&_p]:!text-left [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
  "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 " +
  "[&_img]:!h-auto [&_img]:max-w-full [&_img]:rounded-md " +
  // WordPress/Bootstrap wrappers: drop inline greys/padding; lay a `.row` out as columns.
  "[&_div]:!bg-transparent [&_div]:!p-0 [&_div]:!m-0 [&_.row]:flex [&_.row]:flex-wrap [&_.row]:!gap-6 [&_.row]:items-start [&_.row+.row]:!mt-8 " +
  "[&_.row>div]:min-w-0 [&_.row>div]:flex-1 [&_.row>div]:basis-full md:[&_.row>div]:basis-0 " +
  "md:[&_.col-md-4]:!flex-none md:[&_.col-md-4]:w-[30%] md:[&_.col-md-3]:!flex-none md:[&_.col-md-3]:w-1/4 md:[&_.col-md-6]:!flex-none md:[&_.col-md-6]:w-[calc(50%-0.75rem)] " +
  // Tables: fluid, horizontal rules only, first row treated as the header row.
  "[&_table]:my-0 [&_table]:!h-auto [&_table]:!w-full [&_table]:border-collapse [&_table]:text-[13px] " +
  "[&_td]:!w-auto [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:!text-left " +
  "[&_th]:border-b [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:!text-left [&_th]:font-semibold " +
  "[&_tr:first-child_td]:bg-muted/50 [&_tr:first-child_td]:font-semibold [&_tr:first-child_td]:whitespace-nowrap " +
  "[&_tr:last-child_td]:border-b-0 [&_tbody_tr:nth-child(even)_td]:bg-muted/20";

export function additionalContentBlocks(product) {
  return (product?.additional_content || []).filter((b) => typeof b === "string" && b.trim());
}

const isTableBlock = (html) => /<table[\s>]/i.test(html);
// Bootstrap `.row` blocks are image + text feature layouts and need the width.
const isWideBlock = (html) => isTableBlock(html) || /class="(?:[^"]*\s)?row(?:\s[^"]*)?"/i.test(html);

const Block = ({ html, className }) => (
  <div className={cn("overflow-x-auto", className)}>
    <div className={PNV_HTML_CLS} dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);

export default function AdditionalContent({ product, variant = "collapsible", defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const blocks = additionalContentBlocks(product);
  if (!blocks.length) return null;

  if (variant === "list") {
    return (
      <section className={className} aria-label="More details">
        <h2 className="mb-4 text-[13px] font-semibold text-foreground">More details</h2>
        <div className="space-y-6">
          {blocks.map((html, i) =>
            isTableBlock(html) ? (
              <Block key={i} html={html} className="rounded-xl border border-border bg-card shadow-xs" />
            ) : isWideBlock(html) ? (
              <Block key={i} html={html} />
            ) : (
              <Block key={i} html={html} className="max-w-[70ch]" />
            )
          )}
        </div>
      </section>
    );
  }

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
            <Block key={i} html={html} className="py-3" />
          ))}
        </div>
      )}
    </div>
  );
}
