import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  // Belt-and-suspenders auth gate. The primary login redirect happens in the middleware
  // (src/proxy.js), which sets an explicit returnTo with the full path + query — that's what
  // preserves params like ?connect=1&shop=… so the Shopify auto-connect resumes after login.
  // This is just a fallback for any request that reaches the layout unauthenticated.
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return children;
}
