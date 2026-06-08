/**
 * ShopifyIntegrationPage Component
 *
 * Partner-facing UI for connecting a Shopify store to the T4A Partner Portal and
 * configuring the one-way product push (stock, products, prices, descriptions, images).
 *
 * This is a UI-only build — there is no backend wired up yet. All state lives in local
 * React state seeded from mock data, and the connect / disconnect flow doubles as the
 * demo mechanism for toggling between the two top-level states:
 *   1. NOT CONNECTED — enter a myshopify domain and "connect" (would start OAuth).
 *   2. CONNECTED     — full management UI: status, sync scope, ownership, pricing,
 *                      sync activity, needs-attention report, and disconnect.
 *
 * When the backend lands, the mock constants and the `connect/disconnect/syncNow/
 * saveConfig` handlers are the seams to replace with calls to /api/export/shopify/*.
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
/*  Mock data (replace with real API data when the backend is built)          */
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
    syncImages: false, // OFF by default — image sync is expensive
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

const SYNC_FLAGS = [
  { key: "syncStock", label: "Stock", desc: "Push live inventory quantities to your store." },
  { key: "syncNewProducts", label: "New products", desc: "Create products that don't exist in your store yet." },
  { key: "syncPrices", label: "Prices", desc: "Keep variant prices in step with your pricelists." },
  { key: "syncDescriptions", label: "Descriptions", desc: "Sync titles, copy and product fields." },
  { key: "syncImages", label: "Images", desc: "Push product and variant images.", expensive: true },
];

const OWNERSHIP_MODES = [
  {
    value: "stock_only",
    title: "Stock only",
    recommended: true,
    desc: "Only updates inventory quantities. Never touches your titles, prices, or descriptions.",
  },
  {
    value: "portal_authoritative",
    title: "Portal authoritative",
    desc: "Overwrites portal-managed fields on every sync.",
    warn: "Any edits you make to title, description, price or images in Shopify will be overwritten on the next sync.",
  },
  {
    value: "create_then_handoff",
    title: "Create, then hand off",
    desc: "Creates each product once, then only keeps stock in sync.",
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
  failed: "red",
};

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
const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
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
  const color = tone === "red" ? "#f87171" : tone === "amber" ? "#fbbf24" : "#01a0be";
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

function Select({ value, onChange, ariaLabel, children }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={onChange}
        aria-label={ariaLabel}
        className="w-full appearance-none rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm px-4 py-3.5 pr-10 text-sm text-white focus:border-[#01a0be]/50 focus:outline-none transition-colors"
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
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function ShopifyIntegrationPage({ initialExports = [], ownerEmail }) {
  // Real Shopify-preset export configs (from /custom-export?preset=shopify). May be empty —
  // when it is, the "Products to sync" block shows a create prompt instead of a selector.
  const exportOptions = initialExports;

  const seedConfig = () => ({
    ...MOCK_CONNECTION.config,
    exportConfigId: MOCK_CONNECTION.config.exportConfigId ?? exportOptions[0]?._id ?? null,
    shopifyLocationId: MOCK_CONNECTION.shopifyLocationId,
  });

  const [isConnected, setIsConnected] = useState(true); // demo default: show the rich connected UI first
  const [domainInput, setDomainInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [connection, setConnection] = useState(() => ({ ...MOCK_CONNECTION }));
  const [config, setConfig] = useState(() => seedConfig());
  const [savedConfig, setSavedConfig] = useState(() => seedConfig());

  const [syncJobs, setSyncJobs] = useState(MOCK_SYNC_JOBS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragging, setDragging] = useState(false);
  const draggingIdxRef = useRef(null);
  const listRef = useRef(null);

  const nowTs = useSyncExternalStore(noopSubscribe, getNowSnapshot, getServerNowSnapshot);

  const jobSeq = useRef(0);
  // Track pending demo timeouts so they can be cleared if the component unmounts mid-flight.
  const timers = useRef([]);
  const schedule = (fn, ms) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  /* ----- config mutators (all route through setConfig -> mark dirty) ----- */
  const setCfg = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const toggleFlag = (key) => setConfig((c) => ({ ...c, [key]: !c[key] }));
  const setOwnership = (v) => setConfig((c) => ({ ...c, ownership: v }));
  const setVatMode = (v) => setConfig((c) => ({ ...c, priceVatMode: v }));

  const togglePricelist = (index) =>
    setConfig((c) => ({
      ...c,
      pricelistPriority: c.pricelistPriority.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p)),
    }));

  // Pointer-based reorder (works with mouse AND touch — native HTML5 drag never fires on
  // touch). The grip handle starts the drag; window listeners track the pointer so it keeps
  // working when the pointer leaves the handle, and each step swaps the dragged row with its
  // neighbour as the pointer crosses that neighbour's midpoint (adjacent swap = no jitter).
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
  const domainClean = domainInput.trim().toLowerCase();
  const domainValid = /^[a-z0-9][a-z0-9-]*$/.test(domainClean);

  const connect = () => {
    if (!domainValid || connecting) return;
    setConnecting(true);
    schedule(() => {
      setConnection((c) => ({ ...c, shopDomain: `${domainClean}.myshopify.com`, status: "active" }));
      setConfig(seedConfig());
      setSavedConfig(seedConfig());
      setIsConnected(true);
      setConnecting(false);
    }, 900);
  };

  const disconnect = () => {
    setConfirmDisconnect(false);
    setIsConnected(false);
    setDomainInput("");
  };

  const syncNow = () => {
    if (isSyncing) return;
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
  };

  const refreshActivity = () => {
    if (refreshing) return;
    setRefreshing(true);
    schedule(() => setRefreshing(false), 700);
  };

  const saveConfig = () => setSavedConfig(config);
  const discard = () => setConfig(savedConfig);

  const statusMeta = {
    active: { tone: "cyan", label: "Active" },
    error: { tone: "red", label: "Error" },
    uninstalled: { tone: "amber", label: "Uninstalled" },
  }[connection.status] || { tone: "neutral", label: connection.status };

  const savedLocationName =
    MOCK_LOCATIONS.find((l) => l.id === savedConfig.shopifyLocationId)?.name || "—";

  const enabledPricelists = config.pricelistPriority.filter((p) => p.enabled).length;
  const attentionCount = MOCK_UNMATCHED.length;
  const stockOnly = config.ownership === "stock_only";

  /* ====================================================================== */
  return (
    <div className="pb-40 sm:pb-32">
      {/* ----------------------------- Header ----------------------------- */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              One-way push of stock, products, prices and images from the portal straight to your Shopify store.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:shrink-0">
          {isConnected ? (
            <>
              <span className="inline-flex items-center gap-2">
                {connection.status === "active" && <PingDot tone="cyan" />}
                <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
              </span>
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSyncing ? <SpinnerIcon className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
                {isSyncing ? "Syncing…" : "Sync now"}
              </button>
            </>
          ) : (
            <StatusBadge tone="neutral">Not connected</StatusBadge>
          )}
        </div>
      </header>

      {isConnected ? (
        /* =============================== CONNECTED =============================== */
        <div className="space-y-6">
          {/* ---------------------- Connection summary --------------------- */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
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
                        {connection.lastSyncStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Location</dt>
                    <dd className="mt-0.5 truncate text-neutral-200">{savedLocationName}</dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Granted scopes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {connection.scopes.map((s) => (
                      <StatusBadge key={s} tone="cyan">{s}</StatusBadge>
                    ))}
                  </div>
                </div>

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
            </div>
          </section>

          {/* ------------------------ Ownership mode ----------------------- */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
            <SectionHeading
              title="Ownership mode"
              desc="Decide how assertively the portal writes to products once they exist in your store."
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
                        name="ownership"
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
            <SectionHeading title="What to sync" desc="Pick the data the portal is allowed to push to your store." />
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
                        {f.expensive && <StatusBadge tone="amber">expensive</StatusBadge>}
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
                  onChange={(e) => setCfg({ shopifyLocationId: e.target.value })}
                >
                  {MOCK_LOCATIONS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-neutral-500">
                  Inventory is pushed to this one location. Multi-location stores aren&apos;t supported yet.
                </p>
              </div>
            </div>
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
                { label: "Synced", value: MOCK_COUNTS.synced, tone: "text-cyan-400" },
                { label: "Pending", value: MOCK_COUNTS.pending, tone: "text-amber-400" },
                { label: "Error", value: MOCK_COUNTS.error, tone: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className={`text-xl font-semibold tabular-nums sm:text-2xl ${s.tone}`}>{fmtNum(s.value)}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-neutral-700/50 md:block">
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
                        <span className="font-mono text-neutral-200">{j.variantCode || j.parentCode}</span>
                        {j.variantCode && <span className="ml-2 text-xs text-neutral-500">{j.parentCode}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          {j.status === "running" && <PingDot tone="cyan" />}
                          <StatusBadge tone={JOB_STATUS_TONE[j.status]}>{j.status}</StatusBadge>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-400">{j.attempts}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-400">{fmtDateTime(j.time)}</td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-neutral-500" title={j.error || ""}>{j.error || "—"}</td>
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
                  <p className="mt-2 font-mono text-sm text-neutral-200">{j.variantCode || j.parentCode}</p>
                  {j.variantCode && <p className="text-xs text-neutral-500">{j.parentCode}</p>}
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between"><dt className="text-neutral-500">Attempts</dt><dd className="tabular-nums text-neutral-300">{j.attempts}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Time</dt><dd className="text-neutral-300">{fmtDateTime(j.time).replace(" UTC", "")}</dd></div>
                  </dl>
                  {j.error && <p className="mt-2 break-words rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{j.error}</p>}
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
                    {MOCK_UNMATCHED.map((r) => (
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
                {MOCK_UNMATCHED.map((r) => (
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
                  Stops all syncing and revokes access. Your Shopify products stay exactly as they are — nothing is deleted.
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
        </div>
      ) : (
        /* ============================= NOT CONNECTED ============================= */
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* left: connect + how it works */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
              <div className="relative mb-6 w-fit">
                <div aria-hidden="true" className="absolute -inset-2 rounded-2xl bg-[#95BF47]/20 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-gradient-to-br from-[#16210f] via-neutral-900 to-neutral-950 shadow-lg shadow-[#5E8E3E]/20">
                  <ShopifyLogo className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">Connect your Shopify store</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-400">
                Install the portal app on your store with a single approval. No API keys to copy, no manual setup — once
                connected, choose what to sync and the portal keeps it current.
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
                        {f.expensive && <StatusBadge tone="amber">expensive</StatusBadge>}
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
      )}

      {/* --------------------------- Sticky save bar --------------------------- */}
      {isConnected && isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md animate-fade-in">
          <div className="mx-auto flex max-w-screen-2xl flex-col-reverse gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-sm text-neutral-400">You have unsaved configuration changes.</p>
            <div className="flex gap-2">
              <button
                onClick={discard}
                className="flex-1 justify-center rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white sm:flex-none"
              >
                Discard
              </button>
              <button
                onClick={saveConfig}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] sm:flex-none"
              >
                <SaveIcon className="h-4 w-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
