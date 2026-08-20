import OwnSourcesPage from "@/components/OwnSourcesPage";
import TierGate from "@/components/TierGate";
import { FEATURE_TIERS, hasTierAccess } from "@/lib/featureTiers";
import { auth0 } from "@/lib/auth0";

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

// Fetch the user's registered Own Source feeds (owner-scoped, secrets stripped by the backend).
// Returns null on failure so the client renders an error/empty state rather than crashing.
async function getOwnSources() {
  try {
    const { token } = await auth0.getAccessToken();
    const res = await fetch(`${apiUrl}/external/sources`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.sources) ? data.sources : [];
  } catch {
    return null;
  }
}

// Fetch the category sets the user can access — a feed picks one when it turns AI categorization
// on. Same role/user filter as the Export/Categories pages, since `/exports` returns everything
// unscoped. Empty on failure → the feed form simply offers no categorization.
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

export default async function OwnSourcesRoute() {
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];

  if (!roles.includes("export")) {
    return (
      <div className="relative py-6 lg:py-8">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="p-6 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-center sm:p-8">
            <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
            <p className="text-neutral-400">You do not have access to the Own Sources feature. Contact your administrator to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  // Early-access gate: visible in the navbar for everyone; without the tier role the page
  // shows the join-the-program screen instead of the feature.
  if (!hasTierAccess(roles, FEATURE_TIERS.ownSources.tier)) {
    return (
      <div className="relative bg-transparent py-6 lg:py-8">
        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <TierGate featureKey="ownSources" userEmail={session?.user?.email} userName={session?.user?.name} />
        </div>
      </div>
    );
  }

  const [sources, aiExports] = await Promise.all([
    getOwnSources(),
    getAiExports(roles, session?.user?.sub),
  ]);

  return (
    <div className="relative bg-transparent py-6 lg:py-8">
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <OwnSourcesPage initialSources={sources} initialAiExports={aiExports ?? []} />
      </div>
    </div>
  );
}
