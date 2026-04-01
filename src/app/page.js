import { auth0 } from "../lib/auth0";

async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16 lg:px-8">
        <div className="relative mx-auto w-full max-w-5xl">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs font-medium text-[#01a0be] tracking-widest uppercase mb-5">
              Partner Portal
            </div>
            <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent">
                {user.name?.split(" ")[0] ?? "Partner"}
              </span>
            </h1>
            <p className="mt-4 text-base text-neutral-400 max-w-xl">
              Live product data from Patrik International — ready to browse and export.
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

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Product Catalog Card */}
            <a
              href="/product"
              className="group relative flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-8 transition-all duration-300 hover:border-[#01a0be]/50 hover:bg-neutral-900/80 hover:shadow-[0_0_40px_rgba(1,160,190,0.1)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#01a0be]/5 rounded-full -translate-y-10 translate-x-10 group-hover:bg-[#01a0be]/10 transition-colors duration-300 pointer-events-none" />

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01a0be]/10 border border-[#01a0be]/20 transition-colors group-hover:bg-[#01a0be]/20 relative">
                <svg className="h-6 w-6 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-[#01a0be] transition-colors">
                  Product Catalog
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Browse the full product catalog with real-time inventory, pricing, and variant details.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {["Live inventory counts", "Pricing & pricelists", "Product variants & SKUs"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-neutral-500">
                      <svg className="h-3 w-3 text-[#01a0be]/60 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#01a0be]">
                View Catalog
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </a>

            {/* Product Exports Card */}
            <a
              href="/export"
              className="group relative flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-8 transition-all duration-300 hover:border-[#01a0be]/50 hover:bg-neutral-900/80 hover:shadow-[0_0_40px_rgba(1,160,190,0.1)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#01a0be]/5 rounded-full -translate-y-10 translate-x-10 group-hover:bg-[#01a0be]/10 transition-colors duration-300 pointer-events-none" />

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01a0be]/10 border border-[#01a0be]/20 transition-colors group-hover:bg-[#01a0be]/20 relative">
                <svg className="h-6 w-6 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-[#01a0be] transition-colors">
                  Product Exports
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Export product data in multiple formats — ready to import into your platform.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {["Shopify CSV format", "Simple & detailed exports", "Custom field selection"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-neutral-500">
                      <svg className="h-3 w-3 text-[#01a0be]/60 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#01a0be]">
                Go to Exports
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </a>
          </div>
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
            product catalog — real inventory, real pricing, updated in real time. No delays, no
            spreadsheets.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              ),
              title: "Live Catalog",
              desc: "Full access to Patrik International's product range with real-time stock levels, pricing, and variant data.",
            },
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              ),
              title: "Ready-to-Use Exports",
              desc: "Download product data in Shopify, CSV, JSON, and more — formatted and ready to import into your platform.",
            },
            {
              icon: (
                <svg className="h-5 w-5 text-[#01a0be]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Z" />
                </svg>
              ),
              title: "Always Current",
              desc: "Data is pulled directly from Patrik International's systems — no manual updates, no stale information.",
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
