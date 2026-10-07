"use client";

/**
 * Connect screens — the "connect a (another) store" flow.
 *
 *   • {@link ConnectStore}  — enter a myshopify domain → start OAuth (standard), or paste your own
 *                             app's client credentials (deprecated bring-your-own-app variant).
 *   • {@link ResumeConnect} — focused auto-launch when a partner arrives from Shopify's App URL for
 *                             a store that isn't connected yet.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, ClipboardCopy, RefreshCw, ShieldCheck, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, input } from "@/lib/ui";
import { Badge, CUSTOM_APP_SCOPES, OAUTH_DEFAULTS, SCOPES, SYNC_FLAGS, ShopifyLogo, Spinner, shopLabel } from "./shared";

const RefreshIcon = RefreshCw;
const SpinnerIcon = Spinner;
const BagIcon = Store;
const BookIcon = BookOpen;
const CheckIcon = Check;
const ClipboardIcon = ClipboardCopy;
const WarningIcon = AlertTriangle;
const ShieldIcon = ShieldCheck;
const StatusBadge = ({ tone, children }) => <Badge tone={tone === "amber" ? "warning" : tone === "cyan" ? "info" : "neutral"}>{children}</Badge>;
const LogoTile = ({ size = "h-14 w-14", logo = "h-8 w-8" }) => (
  <div className={cn("flex items-center justify-center rounded-xl border border-border bg-muted/50", size)}>
    <ShopifyLogo className={logo} />
  </div>
);

/* -------------------------------------------------------------------------- */
/*  ResumeConnect — focused auto-launch when arriving from Shopify's App URL    */
/* -------------------------------------------------------------------------- */

// A partner opened the app from their Shopify admin for a store that isn't connected yet. They
// already expressed intent, so we don't drop them on the settings page — we show a focused card
// and auto-launch the OAuth install (cancelable) after a short, visible beat.
export function ResumeConnect({ shopDomain, onNotice, onCancel }) {
  const label = shopLabel(shopDomain);
  const [status, setStatus] = useState("counting"); // "counting" | "launching" | "error"
  const launchedRef = useRef(false);

  const launch = async () => {
    if (launchedRef.current) return;
    launchedRef.current = true;
    setStatus("launching");
    try {
      const res = await fetch(`/nextapi/export/shopify/connect?shop=${encodeURIComponent(shopDomain)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return; // navigating away to Shopify's consent screen
      }
      onNotice?.({ tone: "error", text: data.error || "Could not start the Shopify connection." });
      launchedRef.current = false;
      setStatus("error");
    } catch {
      onNotice?.({ tone: "error", text: "Could not reach the server to start the connection." });
      launchedRef.current = false;
      setStatus("error");
    }
  };

  // Auto-launch after a short beat so the user sees what's happening (and can cancel).
  useEffect(() => {
    const t = setTimeout(launch, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 w-fit"><LogoTile size="h-16 w-16" logo="h-9 w-9" /></div>

        {status === "error" ? (
          <>
            <h2 className="text-[15px] font-semibold text-foreground">Couldn&apos;t start the connection</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong reaching Shopify for <span className="font-semibold text-foreground">{label}</span>. Try again, or enter the store manually.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={launch}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 h-9"
              >
                <RefreshIcon className="h-4 w-4" />
                Try again
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-md border border-input bg-card px-5 text-sm font-medium text-foreground transition-all hover:border-input hover:text-foreground h-9"
              >
                Enter store manually
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[15px] font-semibold text-foreground">Connecting your store</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Taking you to Shopify to approve the install for{" "}
              <span className="font-semibold text-foreground">{label}</span>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-accent-brand">
              <SpinnerIcon className="h-4 w-4" />
              {status === "launching" ? "Redirecting to Shopify…" : "Starting…"}
            </div>
            <button
              onClick={onCancel}
              className="mt-6 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConnectStore — enter a domain and start OAuth (first or additional store)  */
/* -------------------------------------------------------------------------- */

export function ConnectStore({ variant = "standard", oauthConfig = null, canCancel, onCancel, onNotice, initialDomain = "" }) {
  const isPrerelease = variant === "prerelease";
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [connecting, setConnecting] = useState(false);
  // Prerelease bring-your-own-OAuth-app: the customer's app credentials.
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");

  const domainClean = domainInput.trim().toLowerCase();
  const domainValid = /^[a-z0-9][a-z0-9-]*$/.test(domainClean);
  const clientIdClean = clientIdInput.trim();
  const clientSecretClean = clientSecretInput.trim();
  const oauth = oauthConfig || OAUTH_DEFAULTS;

  // Prerelease-only: copy any guide value (App URL / Redirect URL / scopes) to the clipboard.
  const [copiedKey, setCopiedKey] = useState(null);
  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      onNotice?.({ tone: "error", text: "Couldn't copy — select the text and copy it manually." });
    }
  };

  // Prerelease-only: the step-by-step setup guide is a Next/Back modal wizard (not a side rail).
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  useEffect(() => {
    if (!guideOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [guideOpen]);

  // Start OAuth: ask the backend for the Shopify authorize URL, then redirect the browser to it.
  // Shopify sends the user back to the API callback, which redirects to this page with
  // `?shopify=connected` (handled by the banner effect + the fresh connections list on reload).
  const connect = async () => {
    if (!domainValid || connecting) return;
    setConnecting(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connect?shop=${encodeURIComponent(domainClean)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return; // navigating away
      }
      onNotice({ tone: "error", text: data.error || "Could not start the Shopify connection." });
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to start the connection." });
    }
    setConnecting(false);
  };

  // Prerelease bring-your-own-OAuth-app: send the customer's app credentials to the backend, which
  // parks them and returns their app's Shopify authorize URL; then redirect to install/approve.
  const connectCustomOAuth = async () => {
    if (!domainValid || !clientIdClean || !clientSecretClean || connecting) return;
    setConnecting(true);
    try {
      const res = await fetch("/nextapi/export/shopify/connect-custom-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: domainClean, clientId: clientIdClean, clientSecret: clientSecretClean }),
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return; // navigating away to Shopify's consent screen
      }
      onNotice({ tone: "error", text: data?.error || "Could not start the connection." });
    } catch {
      onNotice({ tone: "error", text: "Could not reach the server to start the connection." });
    }
    setConnecting(false);
  };

  if (isPrerelease) {
    // The step-by-step setup wizard (rendered in the modal). Steps carry an optional copy field
    // (App URL / Redirect URL / scopes) and an optional amber warning.
    const guideSteps = [
      {
        title: "Create a NEW app",
        body: (
          <>
            Go to <span className="font-mono text-foreground">dev.shopify.com</span> (the Shopify Dev Dashboard) and sign in.
            Open <span className="font-medium text-foreground">Apps → Create app</span>, create it manually and name it
            (e.g. <span className="text-foreground">&quot;Patrik Portal&quot;</span>). Open the app, then start a new{" "}
            <span className="font-medium text-foreground">version</span> to edit its configuration.
          </>
        ),
        warn: "Create your OWN new app. Do NOT reuse our \"time-4-action-integration\" app — that's our public app and you can't install it directly here (use the standard Shopify Integration for the one-click connect instead).",
      },
      {
        title: "Set the App URL",
        body: (<>In the version&apos;s <span className="font-medium text-foreground">URLs</span> section, paste this as the <span className="font-medium text-foreground">App URL</span>, and un-tick <span className="font-medium text-foreground">Embed app in Shopify admin</span>.</>),
        copy: { key: "appUrl", label: "App URL", value: oauth.appUrl },
      },
      {
        title: "Set the Redirect URL",
        body: (<>In <span className="font-medium text-foreground">Access</span>, paste this into <span className="font-medium text-foreground">Redirect URLs</span>, and tick <span className="font-medium text-foreground">Use legacy install flow</span>.</>),
        copy: { key: "redirect", label: "Redirect URL", value: oauth.redirectUrl },
        warn: "Paste it exactly — this must match, character for character, or the connect will fail.",
      },
      {
        title: "Add the scopes",
        body: (<>Paste this comma-separated list into <span className="font-medium text-foreground">Scopes</span> (leave Optional scopes empty), then click <span className="font-medium text-foreground">Release</span> to save the version.</>),
        copy: { key: "scopes", label: "Scopes", value: CUSTOM_APP_SCOPES.join(",") },
      },
      {
        title: "Make it Custom distribution",
        body: (<>Open <span className="font-medium text-foreground">Distribution</span>, choose <span className="font-medium text-foreground">Custom distribution</span> and enter your store{domainClean ? <> (<span className="font-mono text-foreground">{domainClean}.myshopify.com</span>)</> : ""}.</>),
        warn: "This is what avoids the \"app under review\" wall — a custom-distribution app installs on your one store without any Shopify review.",
      },
      {
        title: "Copy your credentials",
        body: (<>Open the app&apos;s <span className="font-medium text-foreground">Client credentials</span> (a.k.a. API credentials). You&apos;ll paste the <span className="font-medium text-foreground">Client ID</span> and <span className="font-medium text-foreground">Client secret</span> into this page next.</>),
        warn: "Do NOT click \"Install\" in the Dev Dashboard — that installs the wrong app. The install is started from THIS page (the Connect button below), which uses your app's key.",
      },
      {
        title: "Connect",
        body: (<>Come back to this page, paste your <span className="font-medium text-foreground">store domain</span>, <span className="font-medium text-foreground">Client ID</span> and <span className="font-medium text-foreground">Client secret</span> into the form, and click <span className="font-medium text-foreground">Connect store</span> (not the Dashboard&apos;s Install button). You&apos;ll be sent to Shopify to approve — the consent screen should show YOUR app&apos;s name, not ours.</>),
      },
    ];
    const gStep = guideSteps[guideStep] || guideSteps[0];
    const isLastStep = guideStep >= guideSteps.length - 1;

    return (
      <>
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="mb-6 w-fit"><LogoTile /></div>
              {canCancel && (
                <button
                  onClick={onCancel}
                  className="rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-input hover:text-foreground h-7"
                >
                  Back to stores
                </button>
              )}
            </div>

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent-brand/30 bg-accent-brand/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-accent-brand">
              Beta · Deprecated
            </div>
            <h2 className="text-[15px] font-semibold text-foreground">
              {canCancel ? "Connect another store" : "Connect your Shopify store"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This is the deprecated connect flow. It uses your{" "}
              <span className="font-medium text-foreground">own Shopify app</span> — create one in the Shopify Dev
              Dashboard, then paste its API key and secret below. New here? Open the guide first.{" "}
              For a new store, prefer the one-click{" "}
              <a href="/integrations/shopify" className="text-accent-brand hover:underline">standard Shopify Integration</a>.
            </p>

            <button
              type="button"
              onClick={() => { setGuideStep(0); setGuideOpen(true); }}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-accent-brand/40 bg-accent-brand/10 px-4 text-sm font-medium text-accent-brand transition-colors hover:bg-accent-brand/15 h-9"
            >
              <BookIcon className="h-4 w-4" />
              Open setup guide
            </button>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="pr-shop-domain" className="mb-2 block text-sm font-medium text-foreground">Your store domain</label>
                <div className="flex overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
                  <input
                    id="pr-shop-domain"
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="ruzkrw-7q"
                    className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <span className="flex select-none items-center whitespace-nowrap border-l border-input px-3 text-sm text-muted-foreground">
                    .myshopify.com
                  </span>
                </div>
                <p className={`mt-2 text-xs ${domainInput && !domainValid ? "text-amber-fg" : "text-muted-foreground"}`}>
                  {domainInput && !domainValid
                    ? "Use only lowercase letters, numbers and hyphens — just the store name."
                    : "Use your permanent .myshopify.com name (e.g. ruzkrw-7q) — find it in Shopify admin → Settings → Domains. NOT your custom domain or store title."}
                </p>
              </div>

              <div>
                <label htmlFor="pr-client-id" className="mb-2 block text-sm font-medium text-foreground">API key (Client ID)</label>
                <input
                  id="pr-client-id"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="e.g. 7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d"
                  className={cn(input, "font-mono")}
                />
              </div>

              <div>
                <label htmlFor="pr-client-secret" className="mb-2 block text-sm font-medium text-foreground">API secret key</label>
                <input
                  id="pr-client-secret"
                  type="password"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && connectCustomOAuth()}
                  placeholder="shpss_••••••••••••••••••••••••••••••••"
                  className={cn(input, "font-mono")}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Both are on your app&apos;s <span className="text-foreground">Client credentials</span> page in the Dev Dashboard.
                  The secret is stored encrypted and never displayed again.
                </p>
              </div>

              <button
                onClick={connectCustomOAuth}
                disabled={!domainValid || !clientIdClean || !clientSecretClean || connecting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 h-10"
              >
                {connecting ? <SpinnerIcon className="h-4 w-4" /> : <BagIcon className="h-4 w-4" />}
                {connecting ? "Redirecting to Shopify…" : "Connect store"}
              </button>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <ul className="space-y-2">
                {[
                  "Your app secret and token are encrypted at rest and never logged or shown again.",
                  "One-way push only — we never read or change your orders.",
                  "Least-privilege scopes; disconnect any time to uninstall from your store.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {guideOpen && (
          <div className="fixed inset-0 z-[80] flex bg-black/50 sm:items-center sm:justify-center sm:p-4" onClick={() => setGuideOpen(false)}>
            <div className="flex h-full w-full flex-col overflow-hidden border-border bg-background shadow-lg sm:h-auto sm:max-h-[88vh] sm:max-w-lg sm:rounded-lg sm:border" onClick={(e) => e.stopPropagation()}>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="mb-0 text-[14px] font-semibold leading-none text-foreground">Set up your app</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Step {guideStep + 1} of {guideSteps.length} · dev.shopify.com</p>
                </div>
                <button type="button" onClick={() => setGuideOpen(false)} aria-label="Close" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-popover text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex shrink-0 gap-1.5 px-5 pt-4">
                {guideSteps.map((s, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= guideStep ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{guideStep + 1}</span>
                  <h3 className="mb-0 text-[13px] font-semibold text-foreground">{gStep.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{gStep.body}</p>

                {gStep.warn && (
                  <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3">
                    <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-fg" />
                    <p className="text-xs leading-snug text-amber-fg-softer/90">{gStep.warn}</p>
                  </div>
                )}

                {gStep.copy && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{gStep.copy.label}</p>
                      <button type="button" onClick={() => copyText(gStep.copy.value, gStep.copy.key)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-accent-brand/40 hover:text-foreground h-7">
                        {copiedKey === gStep.copy.key ? <CheckIcon className="h-3.5 w-3.5 text-accent-brand" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
                        {copiedKey === gStep.copy.key ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="mt-1.5 rounded-lg border border-border bg-popover p-2.5">
                      <code className="block select-all break-words font-mono text-[0.7rem] leading-relaxed text-foreground">{gStep.copy.value}</code>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3.5">
                <button type="button" onClick={() => setGuideStep((s) => Math.max(0, s - 1))} disabled={guideStep === 0} className="rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50 h-9">
                  Back
                </button>
                <button type="button" onClick={() => { if (isLastStep) setGuideOpen(false); else setGuideStep((s) => s + 1); }} className="rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 h-9">
                  {isLastStep ? "Got it" : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* left: connect + how it works */}
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="mb-6 w-fit"><LogoTile /></div>
            {canCancel && (
              <button
                onClick={onCancel}
                className="rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-input hover:text-foreground h-7"
              >
                Back to stores
              </button>
            )}
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">
            {canCancel ? "Connect another store" : "Connect your Shopify store"}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Install the portal app on your store with a single approval. No API keys to copy, no manual setup — once
            connected, choose what to sync and the portal keeps it current. You can connect as many stores as you like.
          </p>

          <div className="mt-6 max-w-lg">
            <label htmlFor="shop-domain" className="mb-2 block text-sm font-medium text-foreground">Your store domain</label>
            <div className="flex overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
              <input
                id="shop-domain"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                placeholder="your-store"
                className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="flex select-none items-center whitespace-nowrap border-l border-input px-3 text-sm text-muted-foreground">
                .myshopify.com
              </span>
            </div>
            <p className={`mt-2 text-xs ${domainInput && !domainValid ? "text-amber-fg" : "text-muted-foreground"}`}>
              {domainInput && !domainValid
                ? "Use only lowercase letters, numbers and hyphens — just the store name."
                : "Enter just your store name — we'll add .myshopify.com for you."}
            </p>

            <button
              onClick={connect}
              disabled={!domainValid || connecting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 sm:w-auto h-10"
            >
              {connecting ? <SpinnerIcon className="h-4 w-4" /> : <BagIcon className="h-4 w-4" />}
              {connecting ? "Redirecting to Shopify…" : "Connect Shopify"}
            </button>
          </div>

          {/* how it works */}
          <ol className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-3">
            {[
              "Enter your store domain",
              "Approve the install on Shopify",
              "Choose what to sync and go live",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* right: trust rail */}
      <aside className="space-y-6 lg:sticky lg:top-20">
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-[13px] font-semibold text-foreground">What gets synced</h3>
          <ul className="mt-4 space-y-3">
            {SYNC_FLAGS.map((f) => (
              <li key={f.key} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                    {f.slow && <StatusBadge tone="amber">Slow</StatusBadge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            One-way push only — we never read or change your orders.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <ShieldIcon className="h-4 w-4 text-accent-brand" />
            Secure by design
          </h3>
          <ul className="mt-4 space-y-3">
            {[
              "OAuth install — no manual API keys to copy or store.",
              "Tokens are encrypted at rest and never logged.",
              "Least-privilege scopes only.",
              "Every callback and webhook is HMAC-verified.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Scopes requested</p>
          <div className="flex flex-wrap gap-1.5">
            {SCOPES.map((s) => (
              <StatusBadge key={s} tone="cyan">{s}</StatusBadge>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

