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

/**
 * Middleware proxy function that delegates to Auth0's middleware handler.
 * This runs on every request that matches the config.matcher pattern.
 *
 * @param {Request} request - The incoming HTTP request object
 * @returns {Promise<Response>} The response from Auth0 middleware or undefined to continue
 */
export async function proxy(request) {
  return await auth0.middleware(request);
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
