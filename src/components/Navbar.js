/**
 * Navbar Component
 *
 * Main navigation bar with Auth0 integration for user authentication.
 * Features include:
 * - Responsive desktop and mobile layouts
 * - Grouped navigation: related export tools collapse into an "Exports" dropdown
 * - Active-route highlighting (desktop + mobile)
 * - Auth0 user authentication status
 * - Profile dropdown menu (desktop)
 * - Mobile hamburger menu with grouped sections
 * - Sticky positioning with backdrop blur
 *
 * @module Navbar
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

/**
 * Outline icon paths (Heroicons v2) keyed by name, rendered by <NavIcon />.
 */
const ICON_PATHS = {
  home: [
    "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  ],
  products: [
    "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z",
  ],
  exports: [
    "M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122",
  ],
  contact: [
    "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75",
  ],
  export: [
    "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5",
    "M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3",
  ],
  categories: [
    "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z",
    "M6 6h.008v.008H6V6Z",
  ],
  shopify: [
    "M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z",
  ],
};

/**
 * Renders a stroked SVG icon by name. Returns null for unknown names.
 */
function NavIcon({ name, className = "h-5 w-5" }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

/**
 * Small pill used to flag a nav item's status (e.g. "Alpha" for the
 * not-yet-wired Shopify integration). Amber to read as "experimental".
 */
function NavBadge({ label, className = "" }) {
  return (
    <span
      className={`rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/30 ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Returns navigation items. The export-role tools (Export, Categories, Shopify)
 * are grouped under a single "Exports" dropdown to keep the top bar compact.
 * Roles are injected into the ID token via an Auth0 Post Login Action.
 *
 * Item shape:
 * - Plain link:   { href, label }
 * - Group:        { label, children: [{ href, label, description, icon }] }
 */
function getNavLinks(user) {
  const roles = user?.["https://time-4-action.com/roles"] ?? [];
  const links = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/product", label: "Products", icon: "products" },
  ];
  if (roles.includes("export")) {
    links.push({
      label: "Exports",
      icon: "exports",
      children: [
        {
          href: "/export",
          label: "Export",
          description: "Presets & custom export configs",
          icon: "export",
        },
        {
          href: "/categories",
          label: "Categories",
          description: "AI category management",
          icon: "categories",
        },
        {
          href: "/integrations/shopify",
          label: "Shopify",
          description: "Sync products to your store",
          icon: "shopify",
          badge: "Alpha",
        },
      ],
    });
  }
  links.push({ href: "/contact", label: "Contact", icon: "contact" });
  return links;
}

/**
 * True when `href` matches the current path. The root ("/") matches exactly;
 * everything else matches itself and any nested route (e.g. /integrations/shopify/x).
 */
function isActive(pathname, href) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Desktop dropdown for a grouped nav item. Opens on click, closes on outside
 * click or Escape. The trigger is highlighted when open or when one of its
 * children is the active route.
 */
function NavDropdown({ group, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const groupActive = group.children.some((c) => isActive(pathname, c.href));

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01a0be]/60 ${
          groupActive || open
            ? "text-[#01a0be]"
            : "text-neutral-300 hover:text-[#01a0be]"
        }`}
      >
        <NavIcon name={group.icon} className="h-4 w-4" />
        {group.label}
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-dropdown origin-top-left absolute left-0 mt-2 w-64 rounded-xl bg-neutral-900/95 backdrop-blur-md p-1.5 shadow-xl shadow-black/40 ring-1 ring-neutral-700/60"
          role="menu"
          aria-label={group.label}
        >
          {group.children.map((child) => {
            const active = isActive(pathname, child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-[#01a0be]/10 text-[#01a0be]"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors ${
                    active
                      ? "bg-[#01a0be]/15 text-[#01a0be] ring-[#01a0be]/30"
                      : "bg-neutral-800 text-neutral-400 ring-neutral-700 group-hover:text-[#01a0be]"
                  }`}
                >
                  <NavIcon name={child.icon} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {child.label}
                    {child.badge && <NavBadge label={child.badge} />}
                  </span>
                  <span className="block text-xs text-neutral-500">{child.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Navbar Component
 *
 * Renders the application's main navigation with Auth0 authentication integration.
 * Displays user profile when logged in, or login button when logged out.
 *
 * Mobile Behavior:
 * - Hamburger menu with overlay
 * - Grouped sections (e.g. "Exports") with indented sub-links
 * - Simplified auth buttons
 *
 * Desktop Behavior:
 * - Inline navigation links with hover/active underline
 * - Grouped items render as a dropdown with icons and descriptions
 * - Profile dropdown with user info and logout
 * - Click-outside / Escape detection to close menus
 *
 * @returns {JSX.Element} Navigation bar with authentication
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isLoading } = useUser(); // Auth0 hook for user state
  const profileMenuRef = useRef(null);
  const pathname = usePathname();
  const navLinks = getNavLinks(user);

  /**
   * Effect to close profile dropdown when clicking outside.
   * Uses ref detection to identify clicks outside the dropdown element.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      <nav className="bg-black/60 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-4">
                <Image
                  src="https://imgs.pnvnet.si/img/615/301/75/2/c/www.patrikinternational.com/assets/page_info/0308183001671536508.png"
                  alt="Patrik International Logo"
                  width={120}
                  height={60}
                />
                <span className="hidden sm:block font-orbitron font-semibold text-white text-lg tracking-wide">
                  Partner Portal
                </span>
              </Link>
            </div>
            {/* Desktop Menu & Auth */}
            <div className="hidden md:flex md:items-center md:gap-x-6">
              <div className="flex items-center space-x-1">
                {navLinks.map((link) =>
                  link.children ? (
                    <NavDropdown key={link.label} group={link} pathname={pathname} />
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      className={`relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-[6px] after:h-[2px] after:bg-[#01a0be] after:origin-left after:transition-transform after:duration-300 ${
                        isActive(pathname, link.href)
                          ? "text-[#01a0be] after:scale-x-100"
                          : "text-neutral-300 hover:text-[#01a0be] after:scale-x-0 hover:after:scale-x-100"
                      }`}
                    >
                      <NavIcon name={link.icon} className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                )}
              </div>
              <div className="flex items-center">
                {isLoading ? (
                  <div className="w-8 h-8 bg-neutral-700 rounded-full animate-pulse"></div>
                ) : user ? (
                  <div className="ml-3 relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      type="button"
                      className="flex items-center gap-x-2 rounded-full bg-neutral-800/50 hover:bg-neutral-700/80 p-1 pr-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white"
                      id="user-menu-button"
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="relative h-8 w-8">
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={user.picture}
                          alt={user.name}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <span className="hidden sm:block font-medium truncate max-w-[150px]">{user.name}</span>
                    </button>
                    {isProfileMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-neutral-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <div className="px-4 py-2 text-sm text-neutral-300 border-b border-neutral-700 cursor-pointer">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                        </div>
                        <a
                          href="/auth/logout"
                          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white w-full text-left"
                          role="menuitem"
                        >
                          Log Out
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className="rounded-md bg-[#01a0be] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]"
                  >
                    Partner Login
                  </a>
                )}
              </div>
            </div>
            {/* Mobile Menu Button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu, show/hide based on menu state. */}
        {isMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="pt-2">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {link.label}
                    </p>
                    {link.children.map((child) => {
                      const active = isActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium ${
                            active
                              ? "bg-[#01a0be]/10 text-[#01a0be]"
                              : "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                          }`}
                        >
                          <NavIcon name={child.icon} className="h-5 w-5 shrink-0" />
                          {child.label}
                          {child.badge && <NavBadge label={child.badge} className="ml-auto" />}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(pathname, link.href) ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium ${
                      isActive(pathname, link.href)
                        ? "bg-[#01a0be]/10 text-[#01a0be]"
                        : "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    }`}
                  >
                    <NavIcon name={link.icon} className="h-5 w-5 shrink-0" />
                    {link.label}
                  </Link>
                )
              )}
              {/* Auth buttons for mobile */}
              <div className="border-t border-neutral-700 pt-4 mt-4">
                {user ? (
                   <a href="/auth/logout" className="text-neutral-300 hover:bg-neutral-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                     Log Out
                   </a>
                ) : (
                  <a href="/auth/login" className="text-neutral-300 hover:bg-neutral-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Partner Login
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
