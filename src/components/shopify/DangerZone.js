"use client";

/**
 * DangerZone — the one destructive action, visually separated at the bottom of the page, behind
 * an explicit confirmation that spells out what disconnecting does (and does not) do.
 */

import { useState } from "react";
import { Unplug } from "lucide-react";
import { Button, Modal, Note, Section, storeName } from "./shared";

export default function DangerZone({ connection, onDisconnect, open, onOpen, onClose }) {
  return (
    <Section title="Danger zone" tone="danger">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">Disconnect Shopify store</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Stops all syncing and revokes access. Existing Shopify products are not deleted.</p>
        </div>
        <Button onClick={onOpen} className="shrink-0 text-red-fg hover:text-red-fg"><Unplug />Disconnect</Button>
      </div>
      {open && <DisconnectStoreModal connection={connection} onDisconnect={onDisconnect} onClose={onClose} />}
    </Section>
  );
}

export function DisconnectStoreModal({ connection, onDisconnect, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ack, setAck] = useState(false);
  const name = storeName(connection);

  const confirm = async () => {
    if (!ack || busy) return;
    setBusy(true);
    setError(null);
    const res = await onDisconnect();
    if (res?.ok) return; // the parent unmounts this panel
    setError(res?.error || "Could not disconnect the store.");
    setBusy(false);
  };

  return (
    <Modal
      title={`Disconnect ${name}?`}
      onClose={onClose}
      size="sm"
      locked={busy}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={!ack} loading={busy}>{busy ? "Disconnecting…" : "Disconnect store"}</Button>
        </>
      }
    >
      <ul className="space-y-1.5 text-sm text-foreground">
        <li className="flex gap-2"><span className="text-muted-foreground">•</span>Syncing stops immediately for every source mapped to this store.</li>
        <li className="flex gap-2"><span className="text-muted-foreground">•</span>The portal&apos;s access is revoked and the app is removed from your Shopify admin. API keys for this store stop working.</li>
        <li className="flex gap-2"><span className="text-muted-foreground">•</span>Products already in Shopify stay exactly as they are — nothing is deleted.</li>
        <li className="flex gap-2"><span className="text-muted-foreground">•</span>Source settings and sync history for this store are removed. Reconnecting starts fresh.</li>
      </ul>
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 size-4 accent-primary" data-autofocus />
        <span>I understand — disconnect <span className="font-medium">{connection.shopDomain}</span>.</span>
      </label>
      {error && <Note tone="warning" className="mt-3">{error}</Note>}
    </Modal>
  );
}
