import { auth0 } from "../lib/auth0";

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

const CHECK = (
  <svg className="h-3 w-3 text-[#01a0be]/60 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const ARROW = (
  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

/* ── feature definitions ──────────────────────────────────────────────────── */
const BROWSE_FEATURES = [
  {
    href: "/product",
    icon: "catalog",
    title: "Product Catalog",
    desc: "Browse the full Patrik International range with real-time inventory, pricing, and variant details.",
    points: ["Live inventory counts", "Pricing & pricelists", "Variants & SKUs"],
    cta: "View catalog",
  },
  {
    href: "/export",
    icon: "export",
    title: "Product Exports",
    desc: "Export product data in ready-to-use formats — or build a reusable custom export config.",
    points: ["Shopify, CSV, JSON & XML", "Presets & custom configs", "API keys & shared access"],
    cta: "Go to exports",
  },
  {
    href: "/categories",
    icon: "categories",
    title: "AI Categories",
    desc: "Organize the catalog with AI-assigned categories, scoped per export and carried through as Shopify tags.",
    points: ["AI category management", "Per-export mapping", "Hierarchical tags"],
    cta: "Manage categories",
  },
];

const INTEGRATION_FEATURES = [
  {
    href: "/integrations/shopify",
    icon: "shopify",
    title: "Shopify Sync",
    desc: "Push your catalog straight into your Shopify store and keep it current automatically — no exports, no manual imports.",
    points: [
      "Stock, prices, products, descriptions & images",
      "Multiple stores per account",
      "Automatic sync on every catalog update",
    ],
    cta: "Open Shopify",
  },
  {
    href: "/integrations/own-sources",
    icon: "ownSources",
    title: "Own Sources",
    desc: "Resell other brands too? Register their product feeds and push them through the very same Shopify sync.",
    points: [
      "Bring your own supplier feeds",
      "Validate before you import",
      "Scheduled, hands-off updates",
    ],
    cta: "Add a source",
  },
];

/* ── card ─────────────────────────────────────────────────────────────────── */
function FeatureCard({ href, icon, title, desc, points, cta }) {
  return (
    <a
      href={href}
      className="group relative flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-7 transition-all duration-300 hover:border-[#01a0be]/50 hover:bg-neutral-900/80 hover:shadow-[0_0_40px_rgba(1,160,190,0.1)] overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#01a0be]/5 rounded-full -translate-y-10 translate-x-10 group-hover:bg-[#01a0be]/10 transition-colors duration-300 pointer-events-none" />

      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01a0be]/10 border border-[#01a0be]/20 transition-colors group-hover:bg-[#01a0be]/20 relative">
        <svg className="h-6 w-6 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {ICONS[icon]}
        </svg>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#01a0be] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
        <ul className="mt-4 space-y-1.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2 text-xs text-neutral-500">
              {CHECK}
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#01a0be]">
        {cta}
        {ARROW}
      </div>
    </a>
  );
}

function SectionLabel({ children, hint }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-[family-name:var(--font-montserrat)] text-xs font-semibold uppercase tracking-widest leading-none text-neutral-500">
        {children}
      </span>
      {hint && <span className="text-xs leading-none text-neutral-600">{hint}</span>}
      <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent" />
    </div>
  );
}

async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;
  const roles = user?.["https://time-4-action.com/roles"] ?? [];
  const canIntegrate = roles.includes("export");

  if (user) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] py-16">
        <div className="relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs font-medium text-[#01a0be] tracking-widest uppercase mb-5">
              Partner Portal
            </div>
            <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent">
                {user.name?.split(" ")[0] ?? "Partner"}
              </span>
            </h1>
            <p className="mt-4 text-base text-neutral-400 max-w-2xl">
              Browse live product data from Patrik International, export it in any format, and sync it
              straight to your store.
            </p>
          </div>

          {/* Live status strip */}
          <div className="mb-10 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-3 backdrop-blur-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#01a0be] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#01a0be]"></span>
            </span>
            <span className="text-sm text-neutral-400">Live data sync active — product catalog is up to date</span>
          </div>

          {/* Browse & export */}
          <section className="mb-12">
            <SectionLabel>Browse &amp; export</SectionLabel>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BROWSE_FEATURES.map((f) => (
                <FeatureCard key={f.href} {...f} />
              ))}
            </div>
          </section>

          {/* Integrations */}
          {canIntegrate && (
            <section>
              <SectionLabel hint="Connect your store">Integrations</SectionLabel>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {INTEGRATION_FEATURES.map((f) => (
                  <FeatureCard key={f.href} {...f} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // Public / logged-out view
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-16 lg:px-8">
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs font-medium text-[#01a0be] tracking-widest uppercase mb-8">
            Patrik International
          </div>

          <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Live Product Data.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent">
              Built for Partners.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-neutral-400 max-w-2xl mx-auto">
            This portal gives you direct access to{" "}
            <span className="text-neutral-200 font-medium">Patrik International&apos;s</span> live
            product catalog — real inventory, real pricing, and a one-click sync straight to your
            Shopify store. No delays, no spreadsheets.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] hover:shadow-[#01a0be]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Partner Login
            </a>
            <a
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 px-7 py-3.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white backdrop-blur-sm"
            >
              Request Access
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent mb-14" />

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {ICONS.catalog}
                </svg>
              ),
              title: "Live Catalog",
              desc: "Patrik International's full range with real-time stock, pricing, and variant data.",
            },
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {ICONS.export}
                </svg>
              ),
              title: "Ready-to-Use Exports",
              desc: "Download product data in Shopify, CSV, JSON, and XML — formatted to import anywhere.",
            },
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {ICONS.shopify}
                </svg>
              ),
              title: "Direct Shopify Sync",
              desc: "Connect your store and push stock, prices, products, and images automatically.",
            },
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {ICONS.ownSources}
                </svg>
              ),
              title: "Your Own Brands Too",
              desc: "Register your other suppliers' feeds and sync them through the same pipeline.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#01a0be]/10 border border-[#01a0be]/20">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
