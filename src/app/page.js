import Link from "next/link";
import {
  Boxes,
  Download,
  Tags,
  Store,
  Rss,
  Blocks,
  LifeBuoy,
  Mail,
  History,
  ShieldCheck,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { auth0 } from "../lib/auth0";
import { cn } from "@/lib/utils";
import { btn } from "@/lib/ui";

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

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

/* ── section catalogue (mirrors the admin's app/(home)/sections.ts) ───────── */

const SUPPORT = {
  label: "Support",
  icon: LifeBuoy,
  color: "text-slate-500",
  bg: "bg-slate-500/10",
  cards: [
    { href: "/contact", icon: Mail, title: "Contact", desc: "Questions, access requests, feedback" },
    { href: "/changelog", icon: History, title: "Changelog", desc: "Every portal & API release" },
    { href: "/privacy", icon: ShieldCheck, title: "Privacy", desc: "What we store and why" },
  ],
};

function exportSections(shopifyHref, hasStores) {
  return [
    {
      label: "Products",
      icon: Boxes,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      cards: [
        { href: "/product", icon: Boxes, title: "View all", desc: "Browse the live catalog — stock, pricing, variants" },
        { href: "/export", icon: Download, title: "Export", desc: "Shopify CSV, JSON, XML or a reusable feed" },
        { href: "/categories", icon: Tags, title: "Categories", desc: "AI category sets per export" },
      ],
    },
    {
      label: "Integrations",
      icon: Blocks,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      cards: [
        {
          href: shopifyHref,
          icon: Store,
          title: "Shopify",
          desc: hasStores ? "Manage connected stores and sync settings" : "Connect a store and keep it stocked automatically",
        },
        { href: "/integrations/own-sources", icon: Rss, title: "Own sources", desc: "Push your own brand feeds alongside Patrik" },
      ],
    },
    SUPPORT,
  ];
}

const BROWSE_SECTIONS = [
  {
    label: "Catalog",
    icon: Boxes,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    cards: [{ href: "/product", icon: Boxes, title: "Products", desc: "Browse the live catalog — stock, pricing, variants" }],
  },
  SUPPORT,
];

/* ── pieces ───────────────────────────────────────────────────────────────── */

// A single quiet line summarising connected stores. Brand when healthy, amber when
// a store needs reconnecting. Hidden entirely when nothing is connected.
function StatusStrip({ stores, href }) {
  const visible = (stores ?? []).filter((s) => s.status !== "uninstalled");
  if (visible.length === 0) return null;
  const needs = visible.filter((s) => s.status === "needs_reauth");
  const ok = needs.length === 0;
  const dot = ok ? "bg-accent-brand" : "bg-amber-400";

  let label;
  if (visible.length === 1) {
    const s = visible[0];
    const last = relTime(s.lastSyncAt);
    label = (
      <>
        <span className="font-medium text-foreground">{s.shopDomain}</span>
        <span className="mx-1.5 text-muted-foreground/70">·</span>
        <span className={ok ? "text-muted-foreground" : "text-amber-fg"}>{ok ? (last ? `synced ${last}` : "connected") : "reconnect needed"}</span>
      </>
    );
  } else {
    label = (
      <>
        <span className="font-medium text-foreground">{visible.length} stores connected</span>
        {!ok && (
          <>
            <span className="mx-1.5 text-muted-foreground/70">·</span>
            <span className="text-amber-fg">{needs.length} need attention</span>
          </>
        )}
      </>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] shadow-sm transition-colors hover:bg-muted/40 reveal"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {ok && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-70`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 shrink-0" aria-hidden />
    </Link>
  );
}

// The admin welcome page, one to one: hero header + a balanced grid of section
// panels, each a list of link rows with a coloured icon chip.
function Launcher({ firstName, subtitle, sections, strip }) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-none reveal mb-0">
            {firstName ? `Welcome back, ${firstName}` : "Welcome"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2 reveal" style={{ animationDelay: "40ms" }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {strip}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {sections.map(({ label, icon: SectionIcon, color, bg, cards }, si) => (
              <section
                key={label}
                className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden reveal"
                style={{ animationDelay: `${si * 50}ms` }}
              >
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-muted/30">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <SectionIcon className={`w-4 h-4 ${color}`} />
                  </span>
                  <h2 className="text-[13px] font-semibold text-foreground tracking-tight flex-1 mb-0">{label}</h2>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full tabular-nums">{cards.length}</span>
                </div>
                <div className="divide-y divide-border/50">
                  {cards.map(({ href, icon: Icon, title, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:bg-muted/40"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-[18px] h-[18px] ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-foreground leading-tight truncate group-hover:underline">{title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug truncate">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 shrink-0" aria-hidden />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
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
      return (
        <Launcher
          firstName={firstName}
          subtitle="Browse Patrik International's live catalog — real stock, pricing and variants. Need exports or store sync? Contact us to request access."
          sections={BROWSE_SECTIONS}
        />
      );
    }

    let stores = [];
    try {
      const { token } = await auth0.getAccessToken();
      stores = (await getConnections(token)).filter((c) => c.status !== "uninstalled");
    } catch {
      stores = [];
    }
    // If every connected store is a Prerelease (bring-your-own-app) store, the Shopify card should
    // open the deprecated page (that's the page that owns them); otherwise the shared page.
    const allPrerelease = stores.length > 0 && stores.every((s) => s.authMethod === "custom_oauth" || s.authMethod === "custom_app");
    const shopifyHref = allPrerelease ? "/integrations/shopify-deprecated" : "/integrations/shopify";

    return (
      <Launcher
        firstName={firstName}
        subtitle="Jump into any of the tools you have access to."
        sections={exportSections(shopifyHref, stores.length > 0)}
        strip={<StatusStrip stores={stores} href={shopifyHref} />}
      />
    );
  }

  // Public / logged-out view — one clean focal point.
  return (
    <div className="relative flex min-h-full flex-col justify-center px-6 py-16 lg:px-8">
      <div className="relative mx-auto w-full max-w-2xl text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-brand/30 bg-accent-brand/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-accent-brand">
            Patrik International
          </div>

          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Live product data, <span className="text-accent-brand">built for partners.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Direct access to the live catalog — export it in any format, or sync it straight to your store.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/auth/login" className={cn(btn.base, btn.variant.default, btn.size.lg, "w-full sm:w-auto")}>
              <LogIn />
              Partner Login
            </a>
            <a href="/contact" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              Request access →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
