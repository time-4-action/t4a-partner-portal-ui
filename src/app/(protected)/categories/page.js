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
            <div className="p-4 md:p-8">
                <div className="contents">
                    <div className="p-6 bg-muted/50 border border-input/50 rounded-2xl text-center sm:p-8">
                        <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h2 className="text-[15px] font-semibold text-foreground mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground">You do not have access to the Categories feature.</p>
                    </div>
                </div>
            </div>
        );
    }

    const allowedExports = await getAllowedExports(roles, userId);

    return (
        <div className="min-h-full">
            <div className="contents">
                <CategoriesPage initialExports={allowedExports} />
            </div>
        </div>
    );
}
