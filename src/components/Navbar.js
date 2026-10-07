/**
 * Navbar — the portal's primary navigation: a left sidebar that is a direct
 * port of t4a-admin's `components/nav.tsx` (same chrome, sizes, accordion
 * sections with coloured icon chips, collapsed 60px rail, mobile top bar +
 * slide-out drawer, theme toggle and user block at the bottom).
 *
 * Only the section catalogue differs: the portal's catalog tools, integrations
 * and support links, gated by the Auth0 `export` role.
 *
 * @module Navbar
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  Home,
  Boxes,
  Download,
  Tags,
  Blocks,
  Store,
  Rss,
  Mail,
  History,
  ShieldCheck,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

/**
 * Section catalogue. `section` keys map to SECTION_STYLE; `exportOnly`
 * sections need the Auth0 `export` role.
 */
const sections = [
  {
    label: "Products",
    section: "products",
    exportOnly: true,
    links: [
      { href: "/product", label: "View All", icon: Boxes, matchPrefix: true },
      { href: "/export", label: "Export", icon: Download, matchPrefix: true },
      { href: "/categories", label: "Categories", icon: Tags, matchPrefix: true },
    ],
  },
  {
    label: "Integrations",
    section: "integrations",
    exportOnly: true,
    links: [
      { href: "/integrations/shopify", label: "Shopify", icon: Store, matchPrefix: true },
      { href: "/integrations/shopify-deprecated", label: "Shopify Deprecated", icon: Store, matchPrefix: true, badge: "Beta" },
      { href: "/integrations/own-sources", label: "Own sources", icon: Rss, matchPrefix: true },
    ],
  },
  {
    label: "Catalog",
    section: "catalog",
    browseOnly: true,
    links: [{ href: "/product", label: "Products", icon: Boxes, matchPrefix: true }],
  },
  {
    label: "Support",
    section: "support",
    links: [
      { href: "/contact", label: "Contact", icon: Mail },
      { href: "/changelog", label: "Changelog", icon: History },
      { href: "/privacy", label: "Privacy", icon: ShieldCheck },
    ],
  },
];

// Per-section identity: a coloured icon chip so each group reads at a glance
// (same palette as the admin: sky = catalog/general, indigo = partners).
const SECTION_STYLE = {
  products: { icon: Boxes, color: "text-sky-500", bg: "bg-sky-500/10" },
  catalog: { icon: Boxes, color: "text-sky-500", bg: "bg-sky-500/10" },
  integrations: { icon: Blocks, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  support: { icon: LifeBuoy, color: "text-slate-500", bg: "bg-slate-500/10" },
};

const OPEN_SECTIONS_KEY = "t4a-nav-open-sections";
const APP_NAME = "Partner Portal";

// Tier badges match the TierGate program chips: alpha = violet, beta = brand.
const BADGE_STYLES = {
  alpha: "bg-violet-500/10 text-violet-fg ring-violet-500/20",
  beta: "bg-accent-brand/10 text-accent-brand ring-accent-brand/20",
};

function NavBadge({ label, className = "" }) {
  const style = BADGE_STYLES[String(label).toLowerCase()] || "bg-amber-500/10 text-amber-fg ring-amber-500/20";
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1", style, className)}>
      {label}
    </span>
  );
}

function UserAvatar({ user, size }) {
  if (user?.picture) {
    return (
      <Image
        src={user.picture}
        alt={user.name ?? "avatar"}
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover ring-1 ring-border"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = (user?.name ?? user?.email ?? "?")
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <span
      className="rounded-full shrink-0 flex items-center justify-center bg-muted text-muted-foreground font-semibold select-none ring-1 ring-border"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

function NavLink({ href, label, icon: Icon, active, open, indent, badge, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={!open ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
"group relative flex items-center gap-2.5 rounded-md text-[13px] transition-all duration-150 h-9",
"",
 open ? (indent ?"pl-3.5 pr-3":"px-3") :"justify-center px-2",
 active ?"bg-background text-foreground font-medium border shadow-xs dark:border-input dark:bg-input/30 dark:hover:bg-input/50":"text-muted-foreground hover:bg-accent hover:text-foreground",
 )}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-brand rounded-r-full" />}
      <Icon className={cn("w-[15px] h-[15px] shrink-0 transition-colors", active ?"text-foreground":"text-muted-foreground/70 group-hover:text-foreground")} />
      {open && <span className="truncate">{label}</span>}
      {open && badge && <NavBadge label={badge} className="ml-auto" />}
    </Link>
  );
}

// Compute whether a link is the active one (exact / prefix match), ceding to a
// more-specific sibling so e.g. /integrations/shopify isn't highlighted on
// /integrations/shopify-deprecated.
function isLinkActive(link, links, pathname) {
  const exact = pathname === link.href;
  const prefixHit = !!link.matchPrefix && pathname.startsWith(link.href + "/");
  const siblingTakesIt = links.some(
    (s) => s.href !== link.href && (pathname === s.href || pathname.startsWith(s.href + "/")) && s.href.length > link.href.length,
  );
  return (exact || prefixHit) && !siblingTakesIt;
}

export default function Navbar() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() || "/";
  const { user, isLoading } = useUser();

  const roles = user?.["https://time-4-action.com/roles"] ?? [];
  const canExport = roles.includes("export");
  const visibleSections = sections.filter((s) => (s.exportOnly ? canExport : s.browseOnly ? !canExport : true));

  // Which section contains the current route — used to auto-open it.
  const activeSectionKey = useMemo(() => {
    const hit = sections.find((s) => s.links.some((l) => pathname === l.href || pathname.startsWith(l.href + "/")));
    return hit?.section ?? null;
  }, [pathname]);

  // Accordion open/closed state, persisted. A section with no explicit entry
  // defaults to open iff it's the active section.
  const [openSections, setOpenSections] = useState({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem(OPEN_SECTIONS_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    // Deferred so the first paint keeps the SSR markup (no hydration mismatch).
    const id = window.setTimeout(() => {
      if (stored) setOpenSections(stored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(openSections));
    } catch {
      /* ignore */
    }
  }, [openSections, hydrated]);

  // Navigating into a section opens it.
  useEffect(() => {
    if (!activeSectionKey) return;
    const id = window.setTimeout(
      () => setOpenSections((prev) => (prev[activeSectionKey] ? prev : { ...prev, [activeSectionKey]: true })),
      0,
    );
    return () => window.clearTimeout(id);
  }, [activeSectionKey]);

  const isExpanded = (key) => openSections[key] ?? key === activeSectionKey;
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !(prev[key] ?? key === activeSectionKey) }));

  // Navigating closes the mobile drawer; the drawer locks page scroll while open.
  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const brand = (compact) => (
    <Link href="/" className="flex items-center gap-2.5 min-w-0">
      <Image
        src="https://imgs.pnvnet.si/img/615/301/75/2/c/www.patrikinternational.com/assets/page_info/0308183001671536508.png"
        alt="Patrik International"
        width={120}
        height={60}
        className={cn("brand-logo w-auto object-contain shrink-0", compact ?"h-5":"h-6")}
      />
      <span className="text-[13px] font-semibold text-foreground truncate">{APP_NAME}</span>
    </Link>
  );

  const navContent = (isMobile) => {
    const isOpen = isMobile ? true : open;
    const homeActive = pathname === "/";
    return (
      <>
        {/* Brand header */}
        <div className={cn("flex items-center h-[57px] shrink-0 px-3 border-b border-border", isOpen ?"justify-between":"justify-center")}>
          {isOpen && brand(false)}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {open ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Nav sections */}
        <div className={cn("flex-1 overflow-y-auto px-2 py-3", isOpen ?"space-y-1":"space-y-4")}>
          <NavLink href="/" label="Home" icon={Home} active={homeActive} open={isOpen} />

          {visibleSections.map((section) => {
            const style = SECTION_STYLE[section.section];
            const SectionIcon = style.icon;

            // Collapsed rail: no headers, just the link icons.
            if (!isOpen) {
              return (
                <div key={section.label} className="space-y-0.5">
                  {section.links.map((link) => (
                    <NavLink key={link.href} {...link} active={isLinkActive(link, section.links, pathname)} open={false} />
                  ))}
                </div>
              );
            }

            // Expanded: collapsible accordion group with a coloured section icon.
            const expanded = isExpanded(section.section);
            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.section)}
                  aria-expanded={expanded}
                  className="flex items-center gap-2.5 w-full rounded-md px-3 text-[13px] font-medium text-foreground hover:bg-accent transition-colors h-9"
                >
                  <span className={cn("w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0", style.bg)}>
                    <SectionIcon className={cn("w-3.5 h-3.5", style.color)} />
                  </span>
                  <span className="flex-1 text-left truncate">{section.label}</span>
                  <ChevronDown
                    className={cn("w-4 h-4 text-muted-foreground/60 transition-transform duration-150 shrink-0", expanded ?"":"-rotate-90")}
                    aria-hidden
                  />
                </button>
                {expanded && (
                  <div className="mt-0.5 mb-1 ml-[18px] pl-2 border-l border-border/60 space-y-0.5">
                    {section.links.map((link) => (
                      <NavLink key={link.href} {...link} active={isLinkActive(link, section.links, pathname)} open indent />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Theme + user */}
        <div className="px-2 pb-2 pt-1 border-t border-border shrink-0 space-y-1.5">
          <div className={cn("px-1", !isOpen &&"flex justify-center")}>{isOpen ? <ThemeToggle /> : <ThemeToggle collapsed />}</div>

          {isLoading ? (
            <div className={cn("flex items-center rounded-xl px-3 py-2 gap-2.5", !isOpen &&"justify-center px-2")}>
              <div className="skeleton h-[26px] w-[26px] rounded-full" />
              {isOpen && (
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2.5 w-32 rounded" />
                </div>
              )}
            </div>
          ) : user ? (
            <div className={cn("flex items-center rounded-xl px-3 py-2 gap-2.5", !isOpen &&"justify-center px-2")}>
              {isOpen ? (
                <>
                  <UserAvatar user={user} size={26} />
                  <div className="flex-1 min-w-0">
                    {user.name && <p className="text-[12px] font-medium text-foreground truncate leading-tight">{user.name}</p>}
                    {user.email && <p className="text-[10px] text-muted-foreground truncate leading-tight">{user.email}</p>}
                  </div>
                  <a
                    href="/auth/logout"
                    title="Logout"
                    aria-label="Logout"
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </a>
                </>
              ) : (
                <a href="/auth/logout" title="Logout" aria-label="Logout">
                  <UserAvatar user={user} size={26} />
                </a>
              )}
            </div>
          ) : (
            <a
              href="/auth/login"
              title={!isOpen ? "Partner Login" : undefined}
              className={cn(
"flex items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
 isOpen ?"h-9 mx-1":"h-9 w-9 mx-auto",
 )}
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              {isOpen && "Partner Login"}
            </a>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-sidebar border-b border-border flex items-center px-3 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-2 min-w-0">{brand(true)}</div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      {/* Mobile slide-out nav */}
      <nav
        aria-label="Primary"
        className={cn(
"md:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-sidebar border-r border-border z-50 flex flex-col transition-transform duration-200",
 mobileOpen ?"translate-x-0":"-translate-x-full",
 )}
      >
        {navContent(true)}
      </nav>

      {/* Desktop sidebar */}
      <nav
        aria-label="Primary"
        className={cn(
"hidden md:flex h-screen flex-col shrink-0 bg-sidebar border-r border-border transition-all duration-200",
 open ?"w-[220px]":"w-[60px]",
 )}
      >
        {navContent(false)}
      </nav>
    </>
  );
}
