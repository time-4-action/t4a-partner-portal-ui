"use client";

/**
 * ShopifyIntegrationPage — the orchestrator for /integrations/shopify (and, with
 * `variant="prerelease"`, the deprecated bring-your-own-app page).
 *
 * A portal user can connect any number of Shopify stores. This component owns the list of
 * stores, which one is selected, the URL-parameter handling (OAuth outcome, Shopify entry
 * routing, post-install claim, "create source" return) and the toasts. Everything for ONE store
 * lives in {@link ConnectionPanel} (`src/components/shopify/ConnectionPanel.js`), keyed by
 * connection id so switching stores remounts it with a clean slate; the connect screens live in
 * `src/components/shopify/ConnectStore.js`.
 *
 * Page order: header → store switcher → store overview → sources & locations → sync activity →
 * needs attention → API access → danger zone.
 *
 * The MOCK_* data in `shopify/shared.js` is used ONLY as a demo fallback when the connections
 * fetch failed (no real ids), so the page still renders something.
 */

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { btn, countPill } from "@/lib/ui";
import { Button, MOCK_AI_EXPORTS, MOCK_CONNECTION, MOCK_CONNECTION_2, MOCK_EXPORTS, Modal, Toasts, connKey, shopLabel } from "./shopify/shared";
import StoreSwitcher from "./shopify/StoreSwitcher";
import ConnectionPanel from "./shopify/ConnectionPanel";
import { ConnectStore, ResumeConnect } from "./shopify/ConnectStore";

// Friendly text for the specific bring-your-own-app OAuth failure reasons.
const REASON_TEXT = {
  state_shop_mismatch: "The store you entered didn't match the store you approved on Shopify. Enter your permanent .myshopify.com name (Shopify admin → Settings → Domains), then connect again.",
  state_expired: "That took too long, so the connection link expired. Please connect again.",
  state_bad_signature: "The connection link couldn't be verified. Connect again; if it keeps happening, the API may have restarted mid-connect.",
  state_missing: "Shopify didn't return the connection link. Please connect again.",
  state_not_custom: "The install came back on the wrong callback. Check your app's Redirect URL is exactly the one from the guide (…/shopify/callback-custom).",
};

export default function ShopifyIntegrationPage({
  initialExports = [],
  // "standard" = the OAuth public-app page. "prerelease" = the deprecated bring-your-own-app page:
  // only the header badge + connect screen differ; the management experience is shared.
  variant = "standard",
  // Every store the user has connected. `null` = the fetch failed → two-store demo. `[]` = no
  // stores yet → connect screen.
  initialConnections = null,
  // Distinct catalogue pricelists [{ name, vat, valid_from }] — drives each source's priority list.
  initialPricelists = [],
  // The user's Own Source feeds — offered as sources next to the Patrik exports.
  initialFeeds = [],
  // Exports with AI categorization — a Patrik source can tag with one of them.
  initialAiExports = [],
  // Deprecated variant only: the fixed App URL + Redirect URL for the customer's own app.
  oauthConfig = null,
}) {
  const isDemo = initialConnections === null;
  const isPrerelease = variant === "prerelease";
  const seedConnections = isDemo ? [MOCK_CONNECTION, MOCK_CONNECTION_2] : initialConnections;
  const exportOptions = isDemo && initialExports.length === 0 ? MOCK_EXPORTS : initialExports;
  const aiExportOptions = isDemo && initialAiExports.length === 0 ? MOCK_AI_EXPORTS : initialAiExports;

  const [connections, setConnections] = useState(seedConnections);
  const [selectedKey, setSelectedKey] = useState(() => {
    const active = seedConnections.find((c) => c.status === "active") || seedConnections[0];
    return active ? connKey(active) : null;
  });
  const [adding, setAdding] = useState(seedConnections.length === 0);
  const [connectPrefill, setConnectPrefill] = useState("");
  const [resumeShop, setResumeShop] = useState("");
  const [addSourceId, setAddSourceId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  /* ----- toasts ----- */
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const notify = (n) => {
    if (!n) return;
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-3), { id, ...n }]);
    setTimeout(() => dismiss(id), n.tone === "error" ? 9000 : 4500);
  };

  const showConnect = adding || connections.length === 0;
  const selected = connections.find((c) => connKey(c) === selectedKey) || connections[0] || null;

  // URL params the portal can arrive with — handled once, then stripped so a refresh can't replay:
  //   ?shopify=connected|error  OAuth outcome (API redirect after install)
  //   ?shop=<domain>            Shopify's App URL entry (connected → select; not → connect it)
  //   ?connect=1                "connect another store"
  //   ?addSource=<export id>    returning from "Create source"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("claim")) return; // the claim effect below owns that arrival
    const outcome = params.get("shopify");
    const shopParam = params.get("shop");
    const wantConnect = params.get("connect") === "1";
    const addSrc = params.get("addSource");
    if (!outcome && !shopParam && !wantConnect && !addSrc) return;
    if (addSrc) setAddSourceId(addSrc);

    let msg = null;
    if (outcome === "connected") {
      msg = { tone: "success", text: params.get("webhooks") === "partial" ? "Store connected. Some webhooks could not be registered — they'll be retried." : "Store connected." };
    } else if (outcome === "error") {
      const reason = params.get("reason") || "unknown error";
      msg = { tone: "error", text: REASON_TEXT[reason] || `Connection failed (${reason}).` };
    }

    if (shopParam || wantConnect) {
      const match = shopParam ? connections.find((c) => c.shopDomain === shopParam) : null;
      if (match) {
        setSelectedKey(connKey(match));
        setAdding(false);
      } else if (shopParam && isPrerelease) {
        // Never auto-launch the shared-app OAuth for a bring-your-own-app store — just prefill.
        setConnectPrefill(shopLabel(shopParam));
        setAdding(true);
      } else if (shopParam) {
        setResumeShop(shopParam);
        setConnectPrefill(shopLabel(shopParam));
      } else if (wantConnect) {
        setAdding(true);
      }
    }

    const url = new URL(window.location.href);
    ["shopify", "shop", "webhooks", "reason", "connect", "addSource", "host", "hmac", "timestamp", "session", "id_token", "embedded", "locale"].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    if (msg) queueMicrotask(() => notify(msg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Claim a pending Shopify-initiated install (?shop&claim from the welcome page after sign-in).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop");
    const claim = params.get("claim");
    if (!shopParam || !claim) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/nextapi/export/shopify/connection/claim", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shop: shopParam, claimToken: claim }),
        });
        const data = await res.json();
        if (!res.ok || !data?.connection) throw new Error(data?.error || "claim failed");
        if (cancelled) return;
        const conn = data.connection;
        setConnections((list) => (list.some((c) => connKey(c) === connKey(conn)) ? list.map((c) => (connKey(c) === connKey(conn) ? conn : c)) : [...list, conn]));
        setSelectedKey(connKey(conn));
        setAdding(false);
        notify({ tone: "success", text: "Store connected." });
      } catch {
        if (!cancelled) notify({ tone: "error", text: "We couldn't finish connecting your store. Try \"Sync now\", or reconnect it." });
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          ["shop", "claim"].forEach((k) => url.searchParams.delete(k));
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A panel reflects what it learns (last sync, issues, reconnect, rename) onto its switcher pill.
  const patchConnection = (key, patch) => setConnections((list) => list.map((c) => (connKey(c) === key ? { ...c, ...patch } : c)));

  // Drop a disconnected store and re-point the selection (or fall back to the connect screen).
  const handleDisconnected = (key, notice = { tone: "success", text: "Store disconnected." }) => {
    const next = connections.filter((c) => connKey(c) !== key);
    setConnections(next);
    if (next.length === 0) setAdding(true);
    else if (key === selectedKey) setSelectedKey(connKey(next[0]));
    notify(notice);
  };

  const selectStore = (key) => { setAdding(false); setResumeShop(""); setSelectedKey(key); };
  const startAddStore = () => { setResumeShop(""); setConnectPrefill(""); setAdding(true); };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Shopify"
        badge={<span className={countPill}>{isPrerelease ? "Beta · Deprecated" : "Integration"}</span>}
        description={isPrerelease
          ? "Deprecated connect — this store uses your own custom Shopify app. New stores should use the standard Shopify integration."
          : "Sync products, inventory, pricing and media from the Partner Portal to your connected Shopify stores."}
        right={
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Open guide" className={cn(btn.base, btn.variant.outline, btn.size.sm)}>
            <HelpCircle className="text-muted-foreground" />
            Guide
          </button>
        }
      />

      <div className="flex-1 p-4 md:p-8">
        {connections.length > 0 && (
          <StoreSwitcher connections={connections} selectedKey={selectedKey} adding={adding} onSelect={selectStore} onAdd={startAddStore} />
        )}

        {resumeShop ? (
          <ResumeConnect
            shopDomain={resumeShop}
            onNotice={notify}
            onCancel={() => { setResumeShop(""); setConnectPrefill(shopLabel(resumeShop)); setAdding(true); }}
          />
        ) : showConnect ? (
          <ConnectStore
            variant={variant}
            oauthConfig={oauthConfig}
            canCancel={connections.length > 0}
            onCancel={() => setAdding(false)}
            onNotice={notify}
            initialDomain={connectPrefill}
          />
        ) : (
          <ConnectionPanel
            key={selectedKey}
            connection={selected}
            variant={variant}
            exportOptions={exportOptions}
            feedOptions={initialFeeds}
            aiExportOptions={aiExportOptions}
            pricelists={initialPricelists}
            addSourceId={addSourceId}
            onAddSourceConsumed={() => setAddSourceId(null)}
            onNotice={notify}
            onDisconnected={handleDisconnected}
            onPatch={patchConnection}
          />
        )}
      </div>

      <Toasts toasts={toasts} onDismiss={dismiss} />

      {showHelp && (
        <Modal title="How Shopify sync works" onClose={() => setShowHelp(false)} size="lg" footer={<Button variant="default" onClick={() => setShowHelp(false)}>Got it</Button>}>
          <p className="text-sm leading-relaxed text-foreground">
            Connect a Shopify store and the portal keeps it stocked from the catalogue — stock, products, prices, content and images, pushed one way (portal → store). Nothing is ever deleted from your store.
          </p>
          <ol className="mt-4 space-y-2.5">
            {[
              ["Connect a store", "One approval on Shopify links the store to the portal."],
              ["Add a source", "Point a Patrik export or one of your own feeds at a Shopify location."],
              ["Choose how much to manage", "From Stock only up to Portal authoritative, plus exactly what to push."],
              ["Let it sync", "Runs automatically on catalogue updates — or use Sync now any time."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                <p className="pt-0.5 text-sm leading-snug text-foreground"><span className="font-medium">{t}.</span> <span className="text-muted-foreground">{d}</span></p>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Your edits are safe.</span> In <span className="font-medium text-foreground">Create, then hand off</span>, the portal adds each product once and then only keeps stock current — anything you change in Shopify stays.
          </p>
        </Modal>
      )}
    </div>
  );
}
