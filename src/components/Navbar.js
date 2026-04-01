/**
 * Navbar Component
 *
 * Main navigation bar with Auth0 integration for user authentication.
 * Features include:
 * - Responsive desktop and mobile layouts
 * - Auth0 user authentication status
 * - Profile dropdown menu (desktop)
 * - Mobile hamburger menu
 * - Sticky positioning with backdrop blur
 *
 * @module Navbar
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

/**
 * Returns navigation links. Export is hidden for users without the 'export' role.
 * Roles are injected into the ID token via an Auth0 Post Login Action.
 */
function getNavLinks(user) {
  const roles = user?.["https://time-4-action.com/roles"] ?? [];
  const links = [
    { href: "/", label: "Home" },
    { href: "/product", label: "Products" },
  ];
  if (roles.includes("export")) {
    links.push({ href: "/export", label: "Export" });
    links.push({ href: "/categories", label: "Categories" });
  }
  links.push({ href: "/contact", label: "Contact" });
  return links;
}

/**
 * Navbar Component
 *
 * Renders the application's main navigation with Auth0 authentication integration.
 * Displays user profile when logged in, or login button when logged out.
 *
 * Mobile Behavior:
 * - Hamburger menu with overlay
 * - Simplified auth buttons
 *
 * Desktop Behavior:
 * - Inline navigation links with hover effects
 * - Profile dropdown with user info and logout
 * - Click-outside detection to close dropdown
 *
 * @returns {JSX.Element} Navigation bar with authentication
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isLoading } = useUser(); // Auth0 hook for user state
  const profileMenuRef = useRef(null);
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
              <div className="flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="relative text-neutral-300 hover:text-[#01a0be] px-3 py-2 text-sm font-medium transition-colors after:content-[''] after:absolute after:left-0 after:bottom-[6px] after:h-[2px] after:w-full after:bg-[#01a0be] after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
                  >
                    {link.label}
                  </Link>
                ))}
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
                aria-expanded="false"
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
              {navLinks.map((link) => (
                <Link 
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-neutral-300 hover:bg-neutral-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >{link.label}</Link>
              ))}
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