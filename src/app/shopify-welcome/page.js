import Link from "next/link";
import { redirect } from "next/navigation";
import RequestAccessForm from "@/components/RequestAccessForm";
import { auth0 } from "@/lib/auth0";
import { FEATURE_TIERS } from "@/lib/featureTiers";

/**
 * Public post-install welcome page (`/shopify-welcome`). A merchant lands here straight after
 * approving the Shopify install (the OAuth callback redirects here with `?shop=&claim=`), BEFORE
 * any portal login. Two paths: approved partners "Sign in to connect" (returns to the integration
 * page, which claims the pending install), or newcomers request access.
 *
 * If the visitor ALREADY has a portal session, this screen is redundant — we redirect them straight
 * to the integration page so the connection is claimed without a pointless "sign in" prompt.
 *
 * Kept OUTSIDE `/integrations/*` on purpose so the auth middleware leaves it public.
 */

const feature = FEATURE_TIERS.shopify;
const PERKS = ["Live stock sync", "Auto-created products", "Prices · images · channels"];

const ShopifyMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M15.3 4.3c-.1 0-.3 0-.4.1l-.9.3c-.3-.9-.8-1.7-1.7-1.7h-.1c-.3-.4-.7-.5-1-.5-2 .1-3 2.6-3.3 3.9l-1.4.4c-.4.1-.4.2-.5.6L3.7 19.6 13 21l5-1.1S15.4 4.4 15.3 4.3zm-3.9 1.1l-1.5.5c0-.7.2-1.5.5-2 .2-.4.5-.7.8-.9 0 .4 0 .9.2 2.4zm.5 6l-.7 2s-.6-.3-1.3-.3c-1 0-1.1.6-1.1.8 0 .9 2.4 1.3 2.4 3.5 0 1.7-1.1 2.8-2.5 2.8-1.7 0-2.6-1.1-2.6-1.1l.5-1.5s.9.8 1.7.8c.5 0 .7-.4.7-.7 0-1.2-1.9-1.3-1.9-3.3 0-1.7 1.2-3.3 3.6-3.3.9 0 1.3.3 1.3.3z" />
  </svg>
);

const ArrowIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
  </svg>
);

const shopLabel = (shop) => (shop || "").replace(/\.myshopify\.com$/i, "");

export default async function ShopifyWelcomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const shop = typeof sp.shop === "string" ? sp.shop : "";
  const claim = typeof sp.claim === "string" ? sp.claim : "";

  const connectQuery = shop
    ? `?shop=${encodeURIComponent(shop)}${claim ? `&claim=${encodeURIComponent(claim)}` : ""}`
    : "";
  const connectPath = `/integrations/shopify${connectQuery}`;

  // Already signed in → the welcome/sign-in step is redundant; go straight to claiming.
  let signedIn = false;
  try {
    const session = await auth0.getSession();
    signedIn = !!session?.user;
  } catch { signedIn = false; }
  if (signedIn) redirect(connectPath);

  const signInHref = `/auth/login?returnTo=${encodeURIComponent(connectPath)}`;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-14 sm:py-20">
      {/* one soft ambient glow — restraint over decoration */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-brand/15 blur-[120px]" />

      <div className="relative w-full max-w-md sm:max-w-lg">
        {/* Hero */}
        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#95BF47]/25 bg-[#95BF47]/10">
            <ShopifyMark className="h-7 w-7 text-[#95BF47]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
            {shop ? <>Connect <span className="text-accent-brand">{shopLabel(shop)}</span></> : "Connect your store"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {feature.tagline}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {PERKS.map((p) => (
              <span key={p} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </header>

        {/* Primary path — sign in */}
        <div className="mt-9">
          <Link
            href={signInHref}
            className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in to connect
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            Already a Patrik partner? We&apos;ll finish connecting{shop ? <> <span className="text-foreground">{shopLabel(shop)}</span></> : " your store"} automatically.
          </p>
        </div>

        {/* Secondary path — request access (collapsed by default for a minimal first view) */}
        <details className="group mt-8">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
            New to the portal?
            <span className="font-medium text-accent-brand">Request access</span>
            <ArrowIcon className="h-3.5 w-3.5 text-accent-brand transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
            <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
              The portal is for approved Patrik International partners. Tell us about your business and
              we&apos;ll get you set up.
            </p>
            <RequestAccessForm featureName={feature.name} defaultStore={shop} storageKey="request-access:shopify" />
          </div>
        </details>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          One-way sync — the portal pushes catalogue data into your store and never deletes products.
        </p>
      </div>
    </main>
  );
}
