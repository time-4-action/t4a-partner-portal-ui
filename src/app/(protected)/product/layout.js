import { auth0 } from "@/lib/auth0";

export default async function ProtectedLayout({ children }) {
  // withPageAuthRequired is the easiest way to protect a layout.
  // It will automatically redirect unauthenticated users to the login page.
  // It will also return them to the page they were trying to access after login.
  const ProtectedComponent = auth0.withPageAuthRequired(async () => children, {
    // The returnTo is not needed here because withPageAuthRequired, when used in a layout,
    // will automatically use the current path.
  });
  return <ProtectedComponent />;
}