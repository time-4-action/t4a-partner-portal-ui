/**
 * Root Layout Component
 *
 * The main layout wrapper for the entire Next.js application.
 * Configures global fonts, metadata, animated background, and navigation.
 *
 * Features:
 * - Custom Google Fonts (Orbitron for headings, Montserrat for body)
 * - Animated blob background with multiple layers
 * - Persistent navigation bar
 * - CSS custom properties for font access
 *
 * @module RootLayout
 */

import { Orbitron, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

/**
 * Orbitron font configuration for headings and branding.
 * Exposed via CSS custom property --font-orbitron.
 */
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700"],
});

/**
 * Montserrat font configuration for body text.
 * Exposed via CSS custom property --font-montserrat.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
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
 * Renders the HTML structure with animated background blobs and navigation.
 *
 * Background Implementation:
 * - 8 animated blob elements with varying sizes, colors, and positions
 * - Uses CSS custom animations (animate-blob, animate-blob2, animate-blob3)
 * - Blobs are positioned absolutely and layered behind content (z-index)
 * - Blue/cyan color scheme with low opacity for subtle effect
 * - Blur filters create soft, organic shapes
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @returns {JSX.Element} HTML document structure with background and navigation
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${montserrat.variable}`}>
      <body>
        <div className="relative min-h-screen overflow-hidden">
          {/* Animated Background Blobs - Creates depth and visual interest */}
          <div className="absolute top-[-10%] left-[5%] w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-[10%] right-[5%] w-80 h-80 bg-cyan-500/20 rounded-full filter blur-3xl animate-blob2"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-sky-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-blue-700/10 rounded-full filter blur-2xl animate-blob3 animation-delay-2000"></div>
          <div className="absolute bottom-[15%] right-[15%] w-64 h-64 bg-cyan-400/20 rounded-full filter blur-3xl animate-blob2 animation-delay-6000"></div>
          <div className="absolute bottom-[40%] left-[10%] w-56 h-56 bg-sky-400/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-[25%] left-[30%] w-48 h-48 bg-blue-400/10 rounded-full filter blur-2xl animate-blob3"></div>
          <div className="absolute bottom-[5%] right-[35%] w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

          {/* Main Content Layer - Positioned above background */}
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
