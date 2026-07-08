/**
 * Release history — single source of truth for the /changelog page.
 *
 * This is a UNIFIED product changelog covering BOTH repos:
 *   - t4a-partner-portal-api  (the backend / product + sync API)
 *   - t4a-partner-portal-ui   (this portal)
 *
 * Every release below is anchored to a real annotated git tag pushed to GitHub in
 * one or both repos. When you cut a NEW release you MUST keep three things in sync
 * (see docs/RELEASING.md):
 *   1. Prepend an entry to RELEASES here (newest first).
 *   2. Mirror it into CHANGELOG.md in the repo(s) it touches.
 *   3. Create + push the matching annotated tag: `git tag -a vX.Y.Z -m "…"`.
 *
 * `scope` lists which repos a release shipped in ("api", "ui"). Early releases
 * predate the portal, so they are api-only. `commits` records the tagged commit in
 * each repo for traceability. `latest: true` marks the newest release (one only).
 *
 * Change categories follow Keep a Changelog: added / changed / fixed.
 */

export const REPO_URLS = {
  api: "https://github.com/time-4-action/t4a-partner-portal-api",
  ui: "https://github.com/time-4-action/t4a-partner-portal-ui",
};

export const RELEASES = [
  {
    version: "1.1.0",
    date: "2026-07-07",
    title: "General Availability",
    tagline:
      "Shopify and Own Sources leave early access and open to every export partner.",
    tier: "GA",
    scope: ["api", "ui"],
    commits: { api: "c67bdda", ui: "1445b5e" },
    latest: true,
    added: [
      "Shopify and Own Sources graduate to full GA — the alpha/beta tier gate is gone; access is by the standard export role.",
      "Bring-your-own Shopify app connect flow (“Shopify Deprecated”, Beta): a partner registers their own Partner-Dashboard app and installs it via OAuth.",
      "Rename connected stores with an inline pencil edit in the store switcher and connection header.",
    ],
    changed: [
      "Export and source names are now unique per account instead of globally, so two partners can reuse the same name.",
      "“Shopify Prerelease” renamed to “Shopify Deprecated” and moved to /integrations/shopify-deprecated (the old path redirects).",
    ],
    fixed: [
      "OAuth no longer fails with INVALID_STATE when the typed domain differs from the canonical .myshopify.com domain — it binds to the HMAC-verified callback domain.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-16",
    title: "GA-Readiness",
    tagline:
      "The Shopify app passes App Store review; the portal gets its public front door and admin tooling.",
    tier: "Stable",
    scope: ["api", "ui"],
    commits: { api: "7c56410", ui: "0fdab09" },
    added: [
      "Public Shopify welcome page and a shared request-access form with claim / decline wiring.",
      "Admin partner-activity instrumentation and an admin partners API.",
      "Admin controls for the catalogue scheduler (status + run-now) and free-stock handling.",
    ],
    changed: [
      "Shopify app passes App Store review — hardened install flow and GraphQL Admin API, with an access-gated connect that breaks cleanly for non-approved partners.",
      "Welcome page is skipped for logged-in users and redesigned mobile-first.",
    ],
    fixed: [],
  },
  {
    version: "0.6.0",
    date: "2026-06-11",
    title: "Shopify Integration",
    tagline:
      "The headline release: a full one-way product sync to Shopify, external feed ingest, and a Claude-powered catalogue pipeline.",
    tier: "Beta",
    scope: ["api", "ui"],
    commits: { api: "d3220f6", ui: "05fef95" },
    added: [
      "One-way Shopify product sync built in phases: OAuth connection control plane, stock-only engine (A), product create (B), price + description push (C), images + auto-triggers (D).",
      "Multiple connected Shopify stores per account with a store switcher.",
      "Own Sources: ingest external brand feeds (Point-7 and others) into the same Shopify push.",
      "In-app catalogue scheduler (PNV) that replaces the external n8n cron.",
      "Alpha / beta early-access tiers with a “join the program” screen.",
      "Public privacy policy page at /privacy.",
      "Product detail modal, searchable product grid, and live AI-run progress with an ETA.",
      "Deleted-in-store detection with a per-product “recreate on next sync” control.",
    ],
    changed: [
      "AI categorization switched from Google Gemini to Anthropic Claude Haiku.",
      "The partner API now serves only published products.",
      "Authoritative sync mode overwrites in-store drift across price, content and publications.",
    ],
    fixed: [
      "Self-heal stale product-map rows, relink variant images, restore gallery order, and heal FAILED media.",
      "GDPR shop/redact webhook erases all data for a shop.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-05-21",
    title: "Export Correctness",
    tagline: "Exports become trustworthy — published-only, everywhere, in every format.",
    tier: "Stable",
    scope: ["api", "ui"],
    commits: { api: "50a71e4", ui: "98cf8e0" },
    added: ["JSON and XML downloads for the inventory preset."],
    changed: [
      "Inventory preset simplified to SKU + Quantity only.",
      "The published-only filter cascades into variants and is always enforced on every export and sync.",
    ],
    fixed: ["Unpublished products are excluded from /search."],
  },
  {
    version: "0.4.0",
    date: "2026-04-18",
    title: "Exports Mature",
    tagline: "New export formats, a public search endpoint, and a full documentation overhaul.",
    tier: "Stable",
    scope: ["api", "ui"],
    commits: { api: "3113652", ui: "8c6fc2c" },
    added: [
      "Recharge XML export, inventory CSV (Shopify import) export, and an external categorization endpoint.",
      "Public product search endpoint (GET /api/product/search) with exact-code matching and an optional AI category.",
      "AI categorization playground tab in the portal.",
      "Configurable Option1 (Variant) name per export config.",
    ],
    changed: [
      "Scheduled catalogue refresh moved from node-cron to n8n.",
      "Size is extracted from the product name when the CSV size field is empty (regex handles “l”, “V2” and rider-tag suffixes).",
      "README and docs overhauled with architecture diagrams, a deployment guide and API references.",
    ],
    fixed: [],
  },
  {
    version: "0.3.0",
    date: "2026-02-07",
    title: "Partner Portal + Rebrand",
    tagline: "The portal is born — Auth0 login, exports and a dashboard — alongside a full rebrand.",
    tier: "Stable",
    scope: ["api", "ui"],
    commits: { api: "4892260", ui: "eccb9f1" },
    added: [
      "Next.js partner portal with Auth0 login, a user profile, an export section and a contact page.",
      "Generic / custom exports, an analytics dashboard and product search by identifier.",
      "API endpoint protection, health checks and full documentation.",
    ],
    changed: ["Project rebrand and domain migration across both the API and the portal."],
    fixed: [],
  },
  {
    version: "0.2.0",
    date: "2026-01-16",
    title: "Catalogue Intelligence",
    tagline: "AI category identification, a warehouse view, and named price lists.",
    tier: "Stable",
    scope: ["api"],
    commits: { api: "7644f87" },
    added: [
      "AI category identification that runs on every products download.",
      "Warehouse view with price & stock, plus named price lists.",
      "TSV (tab-separated) export.",
    ],
    changed: ["Faster service startup."],
    fixed: [],
  },
  {
    version: "0.1.0",
    date: "2026-01-13",
    title: "Product API Genesis",
    tagline: "The first commit: the PNV catalogue becomes a JSON API.",
    tier: "Stable",
    scope: ["api"],
    commits: { api: "881519e" },
    added: [
      "Fetches the PNV products CSV, transforms it to JSON and serves it at /api/product/.",
      "HTML product view.",
      "Docker build and docker-compose.",
    ],
    changed: [],
    fixed: [],
  },
];

/** Small derived stats for the page header. */
export const CHANGELOG_STATS = {
  totalReleases: RELEASES.length,
  currentVersion: RELEASES.find((r) => r.latest)?.version ?? RELEASES[0].version,
  firstReleaseDate: RELEASES[RELEASES.length - 1].date,
  latestReleaseDate: RELEASES[0].date,
};

/** "2026-06-11" -> "11 Jun 2026" (locale-independent, SSR-safe). */
export function formatReleaseDate(iso) {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
