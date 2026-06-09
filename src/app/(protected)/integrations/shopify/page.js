import ShopifyIntegrationPage from "@/components/ShopifyIntegrationPage";
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

export default async function ShopifyIntegrationRoute() {
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];

  if (!roles.includes("export")) {
    return (
      <div className="relative p-8">
        <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
          <div className="p-8 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-center">
            <svg className="w-12 h-12 text-neutral-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
            <p className="text-neutral-400">You do not have access to the Shopify Integration feature. Contact your administrator to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  const [shopifyExports, connections, pricelists] = await Promise.all([
    getShopifyExportConfigs(),
    getShopifyConnections(),
    getShopifyPricelists(),
  ]);

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        <ShopifyIntegrationPage
          initialExports={shopifyExports ?? []}
          ownerEmail={session?.user?.email}
          // null = the connections fetch failed → client shows its demo store. An empty array =
          // the fetch succeeded but the user has no stores yet → client shows the connect screen.
          initialConnections={connections}
          initialPricelists={pricelists ?? []}
        />
      </div>
    </div>
  );
}
