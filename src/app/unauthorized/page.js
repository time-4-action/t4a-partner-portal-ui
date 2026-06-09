import { auth0 } from "@/lib/auth0";

// Shopify "bag" mark, inlined (matches the integration page) so the request-access screen is
// clearly about connecting a store, not a generic denial.
function ShopifyMark(props) {
  return (
    <svg viewBox="0 0 122.5 139.5" role="img" aria-label="Shopify" {...props}>
      <path fill="#95BF47" d="M118.8,28.5c-0.1-0.8-0.8-1.2-1.4-1.2c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-1-1-2.9-0.7-3.6-0.5c-0.1,0-1.9,0.6-5,1.5c-3-8.7-8.3-16.7-17.7-16.7c-0.3,0-0.5,0-0.8,0c-2.7-3.5-6-5.1-8.9-5.1C45.1-4.5,34.7,22.7,31.4,36.5c-8.5,2.6-14.6,4.5-15.3,4.8c-4.8,1.5-4.9,1.6-5.5,6.1C10.1,50.8,0,128.7,0,128.7l78.6,14.7l42.6-9.2C121.2,134.2,118.9,29.3,118.8,28.5z" />
      <path fill="#5E8E3E" d="M117.4,27.3c-0.6-0.1-12.6-0.2-12.6-0.2s-10-9.7-11-10.7c-0.4-0.4-0.9-0.6-1.4-0.6l-5.9,127.8l42.6-9.2c0,0-18.3-123.6-18.4-124.5C120.2,28.5,118.5,27.4,117.4,27.3z" />
      <path fill="#FFFFFF" d="M71.5,46.4l-5.3,15.7c0,0-4.6-2.5-10.3-2.5c-8.3,0-8.7,5.2-8.7,6.5c0,7.1,18.6,9.9,18.6,26.6c0,13.2-8.3,21.6-19.6,21.6c-13.5,0-20.4-8.4-20.4-8.4l3.6-11.9c0,0,7.1,6.1,13.1,6.1c3.9,0,5.5-3.1,5.5-5.3c0-9.3-15.2-9.7-15.2-25c0-12.9,9.3-25.4,28-25.4c7.2,0,10.7,2,10.7,2C71.1,44.5,71.5,46.4,71.5,46.4z" />
    </svg>
  );
}

export default async function UnauthorizedPage({ searchParams }) {
  const params = (await searchParams) || {};
  const shopRaw = typeof params.shop === "string" ? params.shop : null;
  const isShopify = params.reason === "shopify" && shopRaw;
  const shop = shopRaw ? shopRaw.replace(/\.myshopify\.com$/, "") : null;

  const session = await auth0.getSession();
  const email = session?.user?.email;

  // Tailored path: an approved-partners-only app where this signed-in user opened the Shopify
  // app but isn't enabled for sync yet. Tell them exactly what to do, name the store + account.
  if (isShopify) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center backdrop-blur-sm">
          <div className="relative mx-auto mb-6 w-fit">
            <div aria-hidden="true" className="absolute -inset-3 rounded-[1.75rem] bg-[#95BF47]/20 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-gradient-to-br from-[#16210f] via-neutral-900 to-neutral-950 shadow-lg shadow-[#5E8E3E]/20">
              <ShopifyMark className="h-9 w-9" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white">Almost there — your account needs Shopify access</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            You&apos;re signed in{email ? <> as <span className="font-medium text-neutral-200">{email}</span></> : null}, but this
            account isn&apos;t enabled for the Shopify sync yet. To connect{" "}
            <span className="font-semibold text-white">{shop}</span>, ask your Patrik&nbsp;International contact to enable
            Shopify access for your account.
          </p>

          <div className="mt-5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 px-4 py-3 text-left text-xs text-neutral-400">
            <p><span className="text-neutral-500">Store:</span> <span className="font-mono text-neutral-200">{shop}.myshopify.com</span></p>
            {email && <p className="mt-1"><span className="text-neutral-500">Account:</span> <span className="text-neutral-200">{email}</span></p>}
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            Once access is granted, reopen the app from your Shopify admin — it will pick up right where you left off.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-[#01a0be] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f]"
            >
              Request access
            </a>
            <a
              href="/auth/logout"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:text-white"
            >
              Switch account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Generic denial (any other protected route).
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold text-red-400" style={{ fontFamily: "var(--font-orbitron)" }}>
        Access Denied
      </h1>
      <p className="max-w-md text-gray-300">
        You do not have permission to access this portal. Please contact your administrator to request access.
      </p>
      <a
        href="/auth/logout"
        className="rounded-lg bg-cyan-600 px-6 py-2 text-white transition-colors hover:bg-cyan-500"
      >
        Log out
      </a>
    </div>
  );
}
