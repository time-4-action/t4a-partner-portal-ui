"use client";

/**
 * ApiAccessSection — keys for the Sources API (`docs/sources-api.md` in the API repo). A key lets
 * another product (today: Recharge Hub) configure and run THIS store's sources over the portal's
 * API. The section itself is a compact list; creating and revoking live in ManageApiKeysModal.
 *
 * The raw key is shown exactly once, right after it is created; the list only ever carries a
 * prefix and the last four characters. Revoking is immediate and keeps the record.
 */

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { input } from "@/lib/ui";
import { Badge, Button, Empty, Field, Menu, Modal, Note, Section, SkeletonRows, fmtDate, fmtDateTime, shopLabel } from "./shared";

function useApiKeys(connectionId) {
  const [keys, setKeys] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const load = async () => {
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connectionId}/keys`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Could not load API keys."); setKeys([]); return; }
      setError(null);
      setKeys(data.keys || []);
    } catch {
      setError("Could not reach the server to load API keys.");
      setKeys([]);
    }
  };
  // The section lives inside a panel keyed by connection id, so one load per mount is enough.
  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await load(); })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { keys, error, reload: load };
}

function KeyRow({ k, onRevoke, compact = false }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{k.name}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span className="font-mono">{k.keyPrefix}…{k.last4}</span>
          <span>Created {fmtDate(k.createdAt)}</span>
          <span title={k.lastUsedAt ? fmtDateTime(k.lastUsedAt) : undefined}>{k.lastUsedAt ? `Last used ${fmtDate(k.lastUsedAt)}` : "Never used"}</span>
        </p>
      </div>
      {compact ? (
        <Menu label={`Actions for ${k.name}`} items={[{ label: "Revoke key", icon: <Trash2 />, danger: true, onSelect: () => onRevoke(k) }]} />
      ) : (
        <Button size="xs" variant="ghost" className="shrink-0 text-red-fg hover:text-red-fg" onClick={() => onRevoke(k)}><Trash2 />Revoke</Button>
      )}
    </li>
  );
}

export default function ApiAccessSection({ connectionId, shopDomain, onNotice }) {
  const { keys, error, reload } = useApiKeys(connectionId);
  const [manage, setManage] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const active = (keys || []).filter((k) => k.isActive);
  const revokedCount = (keys || []).filter((k) => !k.isActive).length;

  return (
    <Section
      title="API access"
      count={active.length || undefined}
      description="Let another product configure and run this store's sources."
      actions={<Button size="sm" onClick={() => setManage(true)}><KeyRound />Manage</Button>}
      bodyClassName="p-0"
    >
      {keys === null ? (
        <SkeletonRows n={1} h="h-12" className="p-4" />
      ) : error ? (
        <Empty title="Couldn't load API keys." className="m-4" action={<Button size="sm" onClick={reload}>Try again</Button>}>{error}</Empty>
      ) : active.length === 0 ? (
        <Empty title="No API keys." className="m-4" action={<Button size="sm" onClick={() => setManage(true)}><Plus />Create API key</Button>}>Nothing outside the portal can change this store&apos;s sources.</Empty>
      ) : (
        <>
          <ul className="divide-y divide-border">{active.slice(0, 3).map((k) => <KeyRow key={k.keyId} k={k} compact onRevoke={setRevokeTarget} />)}</ul>
          {(active.length > 3 || revokedCount > 0) && (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {active.length > 3 && <>{active.length - 3} more active · </>}{revokedCount > 0 && <>{revokedCount} revoked kept for the record · </>}
              <button type="button" onClick={() => setManage(true)} className="font-medium text-foreground hover:underline">Manage</button>
            </p>
          )}
        </>
      )}

      {manage && <ManageApiKeysModal connectionId={connectionId} shopDomain={shopDomain} keys={keys || []} onChanged={reload} onNotice={onNotice} onClose={() => setManage(false)} />}
      {revokeTarget && <RevokeKeyModal connectionId={connectionId} k={revokeTarget} onDone={() => { setRevokeTarget(null); reload(); }} onNotice={onNotice} onClose={() => setRevokeTarget(null)} />}
    </Section>
  );
}

/* ------------------------------ Manage modal ------------------------------ */

export function ManageApiKeysModal({ connectionId, shopDomain, keys, onChanged, onNotice, onClose }) {
  const [view, setView] = useState("list"); // list | create | created
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [fresh, setFresh] = useState(null); // { rawKey, name }
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const active = keys.filter((k) => k.isActive);
  const revoked = keys.filter((k) => !k.isActive);

  const create = async (e) => {
    e?.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connectionId}/keys`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() || "API key" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Could not create the key."); return; }
      setFresh({ rawKey: data.key.rawKey, name: data.key.name });
      setCopied(false);
      setView("created");
      setName("");
      onChanged();
      onNotice?.({ tone: "success", text: "API key created." });
    } catch {
      setError("Could not reach the server to create the key.");
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(fresh.rawKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError("Couldn't copy — select the key and copy it manually."); }
  };

  const footer = view === "create"
    ? <><Button onClick={() => { setView("list"); setError(null); }} disabled={creating}>Back</Button><Button variant="default" onClick={create} loading={creating} disabled={creating}>{creating ? "Creating…" : "Create key"}</Button></>
    : view === "created"
      ? <Button variant="default" onClick={() => { setFresh(null); setView("list"); }}>Done</Button>
      : <><Button onClick={onClose}>Close</Button><Button variant="default" onClick={() => { setView("create"); setError(null); }}><Plus />Create API key</Button></>;

  return (
    <Modal
      title={view === "create" ? "Create API key" : view === "created" ? "API key created" : "API access"}
      description={view === "list" ? `Keys work for ${shopLabel(shopDomain)} only.` : undefined}
      onClose={onClose}
      size="md"
      locked={creating}
      footer={footer}
      bodyClassName={view === "list" ? "p-0" : undefined}
    >
      {view === "list" && (
        <>
          {active.length === 0 ? (
            <Empty title="No active keys." className="m-4">Create a key and paste it into the other product together with this store&apos;s domain.</Empty>
          ) : (
            <ul className="divide-y divide-border">{active.map((k) => <KeyRow key={k.keyId} k={k} onRevoke={setRevokeTarget} />)}</ul>
          )}
          {revoked.length > 0 && (
            <details className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">{revoked.length} revoked {revoked.length === 1 ? "key" : "keys"}</summary>
              <ul className="mt-2 space-y-1">
                {revoked.map((k) => <li key={k.keyId} className="flex flex-wrap gap-x-2"><span className="text-foreground/80">{k.name}</span><span className="font-mono">{k.keyPrefix}…{k.last4}</span><span>revoked {fmtDate(k.revokedAt)}</span></li>)}
              </ul>
            </details>
          )}
        </>
      )}

      {view === "create" && (
        <form onSubmit={create} className="space-y-3">
          <Field label="Key name" htmlFor="api-key-name" hint="Something that tells you where the key is used, e.g. the product's name.">
            <input id="api-key-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Recharge Hub" className={cn(input)} />
          </Field>
          {error && <Note tone="warning">{error}</Note>}
        </form>
      )}

      {view === "created" && fresh && (
        <div className="space-y-3">
          <p className="text-sm text-foreground">Copy the key for <span className="font-medium">{fresh.name}</span> now. <span className="font-medium">It will not be shown again.</span></p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={fresh.rawKey} onFocus={(e) => e.target.select()} aria-label="API key" className={cn(input, "font-mono text-xs")} />
            <Button variant="default" size="default" onClick={copy} className="shrink-0">{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button>
          </div>
          <Note tone="warning">Store it securely. Anyone holding this key can configure and run this store&apos;s sources.</Note>
          {error && <Note tone="warning">{error}</Note>}
        </div>
      )}

      {revokeTarget && <RevokeKeyModal connectionId={connectionId} k={revokeTarget} onDone={() => { setRevokeTarget(null); onChanged(); }} onNotice={onNotice} onClose={() => setRevokeTarget(null)} />}
    </Modal>
  );
}

/* ------------------------------ Revoke modal ------------------------------ */

function RevokeKeyModal({ connectionId, k, onDone, onNotice, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connectionId}/keys/${k.keyId}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Could not revoke the key."); setBusy(false); return; }
      onNotice?.({ tone: "success", text: "Key revoked. Anything using it is refused from now on." });
      onDone();
    } catch {
      setError("Could not reach the server to revoke the key.");
      setBusy(false);
    }
  };
  return (
    <Modal title="Revoke API key?" onClose={onClose} size="sm" locked={busy} zIndex="z-[70]" footer={<><Button onClick={onClose} disabled={busy}>Keep</Button><Button variant="destructive" onClick={revoke} loading={busy}>{busy ? "Revoking…" : "Revoke key"}</Button></>}>
      <p className="text-sm text-foreground"><span className="font-medium">{k.name}</span> <Badge tone="neutral" className="font-mono">{k.keyPrefix}…{k.last4}</Badge></p>
      <p className="mt-2 text-xs text-muted-foreground">Anything using this key is refused from its next call on. The record is kept so you can see what it did.</p>
      {error && <Note tone="warning" className="mt-3">{error}</Note>}
    </Modal>
  );
}
