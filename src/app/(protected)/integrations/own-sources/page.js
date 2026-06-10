import OwnSourcesPage from "@/components/OwnSourcesPage";
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

export default async function OwnSourcesRoute() {
  const session = await auth0.getSession();
  const roles = session?.user?.["https://time-4-action.com/roles"] ?? [];

  if (!roles.includes("export")) {
    return (
      <div className="relative p-8">
        <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
          <div className="p-8 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
            <p className="text-neutral-400">You do not have access to the Own Sources feature. Contact your administrator to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  const sources = await getOwnSources();

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        <OwnSourcesPage initialSources={sources} />
      </div>
    </div>
  );
}
