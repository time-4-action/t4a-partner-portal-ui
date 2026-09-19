import ShopifyIntegrationPage from "@/components/ShopifyIntegrationPage";
import TierGate from "@/components/TierGate";
import { FEATURE_TIERS, hasTierAccess } from "@/lib/featureTiers";
import { auth0 } from "@/lib/auth0";

/**
 * Shopify **Deprecated** route (formerly "Prerelease" — Route B, bring-your-own custom app).
 *
 * Same integration surface as `/integrations/shopify`, but stores connect by pasting a custom-app
 * Admin API token (or their own OAuth app credentials) generated in their OWN store admin, instead
 * of installing our public OAuth app. This was the pilot path used before the public app cleared
 * Shopify review; it's now deprecated and kept (behind the `beta` tier) only for stores that already
 * connected this way. The only difference vs the OAuth page is the connect screen
 * (`variant="prerelease"`); everything downstream (sources, sync, activity, disconnect) is identical
 * and shares the same backend.
 */

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

async function getShopifyExportConfigs() {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/custom-export?preset=shopify`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
}

async function getShopifyConnections() {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/shopify/connections`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.connections) ? data.connections : null;
  } catch {
    return null;
  }
}

async function getOwnSources() {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/external/sources`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.sources) ? data.sources : [];
  } catch {
    return [];
  }
}

async function getAiExports(userRoles, userId) {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/exports`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const all = Array.isArray(data?.data) ? data.data : [];
    return all.filter((exp) => {
      const roleOk = !exp.roles?.length || exp.roles.some((r) => userRoles.includes(r));
      const userOk = !exp.users?.length || exp.users.includes(userId);
      return roleOk && userOk;
    });
  } catch {
    return [];
  }
}

async function getShopifyPricelists() {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/shopify/pricelists`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.pricelists ?? [];
  } catch {
    return [];
  }
}

export default async function ShopifyDeprecatedRoute() {
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];
  const userId = session?.user?.sub ?? null;

  if (!roles.includes("export")) {
    return (
      <div className="p-4 md:p-8">
        <div className="contents">
          <div className="p-6 bg-muted/50 border border-input/50 rounded-2xl text-center sm:p-8">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-[15px] font-semibold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">You do not have access to the Shopify Integration feature. Contact your administrator to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  // Beta gate — this legacy connect flow is deprecated and kept behind the beta tier.
  if (!hasTierAccess(roles, FEATURE_TIERS.shopifyDeprecated.tier)) {
    return (
      <div className="p-4 md:p-8">
        <div className="contents">
          <TierGate
            featureKey="shopifyDeprecated"
            userEmail={session?.user?.email}
            userName={session?.user?.name}
          />
        </div>
      </div>
    );
  }

  const [shopifyExports, allConnections, pricelists, ownSources, aiExports] = await Promise.all([
    getShopifyExportConfigs(),
    getShopifyConnections(),
    getShopifyPricelists(),
    getOwnSources(),
    getAiExports(roles, userId),
  ]);

  // This page owns only the bring-your-own-app connections (custom_oauth / custom_app). The shared
  // public-app connections live on /integrations/shopify, so a store never shows on both pages.
  // `null` = the fetch failed → leave it null so the client shows its demo fallback.
  const connections = allConnections === null
    ? null
    : allConnections.filter((c) => c.authMethod === "custom_oauth" || c.authMethod === "custom_app");

  // Fixed URLs the customer pastes into their own Partner Dashboard app. These point at OUR
  // infrastructure, so they're the same for every customer. The redirect URL must EXACTLY equal the
  // API's {SHOPIFY_API_BASE_URL}/shopify/callback-custom — override via env per deployment.
  const apiPublicBase = process.env.SHOPIFY_PUBLIC_API_BASE_URL || "https://api.time-4-action.com/api/export";
  const portalPublicBase = process.env.SHOPIFY_PUBLIC_PORTAL_URL || "https://export.time-4-action.com";
  const oauthConfig = {
    appUrl: `${portalPublicBase}/integrations/shopify-deprecated`,
    redirectUrl: `${apiPublicBase}/shopify/callback-custom`,
  };

  return (
    <div className="min-h-full">
      <div className="contents">
        <ShopifyIntegrationPage
          variant="prerelease"
          oauthConfig={oauthConfig}
          initialExports={shopifyExports ?? []}
          ownerEmail={session?.user?.email}
          initialConnections={connections}
          initialPricelists={pricelists ?? []}
          initialFeeds={ownSources ?? []}
          initialAiExports={aiExports ?? []}
        />
      </div>
    </div>
  );
}
