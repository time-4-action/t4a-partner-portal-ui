/**
 * ShopifyIntegrationPage Component
 *
 * Partner-facing UI for connecting one or more Shopify stores to the T4A Partner Portal and
 * configuring each store's one-way product push (stock, products, prices, descriptions, images).
 *
 * A single portal user can connect any number of Shopify stores. Each store is an independent
 * connection with its own token, sync config, location, sales channels and product map. The page
 * is split into three parts:
 *
 *   • {@link ShopifyIntegrationPage} — the orchestrator: brand header, the store switcher, the
 *     shared result banner, and either the connect screen or the selected store's panel.
 *   • {@link ConnectionPanel}        — everything for ONE store: status, ownership, what-to-sync,
 *     pricing, products/location, sales channels, sync activity, needs-attention, disconnect.
 *     Keyed by connection id so switching stores remounts it with a clean slate. It lazy-loads
 *     its own live locations/channels (GET …/detail) and sync activity (GET …/activity).
 *   • {@link ConnectStore}           — the "connect a (another) store" screen: enter a myshopify
 *     domain → start real OAuth, with the security/trust rail.
 *
 * Real API surface: /api/export/shopify/* (connect, connections, connection/:id/detail,
 * …/config, …/sync, …/activity, disconnect). The MOCK_* constants are used ONLY as a demo
 * fallback when the connections fetch failed (no real ids), so the page still renders something.
 *
 * @module ShopifyIntegrationPage
 */

"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Client-only "now" snapshot (server = 0, client = a single cached timestamp) — lets us
// flag future-dated pricelists without a hydration mismatch, a setState-in-effect, or an
// impure Date.now() call during render. Cached so the snapshot is stable across renders.
const noopSubscribe = () => () => {};
let cachedNow = 0;
const getNowSnapshot = () => cachedNow || (cachedNow = Date.now());
const getServerNowSnapshot = () => 0;

/* -------------------------------------------------------------------------- */
/*  Mock data (demo fallback only — used when the connections fetch failed)    */
/* -------------------------------------------------------------------------- */

// OAuth scopes — rendered in BOTH states (requested when disconnected, granted when
// connected) from a single source so the two views can never drift apart.
const SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_locations",
];

const MOCK_CONNECTION = {
  shopDomain: "patrik-international.myshopify.com",
  status: "active", // "active" | "uninstalled" | "error"
  scopes: SCOPES,
  shopifyLocationId: "gid://shopify/Location/79283711", // -> "Main Warehouse"
  installedAt: "2026-03-14T09:21:00Z",
  lastSyncAt: "2026-06-07T06:42:18Z",
  lastSyncStatus: "done", // "done" | "failed" | "running"
  config: {
    exportConfigId: null, // seeded from the first available export config at mount
    priceVatMode: "inclusive", // "inclusive" | "exclusive"
    futureDatedGuard: true,
    syncStock: true,
    syncNewProducts: true,
    syncPrices: true,
    syncDescriptions: true,
    syncImages: false, // OFF by default — image sync is slow (Shopify fetches + processes each URL)
    ownership: "stock_only", // "stock_only" | "portal_authoritative" | "create_then_handoff"
    pricelistPriority: [
      { _id: "pl_rrp2026", name: "RRP 2026", enabled: true, vat: 0, valid_from: "2025-10-31T22:00:00Z" },
      { _id: "pl_rrp2025", name: "RRP 2025", enabled: true, vat: 22, valid_from: "2025-08-07T22:00:00Z" },
      { _id: "pl_outlet2026", name: "Outlet Spring 2026", enabled: true, vat: 22, valid_from: "2026-02-01T00:00:00Z" },
      { _id: "pl_partner_net", name: "Partner Net", enabled: false, vat: 0, valid_from: "2024-01-01T00:00:00Z" },
      { _id: "pl_legacy2024", name: "Legacy 2024", enabled: false, vat: 22, valid_from: "2024-01-01T00:00:00Z" },
    ],
  },
};

// Shopify inventory locations (would come from read_locations).
const MOCK_LOCATIONS = [
  { id: "gid://shopify/Location/79283711", name: "Main Warehouse" },
  { id: "gid://shopify/Location/79283712", name: "Ljubljana Store" },
  { id: "gid://shopify/Location/79283713", name: "Dropship Hub" },
];

// Recent sync jobs — deliberately spans all five job states so the demo looks alive.
const MOCK_SYNC_JOBS = [
  { id: "j1", type: "inventory", parentCode: "CHASE_DW_X_DOWNWIND", variantCode: "P02250013077", status: "done", attempts: 1, time: "2026-06-07T06:42:10Z", error: null },
  { id: "j2", type: "product_update", parentCode: "FOIL_AERO_900", variantCode: null, status: "done", attempts: 1, time: "2026-06-07T06:41:55Z", error: null },
  { id: "j3", type: "product_create", parentCode: "WING_FREEWING_GO", variantCode: "WFG-4M", status: "running", attempts: 1, time: "2026-06-07T06:42:30Z", error: null },
  { id: "j4", type: "image", parentCode: "BOARD_GO_FOIL", variantCode: null, status: "queued", attempts: 0, time: "2026-06-07T06:43:00Z", error: null },
  { id: "j5", type: "inventory", parentCode: "PADDLE_CARBON_PRO", variantCode: "PCP-180", status: "retry", attempts: 2, time: "2026-06-07T06:40:12Z", error: "429 THROTTLED — backing off (Retry-After 4s)" },
  { id: "j6", type: "product_update", parentCode: "LEASH_COILED_10", variantCode: "LC10-BLK", status: "failed", attempts: 5, time: "2026-06-07T06:38:47Z", error: "productUpdate: variant not found for SKU LC10-BLK" },
];

// Unmatched SKUs / failed products — each with a distinct, actionable reason.
const MOCK_UNMATCHED = [
  { sku: "P02250013133", parentCode: "CHASE_DW_X_DOWNWIND", reason: "No SKU / barcode match in store", tone: "red" },
  { sku: "WFG-6M", parentCode: "WING_FREEWING_GO", reason: "New products disabled — create skipped", tone: "amber" },
  { sku: "PCP-160", parentCode: "PADDLE_CARBON_PRO", reason: "Duplicate SKU found in store", tone: "red" },
];

// Aggregate of shopify_product_map state (separate from the visible job rows above).
const MOCK_COUNTS = { synced: 1284, pending: 17, error: 6 };

// A second demo store so the switcher itself is demonstrable when the fetch fails.
const MOCK_CONNECTION_2 = {
  shopDomain: "patrik-outlet.myshopify.com",
  status: "active",
  scopes: SCOPES,
  shopifyLocationId: "gid://shopify/Location/79283712",
  installedAt: "2026-05-02T11:05:00Z",
  lastSyncAt: "2026-06-06T18:10:00Z",
  lastSyncStatus: "done",
  config: { ...MOCK_CONNECTION.config, ownership: "create_then_handoff" },
};

const SYNC_FLAGS = [
  { key: "syncStock", label: "Stock", desc: "Push live inventory quantities to your store." },
  { key: "syncNewProducts", label: "New products", desc: "Create products that don't exist in your store yet." },
  { key: "syncPrices", label: "Prices", desc: "Keep variant prices in step with your pricelists." },
  { key: "syncDescriptions", label: "Descriptions", desc: "Sync titles, copy and product fields." },
  { key: "syncTags", label: "Tags", desc: "Push tags — for Patrik sources these come from its AI categorization." },
  { key: "syncImages", label: "Images", desc: "Push product and variant images.", slow: true },
];

const OWNERSHIP_MODES = [
  {
    value: "create_then_handoff",
    title: "Create, then hand off",
    recommended: true,
    desc: "Creates each product once, then only keeps stock in sync.",
  },
  {
    value: "stock_only",
    title: "Stock only",
    desc: "Only updates inventory quantities. Never touches your titles, prices, or descriptions.",
  },
  {
    value: "portal_authoritative",
    title: "Portal authoritative",
    desc: "Overwrites portal-managed fields on every sync.",
    warn: "Any edits you make to title, description, price or images in Shopify will be overwritten on the next sync.",
  },
];

const JOB_TYPE_LABEL = {
  inventory: "Inventory",
  product_create: "Create",
  product_update: "Update",
  image: "Image",
};

const JOB_STATUS_TONE = {
  done: "cyan",
  running: "cyan",
  queued: "neutral",
  retry: "amber",
  partial: "amber",
  failed: "red",
};

/* ---- sync-activity row accessors (tolerate real API rows AND the demo mock shape) ---- */
// Real rows carry { label, detail, trigger }; the demo mock carries { parentCode, variantCode, error }.
const jobItem = (j) => j.label ?? j.variantCode ?? j.parentCode ?? "—";
const jobSub = (j) => (j.label ? j.trigger : j.variantCode ? j.parentCode : null);
const jobDetail = (j) => j.detail ?? j.error ?? null;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// A stable per-connection key: the Mongo id for a real store, the domain for the demo store.
const connKey = (c) => c._id || c.shopDomain;
// The store name without the ".myshopify.com" suffix, for the compact switcher pills.
const shopLabel = (domain) => (domain || "").replace(/\.myshopify\.com$/, "") || domain || "—";

const STATUS_META = {
  active: { tone: "cyan", label: "Active" },
  error: { tone: "red", label: "Error" },
  uninstalled: { tone: "amber", label: "Uninstalled" },
};
const statusMetaFor = (status) => STATUS_META[status] || { tone: "neutral", label: status };

const DOT_COLOR = { cyan: "#01a0be", red: "#f87171", amber: "#fbbf24", neutral: "#737373" };

/* -------------------------------------------------------------------------- */
/*  Formatting helpers (deterministic UTC — avoids SSR/client hydration drift) */
/* -------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm} UTC`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Friendly labels for the per-run counts shown in the run-detail modal, in display order.
const RUN_COUNT_LABELS = [
  ["inScope", "In scope"],
  ["matched", "Matched"],
  ["pushed", "Stock pushed"],
  ["createdProducts", "Products created"],
  ["createdVariants", "Variants created"],
  ["pricesPushed", "Prices pushed"],
  ["contentPushed", "Content pushed"],
  ["imagesPushed", "Images added"],
  ["variantImagesLinked", "Variant images linked"],
  ["publishedProducts", "Published"],
  ["unmatched", "Unmatched"],
  ["failed", "Failed"],
];

// Merge the catalogue's real pricelists with the connection's stored priority/enabled state:
// stored names (still in the catalogue) keep their order + enabled flag; newly-seen pricelists
// are appended newest-first; names no longer in the catalogue are dropped. Each row carries
// vat + valid_from from the catalogue for display. Falls back to the demo template only when the
// catalogue returned no pricelists (e.g. the fetch failed) so the panel isn't blank.
function buildPricelistPriority(available, stored) {
  if (!available?.length) return MOCK_CONNECTION.config.pricelistPriority;
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
    return {
      _id: name,
      name,
      vat: a?.vat ?? 0,
      valid_from: a?.valid_from ?? null,
      enabled: s ? s.enabled !== false : true,
      priority: idx,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Icons (heroicons outline, strokeWidth 1.5)                                 */
/* -------------------------------------------------------------------------- */

const Svg = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} />
);

const BagIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
  </Svg>
);
const RefreshIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </Svg>
);
const GripIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);
const InfoIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </Svg>
);
const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </Svg>
);
const SaveIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h10.5Z" />
  </Svg>
);
const TrashIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </Svg>
);
const CheckIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </Svg>
);
const WarningIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </Svg>
);
const ShieldIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 5.25-3.75 8.25-8.625 9.6a1.5 1.5 0 0 1-.75 0C6.75 20.25 3 17.25 3 12V6.75a1.5 1.5 0 0 1 .96-1.4l7.5-2.81a1.5 1.5 0 0 1 1.08 0l7.5 2.81a1.5 1.5 0 0 1 .96 1.4V12Z" />
  </Svg>
);
const PlusIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </Svg>
);
const SpinnerIcon = (p) => (
  <svg className={`animate-spin ${p.className || ""}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// Official full-colour Shopify "bag" logo, inlined so it stays razor-sharp at any size and
// needs no next.config remote-image allow-listing (the wordmark PNG would). The two greens
// + white "S" are the Shopify brand mark; the surrounding UI keeps the portal's cyan accent.
const ShopifyLogo = ({ title = "Shopify", ...p }) => (
  <svg viewBox="0 0 122.5 139.5" role="img" aria-label={title} {...p}>
    <path
      fill="#95BF47"
      d="M118.8,28.5c-0.1-0.8-0.8-1.2-1.4-1.2c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-1-1-2.9-0.7-3.6-0.5c-0.1,0-1.9,0.6-5,1.5c-3-8.7-8.3-16.7-17.7-16.7c-0.3,0-0.5,0-0.8,0c-2.7-3.5-6-5.1-8.9-5.1C45.1-4.5,34.7,22.7,31.4,36.5c-8.5,2.6-14.6,4.5-15.3,4.8c-4.8,1.5-4.9,1.6-5.5,6.1C10.1,50.8,0,128.7,0,128.7l78.6,14.7l42.6-9.2C121.2,134.2,118.9,29.3,118.8,28.5z M81.1,19.3c-2.4,0.7-5.1,1.6-8,2.5c0-0.6,0-1.2,0-1.8c0-5.4-0.7-9.7-1.9-13.2C75.9,7.4,79.1,12.7,81.1,19.3z M64.7,7.9c1.4,3.4,2.2,8.3,2.2,14.9c0,0.3,0,0.6,0,0.9c-5.3,1.6-11,3.4-16.8,5.2C53.4,16.2,59.6,9.9,64.7,7.9z M58.1,1.6c0.9,0,1.9,0.3,2.8,0.9c-6.7,3.2-13.9,11.1-17,26.9c-4.6,1.4-9,2.8-13.1,4C34.6,21.1,43.4,1.6,58.1,1.6z"
    />
    <path
      fill="#5E8E3E"
      d="M117.4,27.3c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-0.4-0.4-0.9-0.6-1.4-0.6l-5.9,127.8l42.6-9.2c0,0-18.3-123.6-18.4-124.5C120.2,28.5,118.5,27.4,117.4,27.3z"
    />
    <path
      fill="#FFFFFF"
      d="M71.5,46.4l-5.3,15.7c0,0-4.6-2.5-10.3-2.5c-8.3,0-8.7,5.2-8.7,6.5c0,7.1,18.6,9.9,18.6,26.6c0,13.2-8.3,21.6-19.6,21.6c-13.5,0-20.4-8.4-20.4-8.4l3.6-11.9c0,0,7.1,6.1,13.1,6.1c3.9,0,5.5-3.1,5.5-5.3c0-9.3-15.2-9.7-15.2-25c0-12.9,9.3-25.4,28-25.4c7.2,0,10.7,2,10.7,2C71.1,44.5,71.5,46.4,71.5,46.4z"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Reusable primitives                                                       */
/* -------------------------------------------------------------------------- */

const BADGE_TONES = {
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  neutral: "bg-neutral-700/40 text-neutral-300 border-neutral-600/40",
};

function StatusBadge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone] || BADGE_TONES.neutral}`}>
      {children}
    </span>
  );
}

function PingDot({ tone = "cyan" }) {
  const color = tone === "red" ? "#f87171" : tone === "amber" ? "#fbbf24" : tone === "neutral" ? "#737373" : "#01a0be";
  const ping = tone === "cyan";
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {ping && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
      )}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

/** Toggle switch — input + track only. Wrap in (or place inside) a <label> to make it clickable. */
function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <span className="relative inline-flex items-center shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={ariaLabel} className="sr-only peer" />
      <span
        aria-hidden="true"
        className="w-10 h-6 rounded-full bg-neutral-700 transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[16px]"
      />
    </span>
  );
}

/**
 * Themed dropdown that keeps the native-<select> API (accepts <option> children and fires
 * onChange({ target: { value } })) but renders a fully-styled, theme-matched menu instead of
 * the OS's grey native popup. Accessible: real listbox semantics, click-outside + Escape to
 * close, and arrow / Home / End / Enter keyboard navigation.
 */
function Select({ value, onChange, ariaLabel, disabled, children }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // keyboard-highlighted index
  const [rect, setRect] = useState(null); // button viewport rect → fixed-positioned menu
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  // Flatten <option> children into plain descriptors so we can render our own rows.
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((el) => ({
      value: el.props.value ?? "",
      label: typeof el.props.children === "string" ? el.props.children : String(el.props.children ?? ""),
      disabled: !!el.props.disabled,
    }));

  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const isPlaceholder = !selected || selected.value === "";

  // While open: close on outside click (the menu is portaled to <body>, so check both refs),
  // and keep the menu pinned to the button as the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const inRoot = rootRef.current?.contains(e.target);
      const inList = listRef.current?.contains(e.target);
      if (!inRoot && !inList) setOpen(false);
    };
    const sync = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [open]);

  // Open the menu, highlighting the current selection (or the first selectable row).
  const openMenu = () => {
    const cur = options.findIndex((o) => String(o.value) === String(value ?? ""));
    setActive(cur >= 0 ? cur : options.findIndex((o) => !o.disabled));
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const commit = (opt) => {
    if (opt.disabled) return;
    onChange?.({ target: { value: opt.value } });
    setOpen(false);
  };

  const step = (dir) => {
    setActive((cur) => {
      let i = cur;
      for (let n = 0; n < options.length; n++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i].disabled) return i;
      }
      return cur;
    });
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        step(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        step(-1);
        break;
      case "Home":
        e.preventDefault();
        setActive(options.findIndex((o) => !o.disabled));
        break;
      case "End":
        e.preventDefault();
        setActive(options.map((o) => !o.disabled).lastIndexOf(true));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[active]) commit(options[active]);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-neutral-900/60 px-4 py-3.5 text-left text-sm backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "border-[#01a0be]/60 ring-1 ring-[#01a0be]/20" : "border-neutral-700 hover:border-neutral-600"
        }`}
      >
        <span className={`truncate ${isPlaceholder ? "text-neutral-500" : "text-white"}`}>
          {selected ? selected.label : options[0]?.label ?? ""}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180 text-[#01a0be]" : ""}`}
        />
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
          }}
          className="animate-dropdown z-[999] max-h-64 overflow-auto rounded-xl border border-neutral-700 bg-neutral-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {options.map((o, i) => {
            const isSel = String(o.value) === String(value ?? "");
            const isActive = i === active;
            return (
              <li
                key={`${o.value}-${i}`}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onClick={() => commit(o)}
                onMouseEnter={() => !o.disabled && setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  o.disabled
                    ? "cursor-default text-neutral-600"
                    : isActive
                      ? "bg-[#01a0be]/15 text-white"
                      : "text-neutral-300"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && !o.disabled && <CheckIcon className="h-4 w-4 shrink-0 text-[#01a0be]" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

function SectionHeading({ title, desc, icon, right }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon}
          {title}
        </h2>
        {desc && <p className="mt-1 text-sm text-neutral-400">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orchestrator — header, store switcher, banner, connect-or-panel           */
/* -------------------------------------------------------------------------- */

export default function ShopifyIntegrationPage({
  initialExports = [],
  ownerEmail,
  // Every store the user has connected (GET /shopify/connections). `null` means the fetch
  // failed → fall back to a two-store demo so the page still renders something rich. An empty
  // array means the user simply has no stores yet → show the connect screen.
  initialConnections = null,
  // Distinct catalogue pricelists [{ name, vat, valid_from }] (GET /shopify/pricelists). Drives
  // each store's pricing-panel priority list with REAL names — replaces the old mock template.
  initialPricelists = [],
  // The user's Own Source feeds (GET /external/sources) — offered as an alternative push scope
  // ("Own source" vs a Patrik export config) in each store's Products-to-sync selector.
  initialFeeds = [],
  // Exports with AI categorization enabled (GET /exports) — a Patrik source can pick one and
  // its AI categories are pushed as Shopify tags for that source.
  initialAiExports = [],
}) {
  const isDemo = initialConnections === null;
  const seedConnections = isDemo ? [MOCK_CONNECTION, MOCK_CONNECTION_2] : initialConnections;

  const [connections, setConnections] = useState(seedConnections);
  const [selectedKey, setSelectedKey] = useState(() => {
    const active = seedConnections.find((c) => c.status === "active") || seedConnections[0];
    return active ? connKey(active) : null;
  });
  // When true, the connect screen is shown even though stores exist ("connect another store").
  const [adding, setAdding] = useState(seedConnections.length === 0);
  const [notice, setNotice] = useState(null); // { tone: "success" | "error", text }
  // Store name (bare, no .myshopify.com) to prefill the connect form — set when Shopify's App URL
  // (GET /shopify/entry) routes a not-yet-connected store here with `?connect=1&shop=`.
  const [connectPrefill, setConnectPrefill] = useState("");
  // Full *.myshopify.com domain to auto-resume connecting — set when a partner opens the app from
  // Shopify for a store that isn't connected yet. Shows a focused card that launches OAuth.
  const [resumeShop, setResumeShop] = useState("");

  const showConnect = adding || connections.length === 0;
  const selected =
    connections.find((c) => connKey(c) === selectedKey) || connections[0] || null;

  // Handle the params the portal can arrive with, then strip them so a refresh doesn't replay:
  //   • OAuth outcome — the API redirects back with `?shopify=connected|error` after install.
  //   • Entry routing — Shopify's App URL (GET /shopify/entry) sends a merchant here with
  //     `?shop=<domain>` (already connected → select that store) and, when the store isn't
  //     connected yet, `?connect=1` (open the connect form with the domain prefilled).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("shopify");
    const shopParam = params.get("shop");        // full *.myshopify.com domain
    const wantConnect = params.get("connect") === "1";
    if (!outcome && !shopParam && !wantConnect) return;

    let msg = null;
    if (outcome === "connected") {
      msg = {
        tone: "success",
        text: params.get("webhooks") === "partial"
          ? "Store connected. Some webhooks could not be registered — they'll be retried."
          : "Store connected successfully.",
      };
    } else if (outcome === "error") {
      msg = { tone: "error", text: `Connection failed (${params.get("reason") || "unknown error"}).` };
    }

    if (shopParam || wantConnect) {
      const match = shopParam ? connections.find((c) => c.shopDomain === shopParam) : null;
      if (match) {
        // Already connected (or just finished connecting) → jump to that store.
        setSelectedKey(connKey(match));
        setAdding(false);
      } else if (shopParam) {
        // Opened from Shopify for a store that isn't connected → focused auto-resume (launches
        // OAuth). Also stash the prefill so cancelling drops to the manual form, store filled in.
        setResumeShop(shopParam);
        setConnectPrefill(shopLabel(shopParam));
      } else if (wantConnect) {
        // "Connect another store" with no specific shop → the manual connect form.
        setAdding(true);
      }
    }

    const url = new URL(window.location.href);
    ["shopify", "shop", "webhooks", "reason", "connect", "host", "hmac", "timestamp", "session", "id_token", "embedded", "locale"]
      .forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));

    if (msg) queueMicrotask(() => setNotice(msg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect a finished sync / status change up onto the matching switcher pill.
  const patchConnection = (key, patch) =>
    setConnections((list) => list.map((c) => (connKey(c) === key ? { ...c, ...patch } : c)));

  // Drop a disconnected store and re-point the selection (or fall back to the connect screen).
  // `notice` is overridable so a lazily-detected uninstall (vs an explicit disconnect) can
  // explain itself differently.
  const handleDisconnected = (key, notice = { tone: "success", text: "Store disconnected." }) => {
    const next = connections.filter((c) => connKey(c) !== key);
    setConnections(next);
    if (next.length === 0) setAdding(true);
    else if (key === selectedKey) setSelectedKey(connKey(next[0]));
    setNotice(notice);
  };

  const selectStore = (key) => {
    setAdding(false);
    setResumeShop("");
    setNotice(null);
    setSelectedKey(key);
  };

  const startAddStore = () => {
    setResumeShop("");
    setConnectPrefill("");
    setAdding(true);
    setNotice(null);
  };

  return (
    <div className="pb-40 sm:pb-32">
      {/* ----------------------------- Header ----------------------------- */}
      {/* Compact header — small icon + title + badge on one line, matching the Export / Own Sources pages. */}
      <header className="mb-6 flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#95BF47]/30 bg-[#95BF47]/10">
          <ShopifyLogo className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Shopify</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#01a0be]/25 bg-[#01a0be]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#01a0be]">
              <BagIcon className="h-3 w-3" />
              Integration
            </span>
          </div>
          <p className="truncate text-xs text-neutral-500">
            One-way push of stock, products, prices and images from the portal straight to your Shopify stores.
          </p>
        </div>
      </header>

      {/* --------------------------- Store switcher ---------------------------- */}
      {connections.length > 0 && (
        <nav aria-label="Connected stores" className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {connections.map((c) => {
              const key = connKey(c);
              const active = key === selectedKey && !adding;
              const meta = statusMetaFor(c.status);
              const label = shopLabel(c.shopDomain);
              return (
                <button
                  key={key}
                  onClick={() => selectStore(key)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    active
                      ? "bg-gradient-to-br from-neutral-800 to-neutral-800/30 shadow-lg"
                      : "hover:bg-neutral-800/50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                      active
                        ? "bg-gradient-to-br from-[#95BF47]/30 to-[#01a0be]/25 text-white"
                        : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200"
                    }`}
                  >
                    {label.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 pr-1">
                    <span className={`block max-w-[12rem] truncate text-sm font-semibold ${active ? "text-white" : "text-neutral-300"}`}>
                      {label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DOT_COLOR[meta.tone] || DOT_COLOR.neutral }} />
                      {meta.label}
                    </span>
                  </span>
                </button>
              );
            })}

            <div className="mx-1 h-9 w-px shrink-0 bg-neutral-800" />

            <button
              onClick={startAddStore}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                adding ? "bg-[#01a0be]/10 text-[#01a0be] ring-1 ring-[#01a0be]/40" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed transition-colors ${
                adding ? "border-[#01a0be]/50" : "border-neutral-700 group-hover:border-[#01a0be]/50"
              }`}>
                <PlusIcon className="h-4 w-4" />
              </span>
              Add store
            </button>
          </div>
        </nav>
      )}

      {notice && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "border-[#95BF47]/30 bg-[#95BF47]/10 text-[#b6df84]"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 text-current/70 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {resumeShop ? (
        <ResumeConnect
          shopDomain={resumeShop}
          onNotice={setNotice}
          onCancel={() => {
            setResumeShop("");
            setConnectPrefill(shopLabel(resumeShop));
            setAdding(true);
          }}
        />
      ) : showConnect ? (
        <ConnectStore
          canCancel={connections.length > 0}
          onCancel={() => setAdding(false)}
          onNotice={setNotice}
          initialDomain={connectPrefill}
        />
      ) : (
        <ConnectionPanel
          key={selectedKey}
          connection={selected}
          exportOptions={initialExports}
          feedOptions={initialFeeds}
          aiExportOptions={initialAiExports}
          pricelists={initialPricelists}
          onNotice={setNotice}
          onDisconnected={handleDisconnected}
          onPatch={patchConnection}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ResumeConnect — focused auto-launch when arriving from Shopify's App URL    */
/* -------------------------------------------------------------------------- */

// A partner opened the app from their Shopify admin for a store that isn't connected yet. They
// already expressed intent, so we don't drop them on the settings page — we show a focused card
// and auto-launch the OAuth install (cancelable) after a short, visible beat.
function ResumeConnect({ shopDomain, onNotice, onCancel }) {
  const label = shopLabel(shopDomain);
  const [status, setStatus] = useState("counting"); // "counting" | "launching" | "error"
  const launchedRef = useRef(false);

  const launch = async () => {
    if (launchedRef.current) return;
    launchedRef.current = true;
    setStatus("launching");
    try {
      const res = await fetch(`/nextapi/export/shopify/connect?shop=${encodeURIComponent(shopDomain)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return; // navigating away to Shopify's consent screen
      }
      onNotice?.({ tone: "error", text: data.error || "Could not start the Shopify connection." });
      launchedRef.current = false;
      setStatus("error");
    } catch {
      onNotice?.({ tone: "error", text: "Could not reach the server to start the connection." });
      launchedRef.current = false;
      setStatus("error");
    }
  };

  // Auto-launch after a short beat so the user sees what's happening (and can cancel).
  useEffect(() => {
    const t = setTimeout(launch, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center backdrop-blur-sm">
        <div className="relative mx-auto mb-6 w-fit">
          <div aria-hidden="true" className="absolute -inset-3 rounded-[1.75rem] bg-[#95BF47]/20 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-gradient-to-br from-[#16210f] via-neutral-900 to-neutral-950 shadow-lg shadow-[#5E8E3E]/20">
            <ShopifyLogo className="h-9 w-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />
          </div>
        </div>

        {status === "error" ? (
          <>
            <h2 className="text-xl font-semibold text-white">Couldn&apos;t start the connection</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Something went wrong reaching Shopify for <span className="font-semibold text-white">{label}</span>. Try again, or enter the store manually.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={launch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f]"
              >
                <RefreshIcon className="h-4 w-4" />
                Try again
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white"
              >
                Enter store manually
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">Connecting your store</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Taking you to Shopify to approve the install for{" "}
              <span className="font-semibold text-white">{label}</span>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#01a0be]">
              <SpinnerIcon className="h-4 w-4" />
              {status === "launching" ? "Redirecting to Shopify…" : "Starting…"}
            </div>
            <button
              onClick={onCancel}
              className="mt-6 text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-300 hover:underline"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConnectStore — enter a domain and start OAuth (first or additional store)  */
/* -------------------------------------------------------------------------- */

function ConnectStore({ canCancel, onCancel, onNotice, initialDomain = "" }) {
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [connecting, setConnecting] = useState(false);

  const domainClean = domainInput.trim().toLowerCase();
  const domainValid = /^[a-z0-9][a-z0-9-]*$/.test(domainClean);

  // Start OAuth: ask the backend for the Shopify authorize URL, then redirect the browser to it.
  // Shopify sends the user back to the API callback, which redirects to this page with
  // `?shopify=connected` (handled by the banner effect + the fresh connections list on reload).
  const connect = async () => {
    if (!domainValid || connecting) return;
    setConnecting(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connect?shop=${encodeURIComponent(domainClean)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return; // navigating away
      }
      onNotice({ tone: "error", text: data.error || "Could not start the Shopify connection." });
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to start the connection." });
    }
    setConnecting(false);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* left: connect + how it works */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="relative mb-6 w-fit">
              <div aria-hidden="true" className="absolute -inset-2 rounded-2xl bg-[#95BF47]/20 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-gradient-to-br from-[#16210f] via-neutral-900 to-neutral-950 shadow-lg shadow-[#5E8E3E]/20">
                <ShopifyLogo className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
            {canCancel && (
              <button
                onClick={onCancel}
                className="rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
              >
                Back to stores
              </button>
            )}
          </div>
          <h2 className="text-xl font-semibold text-white">
            {canCancel ? "Connect another store" : "Connect your Shopify store"}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-400">
            Install the portal app on your store with a single approval. No API keys to copy, no manual setup — once
            connected, choose what to sync and the portal keeps it current. You can connect as many stores as you like.
          </p>

          <div className="mt-6 max-w-lg">
            <label htmlFor="shop-domain" className="mb-2 block text-sm font-medium text-neutral-300">Your store domain</label>
            <div className="flex overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900/60 transition-colors focus-within:border-[#01a0be]/50">
              <input
                id="shop-domain"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                placeholder="your-store"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
              />
              <span className="flex select-none items-center whitespace-nowrap border-l border-neutral-700 px-3 text-sm text-neutral-500">
                .myshopify.com
              </span>
            </div>
            <p className={`mt-2 text-xs ${domainInput && !domainValid ? "text-amber-400" : "text-neutral-500"}`}>
              {domainInput && !domainValid
                ? "Use only lowercase letters, numbers and hyphens — just the store name."
                : "Enter just your store name — we'll add .myshopify.com for you."}
            </p>

            <button
              onClick={connect}
              disabled={!domainValid || connecting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {connecting ? <SpinnerIcon className="h-4 w-4" /> : <BagIcon className="h-4 w-4" />}
              {connecting ? "Redirecting to Shopify…" : "Connect Shopify"}
            </button>
          </div>

          {/* how it works */}
          <ol className="mt-8 grid grid-cols-1 gap-4 border-t border-neutral-800 pt-6 sm:grid-cols-3">
            {[
              "Enter your store domain",
              "Approve the install on Shopify",
              "Choose what to sync and go live",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-neutral-400">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* right: trust rail */}
      <aside className="space-y-6 lg:sticky lg:top-20">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white">What gets synced</h3>
          <ul className="mt-4 space-y-3">
            {SYNC_FLAGS.map((f) => (
              <li key={f.key} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-200">{f.label}</span>
                    {f.slow && <StatusBadge tone="amber">Slow</StatusBadge>}
                  </div>
                  <p className="text-xs text-neutral-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
            One-way push only — we never read or change your orders.
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldIcon className="h-4 w-4 text-[#01a0be]" />
            Secure by design
          </h3>
          <ul className="mt-4 space-y-3">
            {[
              "OAuth install — no manual API keys to copy or store.",
              "Tokens are encrypted at rest and never logged.",
              "Least-privilege scopes only.",
              "Every callback and webhook is HMAC-verified.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-neutral-400">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Scopes requested</p>
          <div className="flex flex-wrap gap-1.5">
            {SCOPES.map((s) => (
              <StatusBadge key={s} tone="cyan">{s}</StatusBadge>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConnectionPanel — full management UI for ONE connected store               */
/* -------------------------------------------------------------------------- */

function ConnectionPanel({ connection: initialConn, exportOptions, feedOptions = [], aiExportOptions = [], pricelists, onNotice, onDisconnected, onPatch }) {
  const isDemo = !initialConn._id;
  const myKey = connKey(initialConn);

  // Build a fresh config object from a connection + the live data we know about so far.
  // `validate` only kicks in once live locations/publications have loaded (drops a stale stored
  // location / a removed channel); before that we trust the stored values to avoid a flicker.
  const makeConfig = (conn, locs, pubs, validate) => {
    const cfg = conn.config || MOCK_CONNECTION.config;
    const storedLoc = conn.shopifyLocationId ?? cfg.shopifyLocationId ?? null;
    const locationId = validate
      ? (locs.some((l) => l.id === storedLoc) ? storedLoc : (locs[0]?.id ?? (isDemo ? storedLoc : null)))
      : storedLoc;
    const validLoc = (id) => (validate ? (locs.some((l) => l.id === id) ? id : (locs[0]?.id ?? null)) : (id ?? locationId));
    const validPubs = (ids) => (ids || []).filter((id) => (validate ? pubs.some((p) => p.id === id) : true));

    // Connection-level config doubles as the default for a source that doesn't set its own (so a
    // legacy single-scope connection migrates its ownership/toggles/pricing into its one source).
    const base = {
      ownership: cfg.ownership ?? "stock_only",
      syncStock: cfg.syncStock ?? true,
      syncNewProducts: cfg.syncNewProducts ?? false,
      syncPrices: cfg.syncPrices ?? false,
      syncDescriptions: cfg.syncDescriptions ?? false,
      syncImages: cfg.syncImages ?? false,
      syncTags: cfg.syncTags ?? true,
      priceVatMode: cfg.priceVatMode ?? "inclusive",
      futureDatedGuard: cfg.futureDatedGuard ?? true,
    };
    // Builds one source's full, panel-ready config (rich pricelistPriority, validated channels).
    const withCfg = (s, inheritBase) => {
      const pick = (k) => (s[k] !== undefined ? s[k] : (inheritBase ? base[k] : base[k]));
      return {
        type: s.type, exportConfigId: s.exportConfigId, feedId: s.feedId,
        locationId: validLoc(s.locationId ?? locationId),
        ownership: pick("ownership"), syncStock: pick("syncStock"), syncNewProducts: pick("syncNewProducts"),
        syncPrices: pick("syncPrices"), syncDescriptions: pick("syncDescriptions"), syncImages: pick("syncImages"),
        syncTags: pick("syncTags"), priceVatMode: pick("priceVatMode"), futureDatedGuard: pick("futureDatedGuard"),
        pricelistPriority: buildPricelistPriority(pricelists, s.pricelistPriority ?? (inheritBase ? cfg.pricelistPriority : undefined)),
        publicationIds: validPubs(s.publicationIds ?? (inheritBase ? cfg.publicationIds : [])),
        aiExportId: s.aiExportId,
      };
    };
    const scopes = (() => {
      if (Array.isArray(cfg.scopes) && cfg.scopes.length) return cfg.scopes.map((s) => withCfg(s, false));
      if (cfg.scope) return [withCfg({ ...cfg.scope, locationId }, true)];
      if (cfg.exportConfigId) return [withCfg({ type: "export_config", exportConfigId: cfg.exportConfigId, locationId }, true)];
      return [];
    })();

    // Top-level fields are the MIRROR of the active (first) source — the rich panels read these.
    const active = scopes[0] || { ...base, pricelistPriority: buildPricelistPriority(pricelists, cfg.pricelistPriority), publicationIds: validPubs(cfg.publicationIds) };
    return {
      ...MOCK_CONNECTION.config,
      ...cfg,
      ownership: active.ownership, syncStock: active.syncStock, syncNewProducts: active.syncNewProducts,
      syncPrices: active.syncPrices, syncDescriptions: active.syncDescriptions, syncImages: active.syncImages,
      syncTags: active.syncTags, priceVatMode: active.priceVatMode, futureDatedGuard: active.futureDatedGuard,
      pricelistPriority: active.pricelistPriority,
      publicationIds: active.publicationIds,
      exportConfigId: cfg.exportConfigId ?? exportOptions[0]?._id ?? null,
      scope: cfg.scope ?? (cfg.exportConfigId ? { type: "export_config", exportConfigId: cfg.exportConfigId } : null),
      scopes,
      shopifyLocationId: active.locationId ?? locationId,
    };
  };

  const [connection, setConnection] = useState(initialConn);
  const [locations, setLocations] = useState(isDemo ? MOCK_LOCATIONS : []);
  const [publications, setPublications] = useState([]);
  const [publishingEnabled, setPublishingEnabled] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  // Live store data (locations + channels) is ready: immediately for the demo, after the
  // /detail fetch for a real store.
  const [detailLoaded, setDetailLoaded] = useState(isDemo);

  const [config, setConfig] = useState(() => makeConfig(initialConn, isDemo ? MOCK_LOCATIONS : [], [], isDemo));
  const [savedConfig, setSavedConfig] = useState(() => makeConfig(initialConn, isDemo ? MOCK_LOCATIONS : [], [], isDemo));
  // Which source row the config panels (ownership / what-to-sync / pricing / channels) are editing.
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);
  // When set, the per-source config modal is open for that source index (null = closed).
  const [editingScopeIdx, setEditingScopeIdx] = useState(null);

  // Sync-activity data. Real once a live connection exists (fetched from /activity); the MOCK_*
  // set is only the demo fallback.
  const [syncJobs, setSyncJobs] = useState(isDemo ? MOCK_SYNC_JOBS : []);
  const [counts, setCounts] = useState(isDemo ? MOCK_COUNTS : { synced: 0, pending: 0, error: 0 });
  const [unmatched, setUnmatched] = useState(isDemo ? MOCK_UNMATCHED : []);
  // Run-history modal (the panel itself shows only the latest few runs) + per-run detail modal.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyJobs, setHistoryJobs] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailJob, setDetailJob] = useState(null);

  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragging, setDragging] = useState(false);
  const draggingIdxRef = useRef(null);
  const listRef = useRef(null);

  const nowTs = useSyncExternalStore(noopSubscribe, getNowSnapshot, getServerNowSnapshot);

  const jobSeq = useRef(0);
  // False after unmount — guards async sync polling from setting state on a gone component.
  const aliveRef = useRef(true);
  // Track pending demo timeouts so they can be cleared if the component unmounts mid-flight.
  const timers = useRef([]);
  const schedule = (fn, ms) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  };
  // Reset on (re)mount, not just initialization. Under React Strict Mode (on by default in Next
  // dev) a component is mounted → unmounted → remounted on the same fiber, so the unmount cleanup
  // sets this false; without re-setting it true on the remount it would stay false forever and the
  // /detail fetch below would skip setDetailLoaded(true) → stuck on "Loading locations…".
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  // Pulls the live sync-activity (recent runs + counts + needs-attention) for a real
  // connection. No-op in demo mode. Returns the parsed payload (or null) so callers polling a
  // running job can inspect it.
  const loadActivity = async () => {
    if (isDemo) return null;
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/activity`, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!aliveRef.current) return data;
      setSyncJobs(data.jobs ?? []);
      setCounts(data.counts ?? { synced: 0, pending: 0, error: 0 });
      setUnmatched(data.unmatched ?? []);
      return data;
    } catch {
      return null;
    }
  };

  // Opens the run-history modal: the panel only ever shows the latest few runs, so this pulls
  // a longer window (?limit=100). Demo store just reuses its mock rows.
  const openHistory = async () => {
    setHistoryOpen(true);
    if (isDemo) {
      setHistoryJobs(syncJobs);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/activity?limit=100`, { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      if (aliveRef.current) setHistoryJobs(data?.jobs ?? syncJobs);
    } catch {
      if (aliveRef.current) setHistoryJobs(syncJobs);
    } finally {
      if (aliveRef.current) setHistoryLoading(false);
    }
  };

  // On mount (real store only): load the live locations + sales channels, then re-seed the
  // config with validation, and fetch the sync activity. The demo store skips all of this.
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/nextapi/export/shopify/connection/${initialConn._id}/detail`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !aliveRef.current) return;
        // The server detected the app was uninstalled in Shopify (token revoked) and marked the
        // connection accordingly — drop it from the switcher rather than showing a dead store.
        if (data.uninstalled) {
          onDisconnected?.(myKey, {
            tone: "error",
            text: `${shopLabel(initialConn.shopDomain)} was uninstalled in Shopify — removed from your stores.`,
          });
          return;
        }
        const locs = data.locations ?? [];
        const pubs = data.publications ?? [];
        const conn = data.connection ? { ...initialConn, ...data.connection } : initialConn;
        setLocations(locs);
        setPublications(pubs);
        setPublishingEnabled(Boolean(data.publishingEnabled));
        setNeedsReconnect(Boolean(data.needsReconnect));
        setConnection(conn);
        const reseeded = makeConfig(conn, locs, pubs, true);
        setConfig(reseeded);
        setSavedConfig(reseeded);
      } catch {
        /* keep the optimistic seed */
      } finally {
        if (!cancelled && aliveRef.current) setDetailLoaded(true);
      }
    })();
    loadActivity();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock the page behind the per-source config modal so the wheel can't scroll the background
  // when the modal's own scroll area reaches its edge (works with `overscroll-contain` below).
  useEffect(() => {
    if (editingScopeIdx === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [editingScopeIdx]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  /* ----- per-source config: the panels edit the SELECTED source ----- */
  // Each source carries its OWN full push config. The rich panels below stay bound to top-level
  // `config` (a mirror of the active source); every mutation is written straight back into the
  // selected scope via `mirrorActive`, and selecting a source loads its config into the mirror.
  const sourceScopes = config.scopes || [];
  const activeIdx = Math.min(activeScopeIdx, Math.max(0, sourceScopes.length - 1));
  const activeScope = sourceScopes[activeIdx] || null;
  const MIRROR_KEYS = ["ownership", "syncStock", "syncNewProducts", "syncPrices", "syncDescriptions", "syncImages", "syncTags", "priceVatMode", "futureDatedGuard", "pricelistPriority", "publicationIds"];
  const pickMirror = (c) => Object.fromEntries(MIRROR_KEYS.map((k) => [k, c[k]]));
  // After any change to a mirrored field, copy the whole set into the active scope.
  const mirrorActive = (c) => ({ ...c, scopes: (c.scopes || []).map((s, i) => (i === activeIdx ? { ...s, ...pickMirror(c) } : s)) });

  /* ----- config mutators (all route through setConfig -> mark dirty) ----- */
  const setCfg = (patch) => setConfig((c) => mirrorActive({ ...c, ...patch }));
  const toggleFlag = (key) => setConfig((c) => mirrorActive({ ...c, [key]: !c[key] }));
  // Picking a mode richer than stock-only opts THIS source up to the full push, so default every
  // sync field ON. Only fires when leaving stock_only — switching between the two rich modes
  // preserves whatever the partner has toggled.
  const setOwnership = (v) =>
    setConfig((c) =>
      mirrorActive(
        v !== "stock_only" && c.ownership === "stock_only"
          ? { ...c, ownership: v, syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncImages: true, syncTags: true }
          : { ...c, ownership: v }
      )
    );
  const setVatMode = (v) => setConfig((c) => mirrorActive({ ...c, priceVatMode: v }));
  const togglePublication = (id) =>
    setConfig((c) => {
      const ids = c.publicationIds || [];
      return mirrorActive({ ...c, publicationIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
    });

  /* ----- multi-source scopes (each source → its own location + full config) ----- */
  const setScopes = (next) => setConfig((c) => ({ ...c, scopes: next, shopifyLocationId: next[0]?.locationId ?? c.shopifyLocationId }));
  // Loads a scope's stored config into the mirror so the panels show THAT source's settings.
  const selectScope = (idx) => {
    setActiveScopeIdx(idx);
    setConfig((c) => {
      const s = (c.scopes || [])[idx];
      if (!s) return c;
      const mirror = {};
      for (const k of MIRROR_KEYS) if (s[k] !== undefined) mirror[k] = s[k];
      mirror.pricelistPriority = buildPricelistPriority(pricelists, s.pricelistPriority);
      mirror.publicationIds = s.publicationIds || [];
      return { ...c, ...mirror };
    });
  };
  // A brand-new source starts at safe stock-only defaults (independent of the others).
  const newScopeDefaults = () => ({
    locationId: locations[0]?.id ?? null,
    ownership: "stock_only", syncStock: true, syncNewProducts: false, syncPrices: false,
    syncDescriptions: false, syncImages: false, syncTags: true,
    priceVatMode: "inclusive", futureDatedGuard: true,
    pricelistPriority: buildPricelistPriority(pricelists, []), publicationIds: [],
  });
  const addScope = () => {
    const first = exportOptions[0]
      ? { type: "export_config", exportConfigId: exportOptions[0]._id }
      : (feedOptions[0] ? { type: "own_source", feedId: feedOptions[0].feedId } : { type: "export_config" });
    const next = [...sourceScopes, { ...first, ...newScopeDefaults() }];
    setScopes(next);
    selectScope(next.length - 1);
  };
  const setScopeSource = (i, val) => {
    const sep = val.indexOf(":");
    const kind = val.slice(0, sep);
    const id = val.slice(sep + 1);
    setScopes(sourceScopes.map((s, idx) => idx !== i ? s
      : (kind === "feed" ? { ...s, type: "own_source", feedId: id, exportConfigId: undefined } : { ...s, type: "export_config", exportConfigId: id, feedId: undefined })));
  };
  const setScopeLocation = (i, locId) => setScopes(sourceScopes.map((s, idx) => idx === i ? { ...s, locationId: locId } : s));
  // Per-source AI categorization (Patrik sources only): its categories are pushed as tags.
  const setScopeAi = (i, id) => setScopes(sourceScopes.map((s, idx) => idx === i ? { ...s, aiExportId: id || undefined } : s));
  const removeScope = (i) => {
    const next = sourceScopes.filter((_, idx) => idx !== i);
    setScopes(next);
    if (activeIdx >= next.length) selectScope(Math.max(0, next.length - 1));
  };

  const togglePricelist = (index) =>
    setConfig((c) => mirrorActive({
      ...c,
      pricelistPriority: c.pricelistPriority.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p)),
    }));

  // Pointer-based reorder (works with mouse AND touch — native HTML5 drag never fires on touch).
  const beginDrag = (e, index) => {
    e.preventDefault();
    draggingIdxRef.current = index;
    setDraggingIdx(index);
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const from = draggingIdxRef.current;
      const container = listRef.current;
      if (from === null || !container) return;
      const rows = container.querySelectorAll("[data-pl-row]");
      const y = e.clientY;
      let to = null;
      if (from < rows.length - 1) {
        const r = rows[from + 1].getBoundingClientRect();
        if (y > r.top + r.height / 2) to = from + 1;
      }
      if (to === null && from > 0) {
        const r = rows[from - 1].getBoundingClientRect();
        if (y < r.top + r.height / 2) to = from - 1;
      }
      if (to !== null) {
        draggingIdxRef.current = to;
        setDraggingIdx(to);
        setConfig((c) => {
          const arr = [...c.pricelistPriority];
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return mirrorActive({ ...c, pricelistPriority: arr });
        });
      }
    };
    const onUp = () => {
      draggingIdxRef.current = null;
      setDraggingIdx(null);
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // mirrorActive/activeIdx are captured fresh per drag session (effect re-runs on `dragging`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  /* ----- commands ----- */

  // Re-run OAuth for this store to mint a fresh (refreshable) token. Used when the stored token
  // can no longer be refreshed (Shopify retired non-expiring tokens) or to widen scopes.
  const reconnect = async () => {
    if (connecting || !connection.shopDomain) return;
    setConnecting(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connect?shop=${encodeURIComponent(connection.shopDomain)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return; // navigating away
      }
      onNotice({ tone: "error", text: data.error || "Could not start the reconnect." });
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to reconnect." });
    }
    setConnecting(false);
  };

  // Disconnect: delete the stored token/connection on the backend, then tell the parent to drop
  // this store from the switcher. Does not uninstall the app from the merchant's Shopify admin.
  const disconnect = async () => {
    setConfirmDisconnect(false);
    if (connection._id) {
      try {
        await fetch(`/nextapi/export/shopify/connection/${connection._id}`, { method: "DELETE" });
      } catch {
        /* best-effort — still drop the store from the UI */
      }
    }
    onDisconnected(myKey);
  };

  const sleep = (ms) => new Promise((r) => schedule(r, ms));

  // Start a real stock sync, then poll /activity until the run leaves "running" (the push happens
  // in the background on the API). Falls back to a local demo animation in demo mode.
  const syncNow = async () => {
    if (isSyncing) return;

    if (isDemo) {
      setIsSyncing(true);
      const id = `job_${++jobSeq.current}`;
      const startedAt = new Date().toISOString();
      setSyncJobs((jobs) => [
        { id, type: "inventory", parentCode: "MANUAL_SYNC", variantCode: null, status: "running", attempts: 1, time: startedAt, error: null },
        ...jobs,
      ]);
      schedule(() => {
        const doneAt = new Date().toISOString();
        setSyncJobs((jobs) => jobs.map((j) => (j.id === id ? { ...j, status: "done", time: doneAt } : j)));
        setConnection((c) => ({ ...c, lastSyncAt: doneAt, lastSyncStatus: "done" }));
        setIsSyncing(false);
      }, 1800);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "REAUTH_REQUIRED") setNeedsReconnect(true);
        onNotice({ tone: "error", text: data.error || "Could not start the sync." });
        setIsSyncing(false);
        return;
      }
      const runId = data.job?.id;
      // Poll until the run completes (cap the wait so a stuck run can't spin forever).
      for (let i = 0; i < 40 && aliveRef.current; i++) {
        await sleep(1500);
        const activity = await loadActivity();
        const run = activity?.jobs?.find((j) => j.id === runId);
        if (run && run.status !== "running") {
          const lastSyncStatus = run.status === "failed" ? "failed" : "done";
          setConnection((c) => ({ ...c, lastSyncAt: run.time, lastSyncStatus }));
          onPatch(myKey, { lastSyncAt: run.time, lastSyncStatus });
          const summary =
            run.status === "failed"
              ? `Sync failed${run.detail ? ` — ${run.detail}` : "."}`
              : run.status === "partial"
                ? `Sync finished with items needing attention${run.detail ? ` (${run.detail}).` : "."}`
                : "Sync complete.";
          onNotice({ tone: run.status === "failed" ? "error" : "success", text: summary });
          break;
        }
      }
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to start the sync." });
    }
    if (aliveRef.current) setIsSyncing(false);
  };

  const refreshActivity = async () => {
    if (refreshing) return;
    setRefreshing(true);
    if (!isDemo) await loadActivity();
    else await sleep(700);
    if (aliveRef.current) setRefreshing(false);
  };

  // Persist the config to the backend (PUT /shopify/connection/:id/config). Optimistically marks
  // the form clean on success. Falls back to a local-only save in demo mode.
  const saveConfig = async () => {
    if (saving) return;
    if (isDemo) {
      setSavedConfig(config);
      return;
    }
    setSaving(true);
    try {
      const { pricelistPriority, priceVatMode, futureDatedGuard, syncStock, syncNewProducts,
        syncPrices, syncDescriptions, syncImages, ownership, scopes, publicationIds } = config;
      // Each source pushes with its OWN full config to its own location. Persist the cleaned
      // scopes (incl. per-source ownership / toggles / pricing / channels) and mirror the first
      // source's location onto the connection-level field (back-compat / summary line).
      const cleanScopes = (scopes || [])
        .filter((s) => s.locationId && (s.type === "own_source" ? s.feedId : s.exportConfigId))
        .map((s) => ({
          type: s.type,
          ...(s.type === "own_source" ? { feedId: s.feedId } : { exportConfigId: s.exportConfigId }),
          locationId: s.locationId,
          ownership: s.ownership ?? "stock_only",
          syncStock: s.syncStock ?? true,
          syncNewProducts: !!s.syncNewProducts,
          syncPrices: !!s.syncPrices,
          syncDescriptions: !!s.syncDescriptions,
          syncImages: !!s.syncImages,
          syncTags: s.syncTags ?? true,
          priceVatMode: s.priceVatMode ?? "inclusive",
          futureDatedGuard: s.futureDatedGuard ?? true,
          pricelistPriority: (s.pricelistPriority || []).map((p, i) => ({ name: p.name, enabled: p.enabled !== false, priority: p.priority ?? i })),
          publicationIds: s.publicationIds || [],
          ...(s.aiExportId ? { aiExportId: s.aiExportId } : {}),
        }));
      const shopifyLocationId = cleanScopes[0]?.locationId ?? config.shopifyLocationId ?? null;
      // Persist only the resolution-relevant fields of each pricelist (name/enabled/priority);
      // vat + valid_from are display-only and re-derived from the live catalogue on load.
      const minimalPricelistPriority = pricelistPriority.map((p, i) => ({
        name: p.name,
        enabled: p.enabled !== false,
        priority: p.priority ?? i,
      }));
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopifyLocationId,
          config: { pricelistPriority: minimalPricelistPriority, priceVatMode, futureDatedGuard,
            syncStock, syncNewProducts, syncPrices, syncDescriptions, syncImages, ownership, scopes: cleanScopes, publicationIds },
        }),
      });
      if (res.ok) {
        setSavedConfig(config);
        onNotice({ tone: "success", text: "Configuration saved." });
      } else {
        const data = await res.json().catch(() => ({}));
        onNotice({ tone: "error", text: data.error || "Could not save the configuration." });
      }
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to save." });
    }
    setSaving(false);
  };
  const discard = () => setConfig(savedConfig);

  const statusMeta = statusMetaFor(connection.status);
  const savedLocationName = locations.find((l) => l.id === savedConfig.shopifyLocationId)?.name || "—";
  const enabledPricelists = config.pricelistPriority.filter((p) => p.enabled).length;
  const attentionCount = unmatched.length;
  const stockOnly = config.ownership === "stock_only";
  const scopes = connection.scopes || [];

  /* ====================================================================== */
  return (
    <div className="space-y-6">
      {needsReconnect && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Reconnect needed</p>
              <p className="mt-0.5 text-amber-200/80">
                Shopify retired the older access token for this store. Reconnect to refresh permissions and resume syncing — your store data is untouched.
              </p>
            </div>
          </div>
          <button
            onClick={reconnect}
            disabled={connecting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {connecting ? <SpinnerIcon className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
            {connecting ? "Redirecting…" : "Reconnect Shopify"}
          </button>
        </div>
      )}

      {/* ---------------------- Connection summary --------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <PingDot tone={statusMeta.tone} />
              <h2 className="truncate text-xl font-semibold text-white">{connection.shopDomain}</h2>
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-neutral-500">Installed</dt>
                <dd className="mt-0.5 text-neutral-200">{fmtDate(connection.installedAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Last sync</dt>
                <dd className="mt-0.5 text-neutral-200">{fmtDateTime(connection.lastSyncAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Sync status</dt>
                <dd className="mt-1">
                  <StatusBadge tone={JOB_STATUS_TONE[connection.lastSyncStatus] || "neutral"}>
                    {connection.lastSyncStatus || "—"}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Location</dt>
                <dd className="mt-0.5 truncate text-neutral-200">{savedLocationName}</dd>
              </div>
            </dl>

            {scopes.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Granted scopes</p>
                <div className="flex flex-wrap gap-1.5">
                  {scopes.map((s) => (
                    <StatusBadge key={s} tone="cyan">{s}</StatusBadge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              {attentionCount > 0 ? (
                <a href="#needs-attention" className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300">
                  <WarningIcon className="h-4 w-4" />
                  {attentionCount} {attentionCount === 1 ? "item needs" : "items need"} attention
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckIcon className="h-4 w-4" />
                  All systems healthy
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSyncing ? <SpinnerIcon className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
              {isSyncing ? "Syncing…" : "Sync now"}
            </button>
          </div>
        </div>
      </section>

      {/* --------------------- Sources & locations --------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <SectionHeading title="Sources & locations" desc="Each source — a Patrik export or one of your own brand feeds — pushes to its own Shopify location, with its own settings. Pick a source to configure it below." />

        {(exportOptions.length === 0 && feedOptions.length === 0) ? (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 px-4 py-6 text-center">
            <p className="text-sm text-neutral-300">No products to sync yet.</p>
            <p className="mt-1 text-xs text-neutral-500">
              Create a <a href="/export" className="text-[#01a0be] hover:underline">Shopify export</a> or register an{" "}
              <a href="/integrations/own-sources" className="text-[#01a0be] hover:underline">Own Source feed</a> to choose what syncs.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sourceScopes.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 px-4 py-4 text-center text-sm text-neutral-400">
                No sources yet. Add one below.
              </p>
            )}
            {sourceScopes.map((s, i) => {
              const srcVal = s.type === "own_source" ? `feed:${s.feedId || ""}` : `export:${s.exportConfigId || ""}`;
              const name = s.type === "own_source"
                ? (feedOptions.find((f) => f.feedId === s.feedId)?.brand || "Feed")
                : (exportOptions.find((x) => x._id === s.exportConfigId)?.name || "Export");
              const modeLabel = (OWNERSHIP_MODES.find((m) => m.value === s.ownership)?.title) || "Stock only";
              const locName = locations.find((l) => l.id === s.locationId)?.name;
              const aiName = s.type !== "own_source" && s.aiExportId
                ? (aiExportOptions.find((x) => x._id === s.aiExportId)?.name || "AI")
                : null;
              const openEditor = () => { selectScope(i); setEditingScopeIdx(i); };
              return (
                <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-400">Source</label>
                      <Select ariaLabel="Source" value={srcVal} onChange={(e) => setScopeSource(i, e.target.value)}>
                        <option value="" disabled>Select a source…</option>
                        {exportOptions.map((x) => <option key={`e${x._id}`} value={`export:${x._id}`}>{`Patrik · ${x.name}`}</option>)}
                        {feedOptions.map((f) => <option key={`f${f.feedId}`} value={`feed:${f.feedId}`}>{`Feed · ${f.brand}${f.status === "paused" ? " (paused)" : ""}`}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-400">Shopify location</label>
                      <Select ariaLabel="Shopify location" value={s.locationId || ""} disabled={!detailLoaded} onChange={(e) => setScopeLocation(i, e.target.value)}>
                        {!detailLoaded && <option value="">Loading locations…</option>}
                        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openEditor}
                        className="inline-flex h-[50px] items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 text-sm font-medium text-neutral-200 transition-colors hover:border-[#01a0be]/50 hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Configure
                      </button>
                      <button
                        type="button"
                        onClick={() => removeScope(i)}
                        aria-label="Remove source"
                        title="Remove source"
                        className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-lg border border-neutral-700/60 bg-neutral-800/40 text-neutral-500 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* quick summary so each source's setup is legible at a glance */}
                  <p className="mt-2 text-xs text-neutral-500">
                    {modeLabel}{locName ? ` · ${locName}` : ""} · {[s.syncStock && "stock", s.syncPrices && "prices", s.syncDescriptions && "content", s.syncTags && "tags", s.syncImages && "images", s.syncNewProducts && "new"].filter(Boolean).join(", ") || "nothing selected"}
                    {aiName && <span className="text-cyan-500/90"> · AI tags: {aiName}</span>}
                  </p>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button" onClick={addScope} className="inline-flex items-center gap-1.5 rounded-lg bg-[#01a0be] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#018a9f]">
                <PlusIcon className="h-4 w-4" />
                Add source
              </button>
              <a href="/export" className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-[#01a0be]/50 hover:text-white">New export</a>
              <a href="/integrations/own-sources" className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-[#01a0be]/50 hover:text-white">Manage feeds</a>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Per-source config modal (Ownership / What-to-sync / Pricing / Channels) ---------- */}
      {editingScopeIdx !== null && activeScope && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6" onClick={() => setEditingScopeIdx(null)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-800 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white">
                  Configure {activeScope.type === "own_source"
                    ? (feedOptions.find((f) => f.feedId === activeScope.feedId)?.brand || "feed")
                    : (exportOptions.find((x) => x._id === activeScope.exportConfigId)?.name || "source")}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">Applies to this source only · close, then Save</p>
              </div>
              <button type="button" onClick={() => setEditingScopeIdx(null)} aria-label="Close" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* scrollable body — sections are light groups (the modal itself is the card) */}
            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-6">

      {/* ------------------------ Ownership mode ----------------------- */}
      <section>
        <SectionHeading
          title="Ownership mode"
          desc="How assertively the portal writes to products once they exist in this store."
        />
        <fieldset className="space-y-2.5">
          <legend className="sr-only">Ownership mode</legend>
          {OWNERSHIP_MODES.map((m) => {
            const selected = config.ownership === m.value;
            return (
              <label
                key={m.value}
                className={`flex cursor-pointer gap-3.5 rounded-xl border p-4 transition-colors ${
                  selected ? "border-[#01a0be] bg-[#01a0be]/5" : "border-neutral-800 bg-neutral-900/40 hover:border-[#01a0be]/40"
                }`}
              >
                <input type="radio" name={`ownership-${myKey}`} value={m.value} checked={selected} onChange={() => setOwnership(m.value)} className="sr-only" />
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? "border-[#01a0be]" : "border-neutral-600"}`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-[#01a0be]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{m.title}</span>
                    {m.recommended && <StatusBadge tone="cyan">Recommended</StatusBadge>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-400">{m.desc}</span>
                  {m.warn && selected && (
                    <span className="mt-2.5 block rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-400">
                      <span className="font-semibold">Heads up — </span>{m.warn}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      {/* ------------------------ What to sync ------------------------- */}
      <section className="border-t border-neutral-800 pt-8">
        <SectionHeading title="What to sync" desc="Pick the data the portal is allowed to push to this store." />
        {stockOnly && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-4 py-3 text-xs text-neutral-400">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
            <span><span className="font-medium text-neutral-200">Stock only</span> ownership mode syncs inventory and nothing else — these options don&apos;t apply. Switch ownership mode to enable them.</span>
          </div>
        )}
        <fieldset disabled={stockOnly} className={`m-0 min-w-0 border-0 p-0 transition-opacity ${stockOnly ? "pointer-events-none opacity-50" : ""}`}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SYNC_FLAGS.map((f) => (
              <li key={f.key}>
                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 transition-colors hover:border-[#01a0be]/50">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{f.label}</span>
                      {f.slow && <StatusBadge tone="amber">Slow</StatusBadge>}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">{f.desc}</span>
                  </span>
                  <ToggleSwitch checked={!!config[f.key]} onChange={() => toggleFlag(f.key)} ariaLabel={`Sync ${f.label}`} />
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </section>

      {/* --------------------- AI categorization (tags) ---------------- */}
      {activeScope?.type !== "own_source" && aiExportOptions.length > 0 && (
        <section className="border-t border-neutral-800 pt-8">
          <SectionHeading
            title="AI categorization"
            desc="Tag pushed products with smart AI categories. Products categorized by the chosen categorization get those categories (full path included) as their Shopify tags; the rest keep the catalogue's categories."
            right={
              <a
                href="/categories"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-700/50 bg-neutral-800/80 px-3.5 py-2 text-sm font-medium text-neutral-400 transition-all hover:border-neutral-600/60 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Manage
              </a>
            }
          />
          {stockOnly ? (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-4 py-3 text-xs text-neutral-400">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
              <span><span className="font-medium text-neutral-200">Stock only</span> ownership never touches tags — switch ownership mode to use AI categories.</span>
            </div>
          ) : activeScope?.aiExportId && !config.syncTags ? (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200/90">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span><span className="font-medium">Tags sync is off</span> for this source — AI categories are only applied when a product is first created. Turn on <span className="font-medium">Tags</span> under What to sync to keep them updated.</span>
            </div>
          ) : null}
          <fieldset disabled={stockOnly} className={`m-0 min-w-0 border-0 p-0 transition-opacity ${stockOnly ? "pointer-events-none opacity-50" : ""}`}>
            <legend className="sr-only">AI categorization</legend>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Categorization</label>
            <Select
              ariaLabel="AI categorization"
              value={activeScope?.aiExportId || ""}
              onChange={(e) => setScopeAi(editingScopeIdx, e.target.value || null)}
            >
              <option value="">None — catalogue categories only</option>
              {aiExportOptions.map((x) => (
                <option key={x._id} value={x._id}>{x.name}</option>
              ))}
            </Select>
            {(() => {
              const sel = aiExportOptions.find((x) => x._id === activeScope?.aiExportId);
              return (
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {sel
                    ? (sel.description || <>Products categorized by <span className="font-medium text-cyan-500/90">{sel.name}</span> get its AI categories as Shopify tags (full path included); the rest keep the catalogue&apos;s categories.</>)
                    : "Tags come from the catalogue's own categories only."}
                </p>
              );
            })()}
          </fieldset>
        </section>
      )}

      {/* ----------------------------- Pricing ------------------------- */}
      <section className="border-t border-neutral-800 pt-8">
        <SectionHeading
          title="Pricing"
          desc="Each variant carries several named pricelists — set which one wins and how VAT is handled."
        />

        {stockOnly && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-4 py-3 text-xs text-neutral-400">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
            <span>Pricing doesn&apos;t apply in <span className="font-medium text-neutral-200">Stock only</span> ownership mode — prices aren&apos;t pushed. Switch ownership mode to edit pricing.</span>
          </div>
        )}
        <fieldset disabled={stockOnly} className={`m-0 min-w-0 border-0 p-0 transition-opacity ${stockOnly ? "pointer-events-none opacity-50" : ""}`}>
          {/* pricelist priority — drag to reorder, matching the Export settings */}
          <p className="mb-2 text-sm font-medium text-neutral-300">Pricelist priority</p>
          <p className="mb-3 text-xs text-neutral-500">Drag the handle to reorder — the first enabled pricelist with a valid price wins.</p>
          <div ref={listRef} className="rounded-xl border border-neutral-700/50 bg-neutral-900/30 p-3">
            {config.pricelistPriority.map((pl, idx) => {
              const isFuture = nowTs > 0 && new Date(pl.valid_from).getTime() > nowTs;
              const isDragging = draggingIdx === idx;
              return (
                <div
                  key={pl._id}
                  data-pl-row
                  className={`group mb-2 flex select-none items-center gap-2 rounded-xl p-2.5 transition-shadow duration-150 last:mb-0 sm:gap-3 sm:p-3 ${
                    isDragging
                      ? "border-2 border-cyan-500/50 bg-neutral-800/90 shadow-lg shadow-cyan-500/20"
                      : pl.enabled
                        ? "border border-neutral-700/50 bg-neutral-800/60"
                        : "border border-neutral-800/50 bg-neutral-900/40 opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Reorder ${pl.name}`}
                    onPointerDown={(e) => beginDrag(e, idx)}
                    className="flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg bg-neutral-700/30 text-neutral-500 transition-colors hover:bg-cyan-500/20 hover:text-cyan-400 active:cursor-grabbing sm:h-9 sm:w-9"
                  >
                    <GripIcon className="h-5 w-5" />
                  </button>

                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                    idx === 0 && pl.enabled
                      ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                      : pl.enabled
                        ? "bg-neutral-700/80 text-neutral-300"
                        : "bg-neutral-800 text-neutral-500"
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`truncate text-sm font-medium ${pl.enabled ? "text-white" : "text-neutral-500"}`}>{pl.name}</span>
                      {idx === 0 && pl.enabled && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/80">Primary</span>
                      )}
                      {isFuture && config.futureDatedGuard && <StatusBadge tone="amber">future · skipped</StatusBadge>}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      VAT {pl.vat}% · from {fmtDate(pl.valid_from)}
                    </p>
                  </div>

                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <ToggleSwitch checked={pl.enabled} onChange={() => togglePricelist(idx)} ariaLabel={`Enable ${pl.name}`} />
                  </label>
                </div>
              );
            })}
          </div>
          {enabledPricelists === 0 && (
            <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Enable at least one pricelist — with none enabled, no price can be resolved.
            </p>
          )}

          {/* VAT mode */}
          <div className="mt-8">
            <p className="mb-1 text-sm font-medium text-neutral-300">VAT handling</p>
            <p className="mb-3 text-xs text-neutral-500">Pricelists carry their own VAT (e.g. 22% vs 0%) — choose how the price reaches Shopify.</p>
            <div className="inline-flex w-full gap-1 rounded-xl border border-neutral-700/50 bg-neutral-900/60 p-1 sm:w-auto">
              {[
                { v: "inclusive", label: "VAT inclusive" },
                { v: "exclusive", label: "VAT exclusive" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setVatMode(opt.v)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:flex-none sm:px-4 sm:text-sm ${
                    config.priceVatMode === opt.v
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                      : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* future-dated guard */}
          <div className="mt-6">
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 transition-colors hover:border-[#01a0be]/50">
              <span className="min-w-0">
                <span className="text-sm font-medium text-white">Future-dated price guard</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  Only apply prices whose <span className="font-mono text-neutral-400">valid_from</span> date has already passed (valid_from ≤ now).
                </span>
              </span>
              <ToggleSwitch checked={config.futureDatedGuard} onChange={() => toggleFlag("futureDatedGuard")} ariaLabel="Future-dated price guard" />
            </label>
          </div>
        </fieldset>
      </section>

      {/* --------------------------- Sales channels -------------------- */}
      <section className="border-t border-neutral-800 pt-8">
        <SectionHeading
          title="Sales channels"
          desc="Where newly-created products are published — e.g. Online Store, Point of Sale."
        />
        {!detailLoaded ? (
          <div className="h-16 animate-pulse rounded-xl border border-neutral-800 bg-neutral-800/40" />
        ) : !publishingEnabled ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-amber-200/90">
                Reconnect this store to grant publishing permission, then choose which channels new products go live on.
              </span>
            </div>
            <button
              onClick={reconnect}
              disabled={connecting}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ? <SpinnerIcon className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
              {connecting ? "Redirecting…" : "Reconnect"}
            </button>
          </div>
        ) : publications.length === 0 ? (
          <p className="text-sm text-neutral-500">No sales channels found in this store.</p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {publications.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 transition-colors hover:border-[#01a0be]/50">
                    <span className="text-sm font-medium text-white">{p.name}</span>
                    <ToggleSwitch
                      checked={(config.publicationIds || []).includes(p.id)}
                      onChange={() => togglePublication(p.id)}
                      ariaLabel={`Publish to ${p.name}`}
                    />
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              New products are published to these channels. In <span className="font-medium text-neutral-300">Portal authoritative</span> mode, existing products are kept in sync too (channels added or removed on the next sync). In <span className="font-medium text-neutral-300">Create, then hand off</span>, only newly-created products are published.
            </p>
          </>
        )}
      </section>
            </div>{/* /scrollable body */}

            {/* footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-800 bg-neutral-900/40 px-6 py-4">
              <button type="button" onClick={() => setEditingScopeIdx(null)} className="rounded-lg bg-[#01a0be] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#018a9f]">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- Sync activity --------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <SectionHeading
          title="Sync activity"
          desc="The most recent push jobs and the overall state of your mapped catalog."
          right={
            <button
              onClick={refreshActivity}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700/50 bg-neutral-800/80 px-3.5 py-2 text-sm font-medium text-neutral-400 transition-all hover:border-neutral-600/60 hover:text-white disabled:opacity-50"
            >
              {refreshing ? <SpinnerIcon className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
              Refresh
            </button>
          }
        />

        {/* counts */}
        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Synced", value: counts.synced, tone: "text-cyan-400" },
            { label: "Pending", value: counts.pending, tone: "text-amber-400" },
            { label: "Error", value: counts.error, tone: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className={`text-xl font-semibold tabular-nums sm:text-2xl ${s.tone}`}>{fmtNum(s.value)}</div>
              <div className="mt-0.5 text-xs text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>

        {syncJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 px-4 py-8 text-center">
            <p className="text-sm text-neutral-300">No sync runs yet.</p>
            <p className="mt-1 text-xs text-neutral-500">Hit <span className="font-medium text-neutral-300">Sync now</span> to push live stock to your store.</p>
          </div>
        )}

        {/* desktop table */}
        <div className={`${syncJobs.length === 0 ? "hidden" : "hidden md:block"} overflow-x-auto rounded-xl border border-neutral-700/50`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700/50 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {syncJobs.slice(0, 5).map((j) => (
                <tr key={j.id} onClick={() => setDetailJob(j)} className="cursor-pointer hover:bg-neutral-800/30">
                  <td className="px-4 py-3"><StatusBadge tone="neutral">{JOB_TYPE_LABEL[j.type] || j.type}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-neutral-200">{jobItem(j)}</span>
                    {jobSub(j) && <span className="ml-2 text-xs text-neutral-500">{jobSub(j)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {j.status === "running" && <PingDot tone="cyan" />}
                      <StatusBadge tone={JOB_STATUS_TONE[j.status] || "neutral"}>{j.status}</StatusBadge>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-400">{j.attempts}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400">{fmtDateTime(j.time)}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-neutral-500" title={jobDetail(j) || ""}>{jobDetail(j) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="space-y-3 md:hidden">
          {syncJobs.slice(0, 5).map((j) => (
            <div key={j.id} role="button" tabIndex={0} onClick={() => setDetailJob(j)} className="cursor-pointer rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone="neutral">{JOB_TYPE_LABEL[j.type] || j.type}</StatusBadge>
                <span className="inline-flex items-center gap-1.5">
                  {j.status === "running" && <PingDot tone="cyan" />}
                  <StatusBadge tone={JOB_STATUS_TONE[j.status]}>{j.status}</StatusBadge>
                </span>
              </div>
              <p className="mt-2 font-mono text-sm text-neutral-200">{jobItem(j)}</p>
              {jobSub(j) && <p className="text-xs text-neutral-500">{jobSub(j)}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-neutral-500">Attempts</dt><dd className="tabular-nums text-neutral-300">{j.attempts}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Time</dt><dd className="text-neutral-300">{fmtDateTime(j.time).replace(" UTC", "")}</dd></div>
              </dl>
              {jobDetail(j) && j.status === "failed" && <p className="mt-2 break-words rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{jobDetail(j)}</p>}
            </div>
          ))}
        </div>

        {/* latest-5 window + full history */}
        {syncJobs.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Showing the {Math.min(syncJobs.length, 5)} most recent {syncJobs.length === 1 ? "run" : "runs"} · click a run for details
            </p>
            <button
              onClick={openHistory}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-neutral-700/50 bg-neutral-800/80 px-3.5 py-2 text-sm font-medium text-neutral-400 transition-all hover:border-neutral-600/60 hover:text-white"
            >
              View all runs
            </button>
          </div>
        )}
      </section>

      {/* ----------------------- Run history modal --------------------- */}
      {historyOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6" onClick={() => setHistoryOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-800 px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white">Sync history</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {historyLoading ? "Loading…" : `${historyJobs?.length ?? 0} ${(historyJobs?.length ?? 0) === 1 ? "run" : "runs"}`} · click a run for details
                </p>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
              {historyLoading ? (
                <div className="space-y-2 py-2">
                  {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-neutral-800/40" />)}
                </div>
              ) : !historyJobs?.length ? (
                <p className="py-10 text-center text-sm text-neutral-500">No sync runs yet.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/70">
                  {historyJobs.map((j) => (
                    <li key={j.id}>
                      <button
                        type="button"
                        onClick={() => setDetailJob(j)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-neutral-800/30"
                      >
                        <StatusBadge tone="neutral">{JOB_TYPE_LABEL[j.type] || j.type}</StatusBadge>
                        <span className="inline-flex shrink-0 items-center gap-1.5">
                          {j.status === "running" && <PingDot tone="cyan" />}
                          <StatusBadge tone={JOB_STATUS_TONE[j.status] || "neutral"}>{j.status}</StatusBadge>
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{jobDetail(j) || jobItem(j)}</span>
                        <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400">{fmtDateTime(j.time)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------ Run detail modal --------------------- */}
      {detailJob && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6" onClick={() => setDetailJob(null)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-800 px-6 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <h2 className="text-base font-semibold text-white">Run details</h2>
                <StatusBadge tone="neutral">{JOB_TYPE_LABEL[detailJob.type] || detailJob.type}</StatusBadge>
                <span className="inline-flex items-center gap-1.5">
                  {detailJob.status === "running" && <PingDot tone="cyan" />}
                  <StatusBadge tone={JOB_STATUS_TONE[detailJob.status] || "neutral"}>{detailJob.status}</StatusBadge>
                </span>
              </div>
              <button type="button" onClick={() => setDetailJob(null)} aria-label="Close" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
              {/* run meta */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-neutral-500">Trigger</dt>
                  <dd className="mt-0.5 capitalize text-neutral-200">{detailJob.trigger || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Started</dt>
                  <dd className="mt-0.5 text-neutral-200">{fmtDateTime(detailJob.startedAt || detailJob.time)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Duration</dt>
                  <dd className="mt-0.5 text-neutral-200">{fmtDuration(detailJob.startedAt, detailJob.finishedAt) || "—"}</dd>
                </div>
              </dl>

              {detailJob.error && (
                <p className="break-words rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{detailJob.error}</p>
              )}

              {/* per-source breakdown — which sources ran, where, and in which ownership mode */}
              {detailJob.scopes?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-300">Sources in this run</p>
                  <ul className="space-y-2">
                    {detailJob.scopes.map((s, i) => {
                      const modeLabel = OWNERSHIP_MODES.find((m) => m.value === s.ownership)?.title || s.ownership || "—";
                      const locName = locations.find((l) => l.id === s.locationId)?.name || (s.locationId ? `…${String(s.locationId).slice(-6)}` : "—");
                      return (
                        <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-3 py-2.5">
                          <span className="text-sm font-medium text-neutral-100">{s.source || "—"}</span>
                          <StatusBadge tone="neutral">{s.type === "own_source" ? "Own source" : "Patrik export"}</StatusBadge>
                          <span className="text-xs text-neutral-500">{modeLabel}</span>
                          <span className="ml-auto text-xs text-neutral-500">
                            {locName}
                            {typeof s.products === "number" ? ` · ${fmtNum(s.products)} items` : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* full counts */}
              {detailJob.counts && (
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-300">What this run did</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {RUN_COUNT_LABELS.map(([key, label]) => {
                      const v = detailJob.counts[key] || 0;
                      const danger = (key === "failed" || key === "unmatched") && v > 0;
                      return (
                        <div key={key} className={`rounded-xl border px-3 py-2.5 ${v ? "border-neutral-700/50 bg-neutral-800/40" : "border-neutral-800/50 bg-neutral-900/30 opacity-50"}`}>
                          <div className={`text-lg font-semibold tabular-nums ${danger ? "text-red-400" : v ? "text-neutral-100" : "text-neutral-500"}`}>{fmtNum(v)}</div>
                          <div className="mt-0.5 text-xs text-neutral-500">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* per-product errors */}
              {detailJob.errors?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-300">Errors ({detailJob.errors.length})</p>
                  <ul className="space-y-1.5">
                    {detailJob.errors.map((e, i) => (
                      <li key={i} className="break-words rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {e.parentCode && <span className="mr-2 font-mono text-red-200">{e.parentCode}</span>}
                        {e.error || String(e)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!detailJob.counts && jobDetail(detailJob) && (
                <p className="text-sm text-neutral-400">{jobDetail(detailJob)}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-800 bg-neutral-900/40 px-6 py-4">
              <button type="button" onClick={() => setDetailJob(null)} className="rounded-lg bg-[#01a0be] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#018a9f]">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- Needs attention ------------------------- */}
      {attentionCount > 0 && (
        <section id="needs-attention" className="scroll-mt-20 rounded-2xl border border-amber-500/30 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
          <SectionHeading
            icon={<WarningIcon className="h-5 w-5 text-amber-400" />}
            title="Needs attention"
            desc="Variants we couldn't push on the last run. Resolve the cause, or let the next sync retry."
            right={<StatusBadge tone="red">{attentionCount}</StatusBadge>}
          />

          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-neutral-700/50 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700/50 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Parent code</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {unmatched.map((r) => (
                  <tr key={r.sku} className="hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-neutral-200">{r.sku}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.parentCode}</td>
                    <td className="px-4 py-3"><StatusBadge tone={r.tone}>{r.reason}</StatusBadge></td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-[#01a0be]/50 hover:text-white">
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="space-y-3 md:hidden">
            {unmatched.map((r) => (
              <div key={r.sku} className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-neutral-200">{r.sku}</span>
                  <StatusBadge tone={r.tone}>{r.reason}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{r.parentCode}</p>
                <button className="mt-3 w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-[#01a0be]/50 hover:text-white">
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------ Danger zone -------------------------- */}
      <section className="rounded-2xl border border-red-500/30 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">Disconnect store</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Stops all syncing and revokes access for <span className="font-medium text-neutral-200">{shopLabel(connection.shopDomain)}</span>. Your Shopify products stay exactly as they are — nothing is deleted.
            </p>
          </div>
          {confirmDisconnect ? (
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="flex-1 justify-center rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white sm:flex-none"
              >
                Cancel
              </button>
              <button
                onClick={disconnect}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 sm:flex-none"
              >
                <TrashIcon className="h-4 w-4" />
                Yes, disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/10 sm:w-auto"
            >
              <TrashIcon className="h-4 w-4" />
              Disconnect
            </button>
          )}
        </div>
      </section>

      {/* --------------------------- Sticky save bar --------------------------- */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md animate-fade-in">
          <div className="mx-auto flex max-w-screen-2xl flex-col-reverse gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-sm text-neutral-400">
              Unsaved changes for <span className="font-medium text-neutral-200">{shopLabel(connection.shopDomain)}</span>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={discard}
                className="flex-1 justify-center rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white sm:flex-none"
              >
                Discard
              </button>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {saving ? <SpinnerIcon className="h-4 w-4" /> : <SaveIcon className="h-4 w-4" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
