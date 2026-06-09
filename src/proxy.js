/**
 * Auth0 Middleware Proxy Configuration
 *
 * This file configures Next.js middleware to handle Auth0 authentication across the application.
 * It acts as a proxy for the Auth0 middleware, allowing centralized authentication handling.
 *
 * NOTE: This proxy exists due to an API inconsistency in the @auth0/nextjs-auth0 package.
 * The standard middleware.js approach may not work correctly in all scenarios, so this
 * proxy pattern is used as a workaround.
 *
 * The matcher pattern ensures the middleware runs on all routes except static assets,
 * API routes starting with _next, and common static files.
 *
 * @module proxy
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware Next.js Middleware}
 */

import { auth0 } from "./lib/auth0";
import { NextResponse } from "next/server";

const ROLES_CLAIM = "https://time-4-action.com/roles";
const REQUIRED_ROLE = "export";

/**
 * Middleware proxy function that delegates to Auth0's middleware handler
 * and enforces the `export` role gate on all protected routes.
 *
 * @param {Request} request - The incoming HTTP request object
 * @returns {Promise<Response>} The response from Auth0 middleware or a redirect
 */
export async function proxy(request) {
  const authResponse = await auth0.middleware(request);

  // Let Auth0 routes and the unauthorized page pass through
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname === "/unauthorized"
  ) {
    return authResponse;
  }

  // Use auth0.getSession() so the encrypted session cookie is properly decrypted
  const session = await auth0.getSession(request);
  if (!session) {
    // Not logged in — auth0.middleware already handles the login redirect
    return authResponse;
  }

  const roles = session.user[ROLES_CLAIM] ?? [];

  if (!roles.includes(REQUIRED_ROLE)) {
    // Carry a pending Shopify-connect intent (a partner who opened the app from Shopify but
    // isn't enabled yet) so /unauthorized can show a tailored "request access" screen naming
    // the store, instead of the generic wall.
    const dest = new URL("/unauthorized", request.url);
    const shop = request.nextUrl.searchParams.get("shop");
    if (shop) {
      dest.searchParams.set("shop", shop);
      dest.searchParams.set("reason", "shopify");
    }
    return NextResponse.redirect(dest);
  }

  return authResponse;
}

/**
 * Middleware configuration that defines which routes should be processed.
 *
 * The matcher uses a negative lookahead regex to exclude:
 * - _next/static: Next.js static assets
 * - _next/image: Next.js Image Optimization API
 * - favicon.ico: Site favicon
 * - sitemap.xml: Sitemap file
 * - robots.txt: Robots exclusion file
 *
 * All other routes will be processed by the Auth0 middleware.
 *
 * @type {Object}
 * @property {string[]} matcher - Array of path patterns to match
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
