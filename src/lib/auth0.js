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
const ROLES_CLAIM = "https://time-4-action.com/roles";

export const auth0 = new Auth0Client({
    authorizationParameters: {
        scope: "openid profile email offline_access",
        // audience must be set so getAccessToken() returns a JWT the backend can verify.
        // Add AUTH0_AUDIENCE=https://api.time-4-action.com to .env
        audience: process.env.AUTH0_AUDIENCE,
    },
    // Auth0 v4 strips non-standard claims by default. Preserve the roles claim.
    async beforeSessionSaved(session) {
        return {
            ...session,
            user: {
                ...session.user,
                [ROLES_CLAIM]: session.user[ROLES_CLAIM] ?? [],
            },
        };
    },
});