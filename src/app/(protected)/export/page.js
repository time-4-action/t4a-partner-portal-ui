import ExportPage from "@/components/ExportPage";
import { auth0 } from "@/lib/auth0";

// Get API URL from environment
const apiUrl = process.env.EXPORT_API_URL || "http://localhost:3000/api/export";

// Fetch products from Export API
async function getProducts() {
  try {
    const res = await fetch(`${apiUrl}/product`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Export API] Failed to fetch products: ${res.status}`, body);
      return { data: [], error: `API returned ${res.status}` };
    }

    const data = await res.json();
    return { data: data?.data ?? [], error: null };
  } catch (error) {
    console.error("[Export API] Connection error:", error.message);
    return { data: [], error: error.message };
  }
}

// Fetch AI export configs, filtered to those the user's roles and user ID can access.
// A document with no `roles` field (or empty array) is visible to everyone with the export role.
// A document with no `users` field (or empty array) is visible to everyone with the export role.
// If `users` is set, only the listed Auth0 user IDs may see the export.
async function getAllowedExports(userRoles, userId) {
  try {
    const res = await fetch(`${apiUrl}/exports`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const all = data?.data ?? [];
    return all.filter(exp => {
      const roleOk = !exp.roles?.length || exp.roles.some(r => userRoles.includes(r));
      const userOk = !exp.users?.length || exp.users.includes(userId);
      return roleOk && userOk;
    });
  } catch {
    return null; // null = fallback to deriving exports from product data
  }
}

export default async function ExportPageRoute() {
  // Check export role — roles must be in the ID token claim set by the Auth0 Post Login Action
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];
  const userId = session?.user?.sub ?? null;

  if (!roles.includes("export")) {
    return (
      <div className="relative p-8">
        <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
          <div className="p-8 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-center">
            <svg className="w-12 h-12 text-neutral-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
            <p className="text-neutral-400">You do not have access to the Export feature. Contact your administrator to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  const [{ data: products, error }, allowedExports] = await Promise.all([
    getProducts(),
    getAllowedExports(roles, userId),
  ]);

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-400 font-medium">Failed to load products</p>
                <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
        <ExportPage initialProducts={products} apiUrl={apiUrl} allowedExports={allowedExports} />
      </div>
    </div>
  );
}
