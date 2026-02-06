/**
 * Auth0 Client Configuration
 *
 * This module initializes and exports the Auth0 client for server-side authentication.
 * The client is configured using environment variables (AUTH0_DOMAIN, AUTH0_CLIENT_ID, etc.)
 * and provides methods for protecting routes and handling authentication flow.
 *
 * This singleton pattern ensures a single Auth0 client instance is shared across
 * the application, preventing multiple client initializations and potential
 * configuration conflicts.
 *
 * @module auth0
 * @see {@link https://auth0.com/docs/quickstart/webapp/nextjs Auth0 Next.js Quickstart}
 */

import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * The Auth0 client instance used throughout the application.
 * Automatically configured from environment variables:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain
 * - AUTH0_CLIENT_ID: Your Auth0 application client ID
 * - AUTH0_CLIENT_SECRET: Your Auth0 application client secret
 * - AUTH0_SECRET: Secret for session encryption
 * - AUTH0_BASE_URL: Application base URL for callbacks
 *
 * @type {Auth0Client}
 */
export const auth0 = new Auth0Client();