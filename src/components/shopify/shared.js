"use client";

/**
 * Shared vocabulary + primitives for the Shopify integration area.
 *
 * Everything the section components need in common lives here: the connection / sync-run status
 * vocabulary (one set of labels + tones so a "done" run reads as "Completed" everywhere), the
 * per-source constants (what can be synced, the ownership modes), the deterministic formatters
 * (UTC, so server and client render the same string), the demo fallback data, and the small UI
 * primitives (Badge, Modal, Menu, Section, Field, Toggle, Segmented, Toast) built on the admin
 * class recipes in `src/lib/ui.js`.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, dialog, menuItem, popover } from "@/lib/ui";
import { DEFAULT_PRICE_ROUNDING } from "@/lib/priceRounding";
import { DEFAULT_EXISTING_SALE_POLICY, DEFAULT_PRICE_FIELDS } from "@/lib/comparePrice";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

// OAuth scopes the shared public app requests (shown on the connect screen + store details).
export const SCOPES = ["read_products", "write_products", "read_inventory", "write_inventory", "read_locations"];

// Admin API scopes a merchant must enable on their OWN custom app for the deprecated flow. Mirror
// of the backend DEFAULT_SCOPES — the publications pair powers the "Sales channels" publish step.
export const CUSTOM_APP_SCOPES = [...SCOPES, "read_publications", "write_publications"];

// Fixed portal URLs the customer pastes into their Partner Dashboard app (deprecated flow).
export const OAUTH_DEFAULTS = {
  appUrl: "https://export.time-4-action.com/integrations/shopify-deprecated",
  redirectUrl: "https://api.time-4-action.com/api/export/shopify/callback-custom",
};

/** The data a source can push, in display order. `key` is the config flag. */
export const SYNC_FLAGS = [
  { key: "syncStock", label: "Stock", desc: "Live inventory quantities." },
  { key: "syncNewProducts", label: "New products", desc: "Create products missing from the store." },
  { key: "syncPrices", label: "Prices", desc: "Variant prices from your pricelists." },
  { key: "syncDescriptions", label: "Content", desc: "Titles, descriptions and product fields." },
  { key: "syncTags", label: "Tags", desc: "Categories as Shopify tags." },
  { key: "syncImages", label: "Images", desc: "Product and variant images.", slow: true },
];

/** Ownership modes. `short` is the badge/summary label; `title` + `desc` are the picker copy. */
export const OWNERSHIP_MODES = [
  {
    value: "create_then_handoff",
    short: "Create + hand off",
    title: "Create, then hand off",
    recommended: true,
    desc: "Adds each product once, then keeps stock (and prices, if on) current. Your edits in Shopify stay yours.",
  },
  {
    value: "stock_only",
    short: "Stock only",
    title: "Stock only",
    desc: "Only inventory quantities. Never touches titles, prices, descriptions or images.",
  },
  {
    value: "portal_authoritative",
    short: "Portal authoritative",
    title: "Portal authoritative",
    desc: "The portal keeps products fully in sync on every run — titles, prices, images and more.",
    warn: "Edits made in Shopify to title, description, price or images are overwritten on the next sync.",
  },
];
export const ownershipMeta = (value) => OWNERSHIP_MODES.find((m) => m.value === value) || OWNERSHIP_MODES[1];

/** Sync-run status vocabulary — the ONLY place a raw job status is turned into a label. */
export const RUN_STATUS = {
  done: { label: "Completed", tone: "success" },
  partial: { label: "Partial", tone: "warning" },
  running: { label: "Running", tone: "info" },
  failed: { label: "Failed", tone: "danger" },
  queued: { label: "Pending", tone: "neutral" },
  retry: { label: "Retrying", tone: "warning" },
};
export const runStatusMeta = (status) => RUN_STATUS[status] || { label: status || "—", tone: "neutral" };

/** Demo-only job type codes → labels (real rows already carry a label in `type`). */
const JOB_TYPE_LABEL = { inventory: "Stock", product_create: "Create", product_update: "Update", image: "Images" };
export const jobTypeLabel = (t) => JOB_TYPE_LABEL[t] || t || "—";

/**
 * Store status vocabulary: Active · Needs attention · Syncing · Disconnected. Derived from the
 * connection record plus what the selected panel has learned (attention count, reconnect flag).
 */
export function storeStatus(conn, { syncing = false } = {}) {
  if (!conn) return { key: "disconnected", label: "Disconnected", tone: "neutral" };
  if (conn.status === "uninstalled") return { key: "disconnected", label: "Disconnected", tone: "neutral" };
  if (syncing || conn.syncing) return { key: "syncing", label: "Syncing", tone: "info" };
  if (conn.status === "error" || conn.needsReconnect || conn.lastSyncStatus === "failed" || (conn.attentionCount || 0) > 0) {
    return { key: "attention", label: "Needs attention", tone: "warning" };
  }
  if (conn.status === "active") return { key: "active", label: "Active", tone: "success" };
  return { key: "disconnected", label: conn.status || "Unknown", tone: "neutral" };
}

/** Friendly labels for the per-run counts shown in the run-detail modal, in display order. */
export const RUN_COUNT_LABELS = [
  ["inScope", "In scope"],
  ["matched", "Matched"],
  ["pushed", "Stock pushed"],
  ["createdProducts", "Products created"],
  ["createdVariants", "Variants created"],
  ["pricesPushed", "Prices pushed"],
  ["compareAtPushed", "Compare-at pushed"],
  ["salesLeft", "Sales preserved"],
  ["contentPushed", "Content pushed"],
  ["optionsRenamed", "Options renamed"],
  ["optionValuesFixed", "Option values fixed"],
  ["imagesPushed", "Images added"],
  ["variantImagesLinked", "Variant images linked"],
  ["publishedProducts", "Published"],
  ["unmatched", "Unmatched"],
  ["failed", "Failed"],
];

/** Compact "what changed" chips for a run row, from its counts. Tone marks the severity. */
export function runResultChips(counts) {
  if (!counts) return [];
  const c = counts;
  const chips = [];
  const add = (key, label, tone = "neutral") => { if (c[key]) chips.push({ key, label, value: c[key], tone }); };
  add("createdProducts", "Created");
  add("pricesPushed", "Prices");
  add("compareAtPushed", "Compare-at");
  add("salesLeft", "Sale preserved");
  add("contentPushed", "Content");
  add("imagesPushed", "Images");
  add("variantImagesLinked", "Variant images");
  add("publishedProducts", "Published");
  add("unmatched", "Unmatched", "warning");
  add("failed", "Failed", "danger");
  return chips;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** A stable per-connection key: the Mongo id for a real store, the domain for the demo store. */
export const connKey = (c) => c._id || c.shopDomain;
/** Store name without the ".myshopify.com" suffix. */
export const shopLabel = (domain) => (domain || "").replace(/\.myshopify\.com$/, "") || domain || "—";
/** What a store is called in the UI: its display name, else the bare domain. */
export const storeName = (c) => (c?.displayName && c.displayName.trim()) || shopLabel(c?.shopDomain);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

/** "7 Jun 2026, 06:42 UTC" — deterministic UTC so SSR and client agree. */
export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** "7 Jun 2026" */
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "08:30 UTC" for today (per `nowTs`), else "7 Jun, 08:30". `nowTs` 0 = unknown → full form. */
export function fmtTimeShort(iso, nowTs = 0) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  if (nowTs) {
    const n = new Date(nowTs);
    if (n.getUTCFullYear() === d.getUTCFullYear() && n.getUTCMonth() === d.getUTCMonth() && n.getUTCDate() === d.getUTCDate()) {
      return `${hm} UTC`;
    }
  }
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hm}`;
}

/** "10 minutes ago" — relative to `nowTs` (0 = unknown → absolute date). */
export function relTime(iso, nowTs = 0) {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (!nowTs) return fmtDate(iso);
  const s = Math.floor((nowTs - d.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return "a few seconds ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

export const fmtNum = (n) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function fmtDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Price factor ──────────────────────────────────────────────────────────────
// The multiplier every pushed price is run through. Keeps up to 6 decimals so an exchange rate
// stays exact; `1` means "leave prices as they are".
export const PRICE_FACTOR_DECIMALS = 6;

/** Parses typed input into a stored factor — tolerates "11,4" / "11." and never persists ≤ 0. */
export const parsePriceFactor = (text) => {
  const n = Number(String(text ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 1;
  const p = 10 ** PRICE_FACTOR_DECIMALS;
  return Math.round(Math.min(n, 1_000_000) * p) / p;
};
export const formatPriceFactor = (n) => String(parsePriceFactor(n));

/**
 * Merges the catalogue's real pricelists with a source's stored priority/enabled state: stored
 * names still in the catalogue keep their order + flag; new pricelists are appended; names gone
 * from the catalogue are dropped. Falls back to the demo template when the catalogue is empty.
 */
export function buildPricelistPriority(available, stored) {
  if (!available?.length) return MOCK_PRICELISTS.map((p, i) => ({ ...p, priority: i }));
  const byName = new Map(available.map((p) => [p.name, p]));
  const storedByName = new Map((stored || []).map((p) => [p.name, p]));
  const orderedNames = (stored || [])
    .filter((s) => byName.has(s.name))
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
    .map((s) => s.name);
  const newNames = available.filter((p) => !storedByName.has(p.name)).map((p) => p.name);
  return [...orderedNames, ...newNames].map((name, idx) => {
    const a = byName.get(name);
    const s = storedByName.get(name);
    return { _id: name, name, vat: a?.vat ?? 0, valid_from: a?.valid_from ?? null, enabled: s ? s.enabled !== false : true, priority: idx };
  });
}

/** Human name of a source scope (export name or feed brand). */
export function sourceName(scope, exportOptions = [], feedOptions = []) {
  if (!scope) return "Source";
  if (scope.type === "own_source") return feedOptions.find((f) => f.feedId === scope.feedId)?.brand || "Feed";
  return exportOptions.find((x) => x._id === scope.exportConfigId)?.name || "Export";
}
export const sourceKind = (scope) => (scope?.type === "own_source" ? "Feed" : "Patrik");

/* -------------------------------------------------------------------------- */
/*  Demo fallback data (only when the connections fetch failed)                */
/* -------------------------------------------------------------------------- */

export const MOCK_PRICELISTS = [
  { _id: "pl_rrp2026", name: "RRP 2026", enabled: true, vat: 0, valid_from: "2025-10-31T22:00:00Z" },
  { _id: "pl_rrp2025", name: "RRP 2025", enabled: true, vat: 22, valid_from: "2025-08-07T22:00:00Z" },
  { _id: "pl_outlet2026", name: "Outlet Spring 2026", enabled: true, vat: 22, valid_from: "2026-02-01T00:00:00Z" },
  { _id: "pl_partner_net", name: "Partner Net", enabled: false, vat: 0, valid_from: "2024-01-01T00:00:00Z" },
];

export const DEFAULT_SCOPE_CONFIG = {
  ownership: "stock_only",
  syncStock: true, syncNewProducts: false, syncPrices: false, syncDescriptions: false, syncImages: false, syncTags: true,
  priceVatMode: "inclusive", priceFactor: 1, priceRounding: { ...DEFAULT_PRICE_ROUNDING }, futureDatedGuard: true,
  compareAtPricelist: null, priceFields: DEFAULT_PRICE_FIELDS, existingSalePolicy: DEFAULT_EXISTING_SALE_POLICY,
  variantOptionName: "", titlePrefix: "", publicationIds: [], reviewNewProducts: false,
};

export const MOCK_CONNECTION = {
  shopDomain: "patrik-international.myshopify.com",
  status: "active",
  scopes: SCOPES,
  shopifyLocationId: "gid://shopify/Location/79283711",
  installedAt: "2026-03-14T09:21:00Z",
  lastSyncAt: "2026-06-07T06:42:18Z",
  lastSyncStatus: "done",
  config: {
    ...DEFAULT_SCOPE_CONFIG, ownership: "portal_authoritative", syncPrices: true, syncDescriptions: true, pricelistPriority: MOCK_PRICELISTS,
    scopes: [
      { type: "export_config", exportConfigId: "demo_export_1", locationId: "gid://shopify/Location/79283711", ownership: "portal_authoritative", syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncTags: true, syncImages: true, aiExportId: "demo_ai_1" },
      { type: "export_config", exportConfigId: "demo_export_2", locationId: "gid://shopify/Location/79283712", ownership: "create_then_handoff", syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncTags: false, syncImages: true, titlePrefix: "UNIFIBER -" },
    ],
  },
};

// Demo-only source options, so the sources section has something to show when the API is down.
export const MOCK_EXPORTS = [
  { _id: "demo_export_1", name: "recharge all products", option1Name: "Size" },
  { _id: "demo_export_2", name: "Unifiber" },
];
export const MOCK_AI_EXPORTS = [{ _id: "demo_ai_1", name: "Recharge categories" }];

export const MOCK_CONNECTION_2 = {
  shopDomain: "patrik-outlet.myshopify.com",
  status: "active",
  scopes: SCOPES,
  shopifyLocationId: "gid://shopify/Location/79283712",
  installedAt: "2026-05-02T11:05:00Z",
  lastSyncAt: "2026-06-06T18:10:00Z",
  lastSyncStatus: "done",
  config: { ...MOCK_CONNECTION.config, ownership: "create_then_handoff" },
};

export const MOCK_LOCATIONS = [
  { id: "gid://shopify/Location/79283711", name: "Main Warehouse" },
  { id: "gid://shopify/Location/79283712", name: "Ljubljana Store" },
  { id: "gid://shopify/Location/79283713", name: "Dropship Hub" },
];

export const MOCK_SYNC_JOBS = [
  { id: "j1", type: "Portal authoritative", label: "4,581 / 4,581 stock", trigger: "manual", status: "partial", attempts: 1, time: "2026-06-07T06:42:10Z", startedAt: "2026-06-07T06:40:02Z", finishedAt: "2026-06-07T06:42:10Z", counts: { inScope: 4581, matched: 4581, pushed: 4581, contentPushed: 324, imagesPushed: 3, unmatched: 1, salesLeft: 1 } },
  { id: "j2", type: "Stock", label: "4,580 / 4,581 stock", trigger: "schedule", status: "done", attempts: 1, time: "2026-06-06T06:41:55Z", startedAt: "2026-06-06T06:40:20Z", finishedAt: "2026-06-06T06:41:55Z", counts: { inScope: 4581, matched: 4581, pushed: 4580 } },
  { id: "j3", type: "Create + hand off", label: "12 / 12 stock", trigger: "manual", status: "running", attempts: 1, time: "2026-06-07T06:42:30Z", startedAt: "2026-06-07T06:42:30Z", counts: { inScope: 12 } },
  { id: "j4", type: "Stock", label: "Nothing in scope", trigger: "webhook", status: "failed", attempts: 3, time: "2026-06-05T06:38:47Z", startedAt: "2026-06-05T06:38:40Z", finishedAt: "2026-06-05T06:38:47Z", error: "429 THROTTLED — backing off (Retry-After 4s)", counts: { inScope: 0 } },
];

export const MOCK_UNMATCHED = [
  { sku: "P02250013133", parentCode: "CHASE_DW_X_DOWNWIND", reason: "No SKU / barcode match in store", tone: "red" },
  { sku: "WFG-6M", parentCode: "WING_FREEWING_GO", reason: "Variant is not inventory-tracked in Shopify", tone: "amber" },
  { sku: "PCP-160", parentCode: "PADDLE_CARBON_PRO", reason: "Duplicate SKU found in store", tone: "red" },
];

export const MOCK_COUNTS = { synced: 1284, pending: 17, error: 6 };

export const MOCK_DELETED_IN_STORE = [
  { parentCode: "WING_FREEWING_GO", skus: ["WFG-4M", "WFG-5M", "WFG-6M"], deletedInStoreAt: "2026-06-09T08:12:00Z", recreateRequested: false },
];

/* -------------------------------------------------------------------------- */
/*  Client-only "now" (avoids hydration drift for relative times)              */
/* -------------------------------------------------------------------------- */

// One shared minute ticker (an external store, so no setState-in-effect): the snapshot is 0 on
// the server and during hydration, then the real clock — relative labels fall back to absolute
// dates until the client takes over, and every consumer re-renders together once a minute.
const nowListeners = new Set();
let nowCache = 0;
let nowTimer = null;
function subscribeNow(cb) {
  nowListeners.add(cb);
  if (!nowTimer) {
    nowTimer = setInterval(() => { nowCache = Date.now(); nowListeners.forEach((l) => l()); }, 60_000);
  }
  return () => {
    nowListeners.delete(cb);
    if (!nowListeners.size && nowTimer) { clearInterval(nowTimer); nowTimer = null; }
  };
}
const getNow = () => nowCache || (nowCache = Date.now());
const getServerNow = () => 0;
/** Client-side "now" that ticks once a minute; 0 during SSR/hydration. */
export function useNow() {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                 */
/* -------------------------------------------------------------------------- */

const BADGE_TONES = {
  success: "bg-emerald-500/10 text-emerald-fg border-emerald-500/20",
  info: "bg-cyan-500/10 text-cyan-fg border-cyan-500/20",
  warning: "bg-amber-500/10 text-amber-fg border-amber-500/20",
  danger: "bg-red-500/10 text-red-fg border-red-500/25",
  neutral: "bg-muted text-muted-foreground border-transparent",
  brand: "bg-accent-brand/10 text-accent-brand border-accent-brand/20",
};
export const DOT_TONES = {
  success: "bg-emerald-fg", info: "bg-cyan-fg", warning: "bg-amber-fg", danger: "bg-red-fg", neutral: "bg-muted-foreground/60", brand: "bg-accent-brand",
};

export function Badge({ tone = "neutral", className, children, ...rest }) {
  return (
    <span className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap", BADGE_TONES[tone] || BADGE_TONES.neutral, className)} {...rest}>
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral", pulse = false, className }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)} aria-hidden="true">
      {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", DOT_TONES[tone])} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", DOT_TONES[tone] || DOT_TONES.neutral)} />
    </span>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />;
}

/** Button built from the admin recipes: variant default|outline|ghost|destructive, size default|sm|xs|icon-sm. */
export function Button({ variant = "outline", size = "sm", className, children, loading = false, disabled, type = "button", ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} className={cn(btn.base, btn.variant[variant], btn.size[size], className)} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

/** Toggle switch — plain `bg-primary` when on, like the admin's switch. */
export function Toggle({ checked, onChange, ariaLabel, disabled, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input dark:bg-input/80"
      )}
    >
      <span aria-hidden="true" className={cn("pointer-events-none block size-4 rounded-full bg-background shadow-xs transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

/** Segmented radio group (VAT mode, price fields, sale policy). */
export function Segmented({ value, onChange, options, ariaLabel, disabled, className }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex max-w-full flex-wrap gap-0.5 rounded-md bg-muted p-0.5", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-[5px] px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              on ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Label + control + optional hint. */
export function Field({ label, hint, htmlFor, children, className, right }) {
  return (
    <div className={cn("min-w-0", className)}>
      {(label || right) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">{label}</label>}
          {right}
        </div>
      )}
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Short inline note (info | warning). */
export function Note({ tone = "info", children, className }) {
  return (
    <p className={cn("rounded-md border px-3 py-2 text-xs leading-relaxed", tone === "warning" ? "border-amber-500/25 bg-amber-500/[0.06] text-amber-fg-softer dark:text-amber-fg" : "border-border bg-muted/50 text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/** Section card: compact header row (title · count · actions) over a body. */
export function Section({ id, title, count, countTone = "neutral", description, actions, children, className, bodyClassName, tone }) {
  return (
    <section id={id} className={cn("scroll-mt-20 rounded-xl border bg-card", tone === "danger" ? "border-red-500/30" : "border-border", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          {count != null && <Badge tone={countTone}>{fmtNum(count)}</Badge>}
          {description && <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </header>
      {description && <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground sm:hidden">{description}</p>}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Stat: small label over a number. */
export function Stat({ label, value, tone, hint }) {
  const color = tone === "danger" ? "text-red-fg" : tone === "warning" ? "text-amber-fg" : tone === "success" ? "text-emerald-fg" : "text-foreground";
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold leading-tight tabular-nums", color)} title={hint}>{value}</div>
    </div>
  );
}

/** Dashed empty state. */
export function Empty({ title, children, action, className }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-input bg-muted/30 px-4 py-6 text-center", className)}>
      <p className="text-sm text-foreground">{title}</p>
      {children && <p className="mt-1 text-xs text-muted-foreground">{children}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ n = 3, h = "h-12", className }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => <div key={i} className={cn("skeleton rounded-lg", h)} />)}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

const MODAL_SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-3xl" };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal shell: full-height sheet on phones, centered panel on desktop. Locks body scroll, closes on
 * Escape / overlay click (unless `locked`), traps Tab inside and restores focus on close.
 */
export function Modal({ onClose, title, description, size = "md", children, footer, locked = false, headerRight, bodyClassName, zIndex = "z-[60]", titleAdornment }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement;
    return () => {
      document.body.style.overflow = prev;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
    };
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector("[data-autofocus]") || panel.querySelector(FOCUSABLE);
    (first || panel).focus({ preventScroll: true });
  }, []);

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !locked) { e.stopPropagation(); onClose?.(); return; }
    if (e.key !== "Tab") return;
    const nodes = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []).filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={cn("fixed inset-0 flex bg-black/50 sm:items-center sm:justify-center sm:p-4", zIndex)} onMouseDown={(e) => { if (e.target === e.currentTarget && !locked) onClose?.(); }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn("flex h-full w-full flex-col overflow-hidden bg-background shadow-lg outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border sm:border-border", MODAL_SIZES[size] || MODAL_SIZES.md)}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 id={titleId} className={cn(dialog.title, "truncate text-[15px]")}>{title}</h2>
              {titleAdornment}
            </div>
            {description && <p id={descId} className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {headerRight}
            <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className={cn(btn.base, btn.variant.ghost, btn.size["icon-sm"], "text-muted-foreground")}>
              <X />
            </button>
          </div>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---------------------------------- Menu ----------------------------------- */

/**
 * Overflow (•••) menu. Items: { label, icon, onSelect, href, danger, disabled, target }. Renders
 * a portaled listbox anchored to the trigger; arrow keys / Escape / outside click all work.
 */
export function Menu({ items, label = "More actions", align = "end", triggerClassName, size = "icon-sm", children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(-1);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const enabled = items.filter((i) => i && !i.hidden);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 200;
    const left = align === "end" ? Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)) : Math.max(8, r.left);
    const below = window.innerHeight - r.bottom > 240;
    setPos({ left, top: below ? r.bottom + 6 : null, bottom: below ? null : window.innerHeight - r.top + 6, width });
  };
  const openMenu = () => { place(); setActive(-1); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelectorAll("[role=menuitem]")[active]?.focus();
  }, [open, active]);

  const select = (item) => {
    if (item.disabled) return;
    setOpen(false);
    btnRef.current?.focus();
    item.onSelect?.();
  };
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); btnRef.current?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % enabled.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + enabled.length) % enabled.length); }
    else if (e.key === "Tab") setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        title={label}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => { if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); openMenu(); setActive(0); } }}
        className={cn(btn.base, btn.variant.ghost, btn.size[size], "text-muted-foreground", triggerClassName)}
      >
        {children || <MoreHorizontal />}
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          id={listId}
          ref={listRef}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          style={{ position: "fixed", left: pos.left, top: pos.top ?? undefined, bottom: pos.bottom ?? undefined, width: pos.width }}
          className={cn(popover, "animate-dropdown z-[999]")}
        >
          {enabled.map((item, i) => {
            const cls = cn(menuItem, "w-full text-left", item.danger ? "text-red-fg hover:bg-red-500/10 hover:text-red-fg" : "", item.disabled ? "pointer-events-none opacity-50" : "", "focus-visible:bg-accent focus-visible:text-accent-foreground", "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground", item.danger ? "[&_svg]:text-red-fg" : "");
            if (item.href) {
              return (
                <a key={i} role="menuitem" href={item.href} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined} tabIndex={-1} onClick={() => setOpen(false)} className={cls}>
                  {item.icon}{item.label}
                </a>
              );
            }
            return (
              <button key={i} role="menuitem" type="button" tabIndex={-1} disabled={item.disabled} onClick={() => select(item)} className={cls}>
                {item.icon}{item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

/* ---------------------------------- Toast ---------------------------------- */

export function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm shadow-lg",
            t.tone === "success" ? "border-emerald-500/20 bg-emerald-tint text-emerald-fg-soft" : t.tone === "error" ? "border-red-500/20 bg-red-tint text-red-fg-soft" : "border-border bg-card text-foreground"
          )}
        >
          <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", t.tone === "success" ? "bg-emerald-500/20 text-emerald-fg" : t.tone === "error" ? "bg-red-500/20 text-red-fg" : "bg-accent")}>
            {t.tone === "error" ? <X className="size-3" /> : <Check className="size-3" />}
          </span>
          <span className="min-w-0 flex-1 leading-snug">{t.text}</span>
          <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss" className="shrink-0 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Collapsible group inside a modal (progressive disclosure). */
export function Disclosure({ title, summary, open, onToggle, children, disabled, disabledNote }) {
  const id = useId();
  return (
    <div className={cn("rounded-lg border border-border", disabled && "opacity-70")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-lg"
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-foreground">{title}</span>
          {summary && !open && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={id} className="border-t border-border px-3 py-3">
          {disabled && disabledNote && <Note className="mb-3">{disabledNote}</Note>}
          <fieldset disabled={disabled} className={cn("m-0 min-w-0 border-0 p-0", disabled && "pointer-events-none")}>{children}</fieldset>
        </div>
      )}
    </div>
  );
}

/** Official full-colour Shopify bag mark, inlined so it stays sharp at any size. */
export const ShopifyLogo = ({ title = "Shopify", ...p }) => (
  <svg viewBox="0 0 122.5 139.5" role="img" aria-label={title} {...p}>
    <path fill="#95BF47" d="M118.8,28.5c-0.1-0.8-0.8-1.2-1.4-1.2c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-1-1-2.9-0.7-3.6-0.5c-0.1,0-1.9,0.6-5,1.5c-3-8.7-8.3-16.7-17.7-16.7c-0.3,0-0.5,0-0.8,0c-2.7-3.5-6-5.1-8.9-5.1C45.1-4.5,34.7,22.7,31.4,36.5c-8.5,2.6-14.6,4.5-15.3,4.8c-4.8,1.5-4.9,1.6-5.5,6.1C10.1,50.8,0,128.7,0,128.7l78.6,14.7l42.6-9.2C121.2,134.2,118.9,29.3,118.8,28.5z M81.1,19.3c-2.4,0.7-5.1,1.6-8,2.5c0-0.6,0-1.2,0-1.8c0-5.4-0.7-9.7-1.9-13.2C75.9,7.4,79.1,12.7,81.1,19.3z M64.7,7.9c1.4,3.4,2.2,8.3,2.2,14.9c0,0.3,0,0.6,0,0.9c-5.3,1.6-11,3.4-16.8,5.2C53.4,16.2,59.6,9.9,64.7,7.9z M58.1,1.6c0.9,0,1.9,0.3,2.8,0.9c-6.7,3.2-13.9,11.1-17,26.9c-4.6,1.4-9,2.8-13.1,4C34.6,21.1,43.4,1.6,58.1,1.6z" />
    <path fill="#5E8E3E" d="M117.4,27.3c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-0.4-0.4-0.9-0.6-1.4-0.6l-5.9,127.8l42.6-9.2c0,0-18.3-123.6-18.4-124.5C120.2,28.5,118.5,27.4,117.4,27.3z" />
    <path fill="#FFFFFF" d="M71.5,46.4l-5.3,15.7c0,0-4.6-2.5-10.3-2.5c-8.3,0-8.7,5.2-8.7,6.5c0,7.1,18.6,9.9,18.6,26.6c0,13.2-8.3,21.6-19.6,21.6c-13.5,0-20.4-8.4-20.4-8.4l3.6-11.9c0,0,7.1,6.1,13.1,6.1c3.9,0,5.5-3.1,5.5-5.3c0-9.3-15.2-9.7-15.2-25c0-12.9,9.3-25.4,28-25.4c7.2,0,10.7,2,10.7,2C71.1,44.5,71.5,46.4,71.5,46.4z" />
  </svg>
);
