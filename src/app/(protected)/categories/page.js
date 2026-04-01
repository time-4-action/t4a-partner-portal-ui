import CategoriesPage from "@/components/CategoriesPage";
import { auth0 } from "@/lib/auth0";

const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

async function getAllowedExports(userRoles, userId) {
    try {
        const res = await fetch(`${apiUrl}/exports`, { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        const all = data?.data ?? [];
        return all.filter(exp => {
            const roleOk = !exp.roles?.length || exp.roles.some(r => userRoles.includes(r));
            const userOk = !exp.users?.length || exp.users.includes(userId);
            return roleOk && userOk;
        });
    } catch {
        return [];
    }
}

export default async function CategoriesPageRoute() {
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
                        <p className="text-neutral-400">You do not have access to the Categories feature.</p>
                    </div>
                </div>
            </div>
        );
    }

    const allowedExports = await getAllowedExports(roles, userId);

    return (
        <div className="relative p-8 bg-transparent">
            <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
                <CategoriesPage initialExports={allowedExports} />
            </div>
        </div>
    );
}
