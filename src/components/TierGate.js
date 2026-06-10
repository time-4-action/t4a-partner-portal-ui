"use client";

/**
 * TierGate — the join-the-program screen shown in place of a feature page when the
 * signed-in user lacks the feature's early-access tier role ('alpha' / 'beta').
 *
 * The feature stays visible in the navbar for everyone (that's the point — discoverability),
 * but opening it lands here: what the feature does, what testers get, and a one-click
 * "Request access" that emails us through the existing contact route. The request is
 * remembered in localStorage so the button doesn't beg twice.
 */

import { useEffect, useState } from "react";
import { FEATURE_TIERS } from "@/lib/featureTiers";

const TIER_META = {
  alpha: {
    label: "Alpha program",
    chip: "from-violet-500/20 to-fuchsia-500/20 text-violet-300 ring-violet-400/30",
    glow: "from-violet-500/25 via-fuchsia-500/10",
    desc: "hands-on early access — features are functional but still being shaped, and your feedback steers them",
  },
  beta: {
    label: "Beta program",
    chip: "from-[#01a0be]/20 to-cyan-400/20 text-cyan-300 ring-cyan-400/30",
    glow: "from-[#01a0be]/25 via-cyan-500/10",
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

const SpinnerIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
    </path>
  </svg>
);

export default function TierGate({ featureKey, userEmail, userName }) {
  const feature = FEATURE_TIERS[featureKey];
  const tier = feature?.tier ?? "alpha";
  const meta = TIER_META[tier] ?? TIER_META.alpha;
  const storageKey = `tier-request:${tier}:${featureKey}`;

  const [state, setState] = useState("idle"); // idle | sending | sent | error
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) setState("sent");
    } catch { /* private mode etc. — just show the button */ }
  }, [storageKey]);

  if (!feature) return null;

  const requestAccess = async () => {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const res = await fetch("/nextapi/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName || userEmail || "Portal user",
          company: `${meta.label} request`,
          email: userEmail || "unknown",
          message: `I'd like to join the ${tier} program for "${feature.name}".\n\nRequested from the portal's ${feature.name} page by ${userEmail || "an unidentified user"}.`,
        }),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem(storageKey, new Date().toISOString()); } catch { /* ignore */ }
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center py-16">
      {/* ambient glow behind the card */}
      <div className={`pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 w-72 rounded-full bg-gradient-to-br ${meta.glow} to-transparent blur-3xl`} />

      {/* full container width — lines up with the navbar/content column */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-2xl backdrop-blur-sm">
        {/* gradient hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#01a0be] via-violet-500 to-fuchsia-500" />

        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-14">
          <div className="relative mb-6">
            <div className={`absolute -inset-3 rounded-3xl bg-gradient-to-br ${meta.glow} to-transparent blur-xl`} />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-700/60 bg-neutral-900 text-violet-300">
              <FlaskIcon className="h-8 w-8" />
            </div>
          </div>

          <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${meta.chip} px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ring-1`}>
            {meta.label}
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {feature.name} is in early access
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400">{feature.tagline}</p>

          {/* what testers get */}
          {feature.perks?.length > 0 && (
            <ul className="mt-8 w-full max-w-md space-y-2.5 text-left">
              {feature.perks.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
                  <span className="text-sm text-neutral-300">{p}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 max-w-md text-xs leading-relaxed text-neutral-500">
            This feature is currently limited to {tier} testers — {meta.desc}. Ask to join and
            we&apos;ll enable it for <span className="font-medium text-neutral-300">{userEmail || "your account"}</span>.
          </p>

          {/* request action */}
          <div className="mt-6">
            {state === "sent" ? (
              <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-300">
                <CheckIcon className="h-4 w-4" />
                Request sent — we&apos;ll be in touch when your access is enabled.
              </div>
            ) : (
              <button
                onClick={requestAccess}
                disabled={state === "sending"}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#01a0be] to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:shadow-[#01a0be]/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "sending" ? <SpinnerIcon className="h-4 w-4" /> : <FlaskIcon className="h-4 w-4" />}
                {state === "sending" ? "Sending request…" : `Request ${tier} access`}
              </button>
            )}
            {state === "error" && (
              <p className="mt-3 text-xs text-red-400">
                Could not send the request — please try again or use the contact page.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
