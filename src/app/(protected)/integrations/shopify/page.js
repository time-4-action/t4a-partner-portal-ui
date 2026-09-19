import ShopifyIntegrationPage from "@/components/ShopifyIntegrationPage";
import TierGate from "@/components/TierGate";
import { FEATURE_TIERS, hasTierAccess } from "@/lib/featureTiers";
import { auth0 } from "@/lib/auth0";

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

// Fetch the saved export configurations that use the Shopify preset. These are the real
// `custom-export` configs (auth-scoped to the current user by the backend) that drive the
// "Products to sync" selector — the sync follows the chosen config's filters and field rules.
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

// Fetch every Shopify store the current user has connected (lightweight — no per-store Shopify
// calls; the client lazy-loads each store's live locations/channels on demand). Returns null on
// failure so the client component falls back to its demo state.
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

// Fetch the user's Own Source feeds so the per-store scope selector can offer "Own source" as
// an alternative to a Patrik export config (design §9.2). Empty on failure → the option group
// simply doesn't appear.
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

// Fetch the exports with AI categorization enabled — the per-source "AI categorization" picker
// adds the chosen export's AI categories to the source's Shopify tags. Filtered to those the
// user's roles and user ID can access (same rule as the Export/Categories pages), since
// `/exports` returns every export unscoped. Empty on failure → the section simply doesn't render.
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

// Fetch the distinct pricelists in the catalogue so the pricing panel seeds from real names
// (not mock). Empty on failure → the panel falls back to its demo template.
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

export default async function ShopifyIntegrationRoute({ searchParams }) {
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];
  const userId = session?.user?.sub ?? null;

  // A merchant who completed a Shopify install but lacks access arrives here (from the welcome
  // page → sign-in) with ?shop&claim. In the non-alpha branch below we hand these to TierGate so it
  // can do the clean break — uninstall the app + delete the pending record — and explain why.
  const sp = (await searchParams) || {};
  const claimShop = typeof sp.shop === "string" ? sp.shop : undefined;
  const claimToken = typeof sp.claim === "string" ? sp.claim : undefined;

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

  // Early-access gate: the feature stays visible in the navbar, but without the tier role
  // the page shows the join-the-program screen instead of the integration.
  if (!hasTierAccess(roles, FEATURE_TIERS.shopify.tier)) {
    return (
      <div className="p-4 md:p-8">
        <div className="contents">
          <TierGate
            featureKey="shopify"
            userEmail={session?.user?.email}
            userName={session?.user?.name}
            declineShop={claimToken ? claimShop : undefined}
            declineClaim={claimToken ? claimToken : undefined}
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

  // This page owns only the shared public-app connections. Bring-your-own-app connections
  // (custom_oauth / custom_app) live on /integrations/shopify-prerelease, so a store never shows on
  // both pages. `null` = the fetch failed → leave it null so the client shows its demo fallback.
  const connections = allConnections === null
    ? null
    : allConnections.filter((c) => c.authMethod !== "custom_oauth" && c.authMethod !== "custom_app");

  return (
    <div className="min-h-full">
      <div className="contents">
        <ShopifyIntegrationPage
          initialExports={shopifyExports ?? []}
          ownerEmail={session?.user?.email}
          // null = the connections fetch failed → client shows its demo store. An empty array =
          // the fetch succeeded but the user has no stores yet → client shows the connect screen.
          initialConnections={connections}
          initialPricelists={pricelists ?? []}
          initialFeeds={ownSources ?? []}
          initialAiExports={aiExports ?? []}
        />
      </div>
    </div>
  );
}
