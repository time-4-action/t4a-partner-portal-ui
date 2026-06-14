import Link from "next/link";
import RequestAccessForm from "@/components/RequestAccessForm";
import { FEATURE_TIERS } from "@/lib/featureTiers";

/**
 * Public post-install welcome page (`/shopify-welcome`). A merchant lands here straight after
 * approving the Shopify install (the OAuth callback redirects here with `?shop=&claim=`), BEFORE
 * any portal login — so it explains what the portal is and offers two clear paths:
 *   • approved partners → "Sign in to connect" (returns to the integration page, which claims the
 *     pending install and activates it);
 *   • everyone else → a "Request access" form.
 * Kept OUTSIDE `/integrations/*` on purpose so the auth middleware leaves it public.
 */

const feature = FEATURE_TIERS.shopify;

const ShopifyMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M15.3 4.3c-.1 0-.3 0-.4.1l-.9.3c-.3-.9-.8-1.7-1.7-1.7h-.1c-.3-.4-.7-.5-1-.5-2 .1-3 2.6-3.3 3.9l-1.4.4c-.4.1-.4.2-.5.6L3.7 19.6 13 21l5-1.1S15.4 4.4 15.3 4.3zM11.4 5.4l-1.5.5c0-.7.2-1.5.5-2 .2-.4.5-.7.8-.9 0 .4 0 .9.2 2.4zm-1-2.1c.3 0 .5.1.7.3-.4.2-.8.6-1 1.1-.3.5-.5 1.2-.6 1.9l-1.2.4c.3-1.2 1.1-3.5 2.1-3.7zm.5 8.1s-.6-.3-1.3-.3c-1 0-1.1.6-1.1.8 0 .9 2.4 1.3 2.4 3.5 0 1.7-1.1 2.8-2.5 2.8-1.7 0-2.6-1.1-2.6-1.1l.5-1.5s.9.8 1.7.8c.5 0 .7-.4.7-.7 0-1.2-1.9-1.3-1.9-3.3 0-1.7 1.2-3.3 3.6-3.3.9 0 1.4.3 1.4.3l-.7 2zm2.4-5.9c0-.1 0-.2 0 0-.5 0-.7.1-.7.1V5c0-.9-.1-1.6-.3-2.1.7.1 1 .9 1 1.4 0 .4 0 .8 0 1.3z" />
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
  </svg>
);

function shopLabel(shop) {
  return (shop || "").replace(/\.myshopify\.com$/i, "");
}

export default async function ShopifyWelcomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const shop = typeof sp.shop === "string" ? sp.shop : "";
  const claim = typeof sp.claim === "string" ? sp.claim : "";

  // After sign-in, return to the gated integration page carrying shop + claim so it can bind the
  // pending install. The whole returnTo is encoded as one query value.
  const returnTo = `/integrations/shopify${shop ? `?shop=${encodeURIComponent(shop)}${claim ? `&claim=${encodeURIComponent(claim)}` : ""}` : ""}`;
  const signInHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="relative min-h-screen px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#95BF47]/30 bg-[#95BF47]/10">
            <ShopifyMark className="h-7 w-7 text-[#95BF47]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {shop ? <>Connect <span className="text-[#01a0be]">{shopLabel(shop)}</span> to the partner portal</> : "Connect your store to the partner portal"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
            {feature.tagline}
          </p>
        </div>

        {/* What it does */}
        <ul className="mx-auto mb-10 grid max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
          {feature.perks.map((p) => (
            <li key={p} className="flex items-start gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
              <span className="text-sm text-neutral-300">{p}</span>
            </li>
          ))}
        </ul>

        {/* Two paths */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Sign in */}
          <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-base font-semibold text-white">Already a partner?</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">
              Sign in to your portal account and we&apos;ll finish connecting{shop ? <> <span className="font-medium text-neutral-200">{shopLabel(shop)}</span></> : " your store"} automatically — no store details to re-enter.
            </p>
            <Link
              href={signInHref}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#01a0be] to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:shadow-[#01a0be]/40 hover:brightness-110"
            >
              Sign in to connect
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Request access */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-base font-semibold text-white">New here?</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              The portal is for approved Patrik International partners. Tell us about your business and
              we&apos;ll get you set up.
            </p>
            <div className="mt-5">
              <RequestAccessForm featureName={feature.name} defaultStore={shop} storageKey="request-access:shopify" />
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-neutral-600">
          One-way sync only — the portal pushes catalogue data into your store and never deletes your products.
        </p>
      </div>
    </div>
  );
}
