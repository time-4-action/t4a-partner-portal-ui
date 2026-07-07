import Link from "next/link";
import { auth0 } from "../lib/auth0";

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

/* ── icons (Heroicons v2 outline) ─────────────────────────────────────────── */
const ICONS = {
  catalog: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
  ),
  export: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  ),
  categories: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </>
  ),
  shopify: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  ),
  ownSources: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .37-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
  ),
};

const ARROW = (
  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      {ICONS[name]}
    </svg>
  );
}

/* ── server data ──────────────────────────────────────────────────────────── */

// Connected Shopify stores (lightweight; uninstalled already filtered by the backend).
// Used only for a one-line status hint — null/empty just hides it.
async function getConnections(token) {
  try {
    const res = await fetch(`${apiUrl}/shopify/connections`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.connections) ? data.connections : [];
  } catch {
    return [];
  }
}

function relTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

// A single quiet line summarising connected stores. Cyan when healthy, amber when
// a store needs reconnecting. Hidden entirely when nothing is connected.
function StatusStrip({ stores }) {
  const visible = stores.filter((s) => s.status !== "uninstalled");
  if (visible.length === 0) return null;

  const needs = visible.filter((s) => s.status === "error");
  const ok = needs.length === 0;
  const dot = ok ? "bg-[#01a0be]" : "bg-amber-400";

  // A store connected with the customer's own app (Prerelease) lives ONLY on the prerelease page;
  // linking it to /integrations/shopify would land on a page that filters it out and then
  // auto-launches the shared OAuth. Route each store to the page that owns it.
  const isPrereleaseStore = (s) => s.authMethod === "custom_oauth" || s.authMethod === "custom_app";
  const pageFor = (s) => (isPrereleaseStore(s) ? "/integrations/shopify-deprecated" : "/integrations/shopify");

  let label;
  // Multi-store aggregate link: prerelease page only if every store is prerelease, else the shared page.
  let href = visible.length > 0 && visible.every(isPrereleaseStore)
    ? "/integrations/shopify-deprecated"
    : "/integrations/shopify";
  if (visible.length === 1) {
    const s = visible[0];
    href = `${pageFor(s)}?shop=${encodeURIComponent(s.shopDomain)}`;
    const last = relTime(s.lastSyncAt);
    label = (
      <>
        <span className="font-medium text-neutral-200">{s.shopDomain}</span>
        <span className="mx-1.5 text-neutral-600">·</span>
        <span className={ok ? "text-neutral-400" : "text-amber-300"}>
          {ok ? (last ? `synced ${last}` : "connected") : "reconnect needed"}
        </span>
      </>
    );
  } else {
    label = (
      <>
        <span className="font-medium text-neutral-200">{visible.length} stores connected</span>
        {!ok && (
          <>
            <span className="mx-1.5 text-neutral-600">·</span>
            <span className="text-amber-300">{needs.length} need attention</span>
          </>
        )}
      </>
    );
  }

  return (
    <Link
      href={href}
      className="group mb-10 flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-2.5 text-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900/50"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {ok && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-70`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="ml-auto shrink-0 pl-2 font-medium text-neutral-500 transition-colors group-hover:text-[#01a0be]">
        Manage →
      </span>
    </Link>
  );
}

// One of the two equal-weight primary actions (Sync / Export).
function PrimaryTile({ href, icon, title, desc, cta }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-[#01a0be]/40 hover:bg-neutral-900/60 sm:p-7"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#01a0be]/20 bg-[#01a0be]/10 text-[#01a0be]">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-400">{desc}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#01a0be]">
        {cta}
        {ARROW}
      </span>
    </Link>
  );
}

// The authenticated home: a calm "pick your path" screen.
function AuthedHome({ firstName, hasStores, stores }) {
  // If every connected store is a Prerelease (bring-your-own-app) store, the "Manage stores" tile
  // should open the prerelease page (that's the page that owns them); otherwise the shared page.
  const allPrerelease = (stores?.length ?? 0) > 0 &&
    stores.every((s) => s.authMethod === "custom_oauth" || s.authMethod === "custom_app");
  const shopifyHref = allPrerelease ? "/integrations/shopify-deprecated" : "/integrations/shopify";
  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="animate-fade-in">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {firstName ? `Hi, ${firstName}` : "Welcome"}
            </h1>
            <p className="mt-3 text-base text-neutral-400">What would you like to do?</p>
          </div>

          <StatusStrip stores={stores} />

          {/* Two equal primary paths */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PrimaryTile
              href={shopifyHref}
              icon="shopify"
              title="Sync to your store"
              desc="Connect Shopify once and keep it stocked automatically — stock, prices, products and images."
              cta={hasStores ? "Manage stores" : "Connect store"}
            />
            <PrimaryTile
              href="/export"
              icon="export"
              title="Export your catalog"
              desc="Download Shopify CSV, JSON or XML — or build a reusable export feed for any system."
              cta="Open exports"
            />
          </div>

          {/* Quiet secondary links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-neutral-800/60 pt-6 text-sm text-neutral-500">
            <Link href="/product" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#01a0be]">
              <Icon name="catalog" className="h-4 w-4" />
              Browse catalog
            </Link>
            <Link href="/categories" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#01a0be]">
              <Icon name="categories" className="h-4 w-4" />
              AI categories
            </Link>
            <Link href="/integrations/own-sources" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#01a0be]">
              <Icon name="ownSources" className="h-4 w-4" />
              Own sources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// No export role → just point them at the catalog.
function BrowseOnlyHome({ firstName }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center py-20">
      <div className="relative mx-auto w-full max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          <h1 className="font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {firstName ? `Hi, ${firstName}` : "Welcome"}
          </h1>
          <p className="mt-3 text-base text-neutral-400">
            Browse Patrik International&apos;s live catalog — real stock, pricing and variants.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/product"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#01a0be] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#018a9f]"
            >
              <Icon name="catalog" className="h-5 w-5" />
              Browse the catalog
              {ARROW}
            </Link>
            <p className="text-sm text-neutral-500">
              Need exports or store sync?{" "}
              <Link href="/contact" className="font-medium text-neutral-300 transition-colors hover:text-[#01a0be]">
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    const roles = user["https://time-4-action.com/roles"] ?? [];
    const firstName = user.name?.split(" ")[0];

    if (!roles.includes("export")) {
      return <BrowseOnlyHome firstName={firstName} />;
    }

    let stores = [];
    try {
      const { token } = await auth0.getAccessToken();
      stores = (await getConnections(token)).filter((c) => c.status !== "uninstalled");
    } catch {
      stores = [];
    }

    return <AuthedHome firstName={firstName} hasStores={stores.length > 0} stores={stores} />;
  }

  // Public / logged-out view — one clean focal point.
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-16 lg:px-8">
      <div className="relative mx-auto w-full max-w-2xl text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#01a0be]">
            Patrik International
          </div>

          <h1 className="mt-8 font-orbitron text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Live product data,{" "}
            <span className="bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent">
              built for partners.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-400">
            Direct access to the live catalog — export it in any format, or sync it straight to your
            store.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Partner Login
            </a>
            <a
              href="/contact"
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-[#01a0be]"
            >
              Request access →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
