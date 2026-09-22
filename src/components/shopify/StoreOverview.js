"use client";

/**
 * StoreOverview — the selected store's summary card: name · status · domain, three facts
 * (last sync, sync state, issues) and the actions (View details · Sync now · overflow menu).
 * Also owns the two small modals it opens: StoreDetailsModal and RenameStoreModal.
 */

import { useState } from "react";
import { AlertTriangle, ExternalLink, Pencil, RefreshCw, Unplug, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { input } from "@/lib/ui";
import {
  Badge, Button, Dot, Field, Menu, Modal, Note, Spinner,
  fmtDate, fmtDateTime, fmtNum, relTime, runStatusMeta, shopLabel, sourceName, storeName, storeStatus,
} from "./shared";

export default function StoreOverview({
  connection, latestRun, isSyncing, attentionCount, needsReconnect, connecting,
  onSync, onReconnect, onRename, onDisconnect, onViewDetails, nowTs,
}) {
  const st = storeStatus({ ...connection, needsReconnect, attentionCount }, { syncing: isSyncing });
  // Sync state: the latest run wins (it knows "Partial"); the connection's last-sync flag is the fallback.
  const runMeta = isSyncing
    ? runStatusMeta("running")
    : latestRun ? runStatusMeta(latestRun.status)
    : connection.lastSyncStatus ? runStatusMeta(connection.lastSyncStatus)
    : { label: "Never synced", tone: "neutral" };
  const adminUrl = `https://${connection.shopDomain}/admin`;

  return (
    <section className="rounded-xl border border-border bg-card" aria-label="Store overview">
      {needsReconnect && (
        <div className="flex flex-col gap-2 border-b border-amber-500/25 bg-amber-500/[0.06] px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-amber-fg-softer dark:text-amber-fg">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span><span className="font-medium">Reconnect needed.</span> Shopify retired this store&apos;s access token. Reconnect to resume syncing — your store data is untouched.</span>
          </p>
          <Button size="xs" variant="default" onClick={onReconnect} loading={connecting} className="shrink-0 self-start sm:self-auto">
            {!connecting && <RefreshCw />}
            Reconnect
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="truncate text-base font-semibold leading-tight text-foreground">{storeName(connection)}</h2>
            <Badge tone={st.tone}><Dot tone={st.tone} pulse={st.key === "syncing"} className="mr-0.5" />{st.label}</Badge>
          </div>
          <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent-brand">
            {connection.shopDomain}
            <ExternalLink className="size-3" />
          </a>

          <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 text-sm sm:max-w-md">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Last sync</dt>
              <dd className="mt-0.5 truncate text-[13px] text-foreground" title={fmtDateTime(connection.lastSyncAt)}>{relTime(connection.lastSyncAt, nowTs)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sync state</dt>
              <dd className="mt-0.5"><Badge tone={runMeta.tone}>{runMeta.label}</Badge></dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Issues</dt>
              <dd className="mt-0.5 truncate text-[13px]">
                {attentionCount > 0 ? (
                  <a href="#needs-attention" className="font-medium text-amber-fg hover:underline">{fmtNum(attentionCount)} {attentionCount === 1 ? "item" : "items"}</a>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:pt-0.5">
          <Button onClick={onViewDetails} className="flex-1 lg:flex-none">View details</Button>
          <Button variant="default" onClick={onSync} loading={isSyncing} disabled={needsReconnect} className="flex-1 lg:flex-none" title={needsReconnect ? "Reconnect the store first" : undefined}>
            {!isSyncing && <RefreshCw />}
            {isSyncing ? "Syncing…" : "Sync now"}
          </Button>
          <Menu
            label="Store actions"
            items={[
              { label: "Open in Shopify", icon: <ExternalLink />, href: adminUrl, target: "_blank" },
              { label: "Rename store", icon: <Pencil />, onSelect: onRename },
              { label: "Reconnect", icon: <Link2 />, onSelect: onReconnect, disabled: connecting },
              { label: "Disconnect store", icon: <Unplug />, onSelect: onDisconnect, danger: true },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Details modal ------------------------------ */

export function StoreDetailsModal({ connection, scopes, locations, exportOptions, feedOptions, onClose }) {
  const st = storeStatus(connection);
  const grantedScopes = connection.scopes || [];
  return (
    <Modal title="Store details" description={connection.shopDomain} onClose={onClose} size="md" footer={<Button variant="default" onClick={onClose}>Done</Button>}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="mt-1"><Badge tone={st.tone}>{st.label}</Badge></dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last sync</dt>
          <dd className="mt-0.5 text-foreground">{fmtDateTime(connection.lastSyncAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Connected</dt>
          <dd className="mt-0.5 text-foreground">{fmtDate(connection.installedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Connection</dt>
          <dd className="mt-0.5 text-foreground">{connection.authMethod === "custom_oauth" || connection.authMethod === "custom_app" ? "Your own app" : "Partner Portal app"}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sources → locations</p>
        {scopes.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {scopes.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{sourceName(s, exportOptions, feedOptions)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{locations.find((l) => l.id === s.locationId)?.name || "—"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No sources yet.</p>
        )}
      </div>

      {grantedScopes.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Granted permissions</p>
          <div className="flex flex-wrap gap-1.5">{grantedScopes.map((s) => <Badge key={s} tone="neutral" className="font-mono">{s}</Badge>)}</div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------- Rename modal ------------------------------ */

export function RenameStoreModal({ connection, onSave, onClose }) {
  const [name, setName] = useState(connection.displayName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const current = (connection.displayName || "").trim();
  const dirty = name.trim().slice(0, 60) !== current;

  const submit = async (e) => {
    e?.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    const res = await onSave(name.trim().slice(0, 60));
    if (res?.ok) onClose();
    else setError(res?.error || "Could not rename the store.");
    setSaving(false);
  };

  return (
    <Modal
      title="Rename store"
      description="A friendly label for the switcher and header. Leave blank to show the domain."
      onClose={onClose}
      size="sm"
      locked={saving}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="default" onClick={submit} disabled={!dirty} loading={saving}>Save</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Store name" htmlFor="rename-store">
          <input id="rename-store" data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={shopLabel(connection.shopDomain)} className={cn(input)} />
        </Field>
        {error && <Note tone="warning" className="mt-3">{error}</Note>}
        {saving && <p className="sr-only" role="status"><Spinner className="size-3" /> Saving</p>}
      </form>
    </Modal>
  );
}
