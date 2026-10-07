/**
 * Root Layout Component
 *
 * The main layout wrapper for the entire Next.js application. Shares its
 * chrome with t4a-admin: Geist Sans / Geist Mono, the same design tokens
 * (globals.css) and the same light / system / dark theme plumbing.
 *
 * Features:
 * - Geist fonts exposed as --font-geist-sans / --font-geist-mono
 * - Theme bootstrap: an inline <head> script applies `.dark` on <html> before
 *   first paint (stored choice, else prefers-color-scheme) so there is no flash
 *   of the wrong theme; ThemeProvider then keeps React in sync
 * - Admin app shell: left sidebar (Navbar) + a single scrolling <main>
 *
 * @module RootLayout
 */

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/theme-context";
import { THEME_BOOTSTRAP } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata for SEO and browser display.
 * Defines title, description, and favicon.
 */
export const metadata = {
  title: "Patrik Partner Portal",
  description: "Product overview for Patrik International.",
  icons: {
    icon: "https://www.patrikinternational.com/favicon.ico",
  },
};

/**
 * Root Layout Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @returns {JSX.Element} HTML document structure with navigation
 */
export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the bootstrap script sets the .dark class and
    // color-scheme before React hydrates, so <html> intentionally differs from SSR.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="antialiased flex h-screen overflow-hidden bg-background text-foreground">
        <ThemeProvider>
          {/* Same shell as the admin: sidebar + one scrolling main region. */}
          <Navbar />
          <main className="flex-1 min-w-0 overflow-y-auto bg-background pt-12 md:pt-0">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
