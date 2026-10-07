"use client";

/**
 * TierGate — the join-the-program screen shown in place of a feature page when the
 * signed-in user lacks the feature's early-access tier role ('alpha' / 'beta').
 *
 * The feature stays visible in the navbar for everyone (that's the point — discoverability),
 * but opening it lands here: what the feature does, what testers get, and a full "Request access"
 * form (shared with the public Shopify welcome page) that emails us through the existing contact
 * route. The request is remembered in localStorage so the form doesn't beg twice.
 *
 * When the user arrived from a Shopify-initiated install they can't use (no access), `declineShop`
 * + `declineClaim` are passed: TierGate then does the CLEAN BREAK — it calls the decline endpoint
 * (uninstall the app from their store + delete the pending record) and shows a "couldn't connect"
 * banner above the form, so they're never left with an orphaned, non-functional app.
 */

import { useEffect, useRef } from "react";
import { FEATURE_TIERS } from "@/lib/featureTiers";
import RequestAccessForm from "@/components/RequestAccessForm";

const TIER_META = {
  alpha: {
    label: "Alpha program",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    desc: "hands-on early access — features are functional but still being shaped, and your feedback steers them",
  },
  beta: {
    label: "Beta program",
    chip: "bg-accent-brand/10 text-accent-brand",
    desc: "near-final features in real-world validation before general availability",
  },
};

const FlaskIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v5.2L4.7 17.5A2.4 2.4 0 0 0 6.8 21h10.4a2.4 2.4 0 0 0 2.1-3.5L14 8.2V3M7.5 14h9" />
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function TierGate({ featureKey, userEmail, userName, declineShop, declineClaim }) {
  const feature = FEATURE_TIERS[featureKey];
  const tier = feature?.tier ?? "alpha";
  const meta = TIER_META[tier] ?? TIER_META.alpha;
  const storageKey = `tier-request:${tier}:${featureKey}`;

  // Clean break: if we arrived from a Shopify install this account can't use, uninstall it + delete
  // the pending record. A ref guard fires it at most once per mount (no setState in the effect).
  const declinedRef = useRef(false);
  useEffect(() => {
    if (!declineShop || !declineClaim || declinedRef.current) return;
    declinedRef.current = true;
    fetch("/nextapi/export/shopify/connection/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: declineShop, claimToken: declineClaim }),
    }).catch(() => { /* best-effort; the server-side sweep is the backstop */ });
  }, [declineShop, declineClaim]);

  if (!feature) return null;

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center py-16">

      {/* full container width — lines up with the navbar/content column */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">

        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-14">
          <div className="relative mb-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-input/60 bg-card text-violet-fg-soft shadow-sm">
              <FlaskIcon className="h-8 w-8" />
            </div>
          </div>

          <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full ${meta.chip} px-2.5 py-1 text-[11px] font-medium`}>
            {meta.label}
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {feature.name} is in early access
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{feature.tagline}</p>

          {/* what testers get */}
          {feature.perks?.length > 0 && (
            <ul className="mt-8 w-full max-w-md space-y-2.5 text-left">
              {feature.perks.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand" />
                  <span className="text-sm text-foreground">{p}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Clean-break notice — shown when a Shopify install couldn't be connected for this account */}
          {declineShop && (
            <div className="mt-8 w-full max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
              <p className="text-sm font-medium text-amber-fg-softer">We couldn&apos;t connect {declineShop}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-fg-soft/80">
                Your account isn&apos;t approved for the {feature.name} yet, so the app has been removed from
                your store. Request access below and we&apos;ll reconnect it once you&apos;re set up.
              </p>
            </div>
          )}

          <p className="mt-8 max-w-md text-xs leading-relaxed text-muted-foreground">
            This feature is currently limited to {tier} testers — {meta.desc}. Tell us about your
            business and we&apos;ll enable it for <span className="font-medium text-foreground">{userEmail || "your account"}</span>.
          </p>

          {/* request access form */}
          <div className="mt-6 w-full max-w-md">
            <RequestAccessForm
              featureName={feature.name}
              defaultName={userName}
              defaultEmail={userEmail}
              defaultStore={declineShop || ""}
              storageKey={storageKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
