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

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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

function Select({ value, onChange, ariaLabel, disabled, children }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={onChange}
        aria-label={ariaLabel}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm px-4 py-3.5 pr-10 text-sm text-white focus:border-[#01a0be]/50 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
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
  const handleDisconnected = (key) => {
    const next = connections.filter((c) => connKey(c) !== key);
    setConnections(next);
    if (next.length === 0) setAdding(true);
    else if (key === selectedKey) setSelectedKey(connKey(next[0]));
    setNotice({ tone: "success", text: "Store disconnected." });
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
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          {/* Brand mark — official Shopify logo on a glassy tile lit by a soft green halo */}
          <div className="relative shrink-0">
            <div aria-hidden="true" className="absolute -inset-3 rounded-[1.75rem] bg-[#95BF47]/20 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-gradient-to-br from-[#16210f] via-neutral-900 to-neutral-950 shadow-lg shadow-[#5E8E3E]/20 sm:h-[4.5rem] sm:w-[4.5rem]">
              <ShopifyLogo className="h-9 w-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:h-10 sm:w-10" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#01a0be]">
              <BagIcon className="h-3.5 w-3.5" />
              Integration
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="bg-gradient-to-r from-[#95BF47] via-[#5fae46] to-[#01a0be] bg-clip-text text-transparent">Shopify</span>
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-400">
              One-way push of stock, products, prices and images from the portal straight to your Shopify stores.
            </p>
          </div>
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
                      ? "bg-gradient-to-br from-neutral-800 to-neutral-800/30 shadow-lg ring-1 ring-[#01a0be]/40"
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

function ConnectionPanel({ connection: initialConn, exportOptions, pricelists, onNotice, onDisconnected, onPatch }) {
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
    return {
      ...MOCK_CONNECTION.config,
      ...cfg,
      pricelistPriority: buildPricelistPriority(pricelists, cfg.pricelistPriority),
      exportConfigId: cfg.exportConfigId ?? exportOptions[0]?._id ?? null,
      shopifyLocationId: locationId,
      publicationIds: (cfg.publicationIds || []).filter((id) => (validate ? pubs.some((p) => p.id === id) : true)),
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

  // Sync-activity data. Real once a live connection exists (fetched from /activity); the MOCK_*
  // set is only the demo fallback.
  const [syncJobs, setSyncJobs] = useState(isDemo ? MOCK_SYNC_JOBS : []);
  const [counts, setCounts] = useState(isDemo ? MOCK_COUNTS : { synced: 0, pending: 0, error: 0 });
  const [unmatched, setUnmatched] = useState(isDemo ? MOCK_UNMATCHED : []);

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
  useEffect(() => () => {
    aliveRef.current = false;
    timers.current.forEach(clearTimeout);
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

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  /* ----- config mutators (all route through setConfig -> mark dirty) ----- */
  const setCfg = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const toggleFlag = (key) => setConfig((c) => ({ ...c, [key]: !c[key] }));
  // Picking a mode richer than stock-only opts the store up to the full push, so default every
  // sync field ON. Only fires when leaving stock_only — switching between the two rich modes
  // preserves whatever the partner has toggled.
  const setOwnership = (v) =>
    setConfig((c) =>
      v !== "stock_only" && c.ownership === "stock_only"
        ? { ...c, ownership: v, syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncImages: true }
        : { ...c, ownership: v }
    );
  const setVatMode = (v) => setConfig((c) => ({ ...c, priceVatMode: v }));
  const togglePublication = (id) =>
    setConfig((c) => {
      const ids = c.publicationIds || [];
      return { ...c, publicationIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] };
    });

  const togglePricelist = (index) =>
    setConfig((c) => ({
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
          return { ...c, pricelistPriority: arr };
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
        syncPrices, syncDescriptions, syncImages, ownership, exportConfigId, shopifyLocationId, publicationIds } = config;
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
            syncStock, syncNewProducts, syncPrices, syncDescriptions, syncImages, ownership, exportConfigId, publicationIds },
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

      {/* ------------------------ Ownership mode ----------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <SectionHeading
          title="Ownership mode"
          desc="Decide how assertively the portal writes to products once they exist in this store."
        />
        <fieldset>
          <legend className="sr-only">Ownership mode</legend>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {OWNERSHIP_MODES.map((m) => {
              const selected = config.ownership === m.value;
              return (
                <label
                  key={m.value}
                  className={`group relative flex cursor-pointer flex-col rounded-xl border bg-neutral-800/50 p-5 transition-all ${
                    selected
                      ? "border-[#01a0be] shadow-[0_0_40px_rgba(1,160,190,0.1)]"
                      : "border-neutral-700/50 hover:border-[#01a0be]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`ownership-${myKey}`}
                    value={m.value}
                    checked={selected}
                    onChange={() => setOwnership(m.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{m.title}</span>
                      {m.recommended && <StatusBadge tone="cyan">Recommended</StatusBadge>}
                    </span>
                    {selected && <CheckIcon className="h-5 w-5 text-[#01a0be]" />}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">{m.desc}</p>
                  {m.warn && selected && (
                    <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-400">
                      <span className="font-semibold">Heads up — </span>{m.warn}
                    </p>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      {/* ------------------------ What to sync ------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
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

      {/* ----------------------------- Pricing ------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
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

      {/* --------------------- Products & location --------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
        <SectionHeading title="Products & location" desc="Which products are in scope, and where their inventory lands." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-neutral-300">Products to sync</label>
              <a
                href="/export"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-[#01a0be]/50 hover:text-white"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New export
              </a>
            </div>
            {exportOptions.length > 0 ? (
              <>
                <Select
                  ariaLabel="Products to sync"
                  value={config.exportConfigId}
                  onChange={(e) => setCfg({ exportConfigId: e.target.value })}
                >
                  <option value="" disabled>Select an export configuration…</option>
                  {exportOptions.map((x) => (
                    <option key={x._id} value={x._id}>{x.name}</option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-neutral-500">Sync follows this export config&apos;s product filters and field rules.</p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 px-4 py-5 text-center">
                <p className="text-sm text-neutral-300">No Shopify export configurations yet.</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Create one with the <span className="font-medium text-neutral-300">Shopify</span> preset to choose which products sync.
                </p>
                <a
                  href="/export"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01a0be] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f]"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create export configuration
                </a>
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Shopify location</label>
            <Select
              ariaLabel="Shopify location"
              value={config.shopifyLocationId}
              disabled={!detailLoaded}
              onChange={(e) => setCfg({ shopifyLocationId: e.target.value })}
            >
              {!detailLoaded && <option value="">Loading locations…</option>}
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
            <p className="mt-2 text-xs text-neutral-500">
              Inventory is pushed to this one location. Multi-location stores aren&apos;t supported yet.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------- Sales channels -------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
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
              {syncJobs.map((j) => (
                <tr key={j.id} className="hover:bg-neutral-800/30">
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
          {syncJobs.map((j) => (
            <div key={j.id} className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-4">
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
      </section>

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
