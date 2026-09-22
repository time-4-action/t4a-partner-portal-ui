"use client";

/**
 * SourcesSection — "Sources & locations": one readable row per source mapping (what feeds this
 * store, where it lands, what it owns, what it syncs). Nothing here is editable in place —
 * Configure opens the SourceConfigModal, the overflow menu removes a source (with confirmation).
 */

import { useState } from "react";
import { ArrowUpRight, Plus, Settings2, Trash2 } from "lucide-react";
import { normalizePriceRounding, describePriceRounding } from "@/lib/priceRounding";
import { normalizeCompareAtPricelist, normalizeExistingSalePolicy, describeExistingSalePolicy } from "@/lib/comparePrice";
import {
  Badge, Button, Empty, Menu, Modal, Note, SYNC_FLAGS, Section, SkeletonRows,
  formatPriceFactor, ownershipMeta, parsePriceFactor, sourceKind, sourceName,
} from "./shared";

/** Which of the sync flags a scope has on, as labels. Stock-only never pushes more than stock. */
export function syncedLabels(scope) {
  if (scope.ownership === "stock_only") return ["Stock"];
  return SYNC_FLAGS.filter((f) => scope[f.key]).map((f) => f.label);
}

export default function SourcesSection({
  scopes, locations, detailLoaded, exportOptions, feedOptions, aiExportOptions, effectiveFeedAiSet,
  onAdd, onConfigure, onRemove, createHref, feedsHref, canAdd, busy,
}) {
  const [removing, setRemoving] = useState(null); // scope index pending confirmation
  const [removeError, setRemoveError] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const noOptions = exportOptions.length === 0 && feedOptions.length === 0;

  const confirmRemove = async () => {
    if (removing === null) return;
    setRemoveBusy(true);
    setRemoveError(null);
    const res = await onRemove(removing);
    setRemoveBusy(false);
    if (res?.ok) setRemoving(null);
    else setRemoveError(res?.error || "Could not remove the source.");
  };

  const aiTagsFor = (s) => {
    if (s.type === "own_source") return effectiveFeedAiSet(s)?.name || null;
    return s.aiExportId ? (aiExportOptions.find((x) => x._id === s.aiExportId)?.name || "AI categories") : null;
  };

  return (
    <Section
      title="Sources & locations"
      count={scopes.length || undefined}
      actions={
        <>
          <a href={createHref} className="hidden h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex">
            Create source <ArrowUpRight className="size-3.5" />
          </a>
          <a href={feedsHref} className="hidden h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex">
            Manage feeds <ArrowUpRight className="size-3.5" />
          </a>
          <Button variant="default" size="sm" onClick={onAdd} disabled={!canAdd || busy}>
            <Plus />
            Add source
          </Button>
        </>
      }
      bodyClassName="p-0"
    >
      {!detailLoaded && scopes.length === 0 ? (
        <SkeletonRows n={2} h="h-16" className="p-4" />
      ) : noOptions ? (
        <Empty title="Nothing to sync yet." className="m-4">
          Create a <a href={createHref} className="text-accent-brand hover:underline">Shopify export</a> or register an{" "}
          <a href={feedsHref} className="text-accent-brand hover:underline">own-source feed</a>, then add it here.
        </Empty>
      ) : scopes.length === 0 ? (
        <Empty title="No sources mapped." className="m-4" action={<Button variant="default" size="sm" onClick={onAdd} disabled={!canAdd}><Plus />Add source</Button>}>
          Point an export or feed at a Shopify location to start syncing.
        </Empty>
      ) : (
        <ul className="divide-y divide-border">
          {scopes.map((s, i) => {
            const name = sourceName(s, exportOptions, feedOptions);
            const kind = sourceKind(s);
            const mode = ownershipMeta(s.ownership);
            const loc = locations.find((l) => l.id === s.locationId)?.name;
            const synced = syncedLabels(s);
            const ai = aiTagsFor(s);
            const factor = parsePriceFactor(s.priceFactor);
            const rounding = normalizePriceRounding(s.priceRounding);
            const compareAt = normalizeCompareAtPricelist(s.compareAtPricelist);
            const salePolicy = normalizeExistingSalePolicy(s.existingSalePolicy);
            const pricingBits = [
              factor !== 1 && `×${formatPriceFactor(factor)}`,
              rounding.enabled && describePriceRounding(rounding),
              compareAt && `Compare-at: ${compareAt}`,
              salePolicy !== "overwrite" && `Merchant sales: ${describeExistingSalePolicy(salePolicy)}`,
            ].filter(Boolean);
            const disabled = s.enabled === false;
            return (
              <li key={s.id || `${s.type}-${s.exportConfigId || s.feedId}-${i}`} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13px] font-medium text-foreground">
                      <span className="text-muted-foreground">{kind} · </span>{name}
                    </span>
                    {disabled && <Badge tone="neutral">Paused</Badge>}
                  </div>
                  <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="truncate text-foreground">{loc || (detailLoaded ? <span className="text-amber-fg">Not set</span> : <span className="text-muted-foreground">Loading…</span>)}</dd>
                    <dt className="text-muted-foreground">Ownership</dt>
                    <dd className="text-foreground">{mode.short}</dd>
                    <dt className="text-muted-foreground">Syncs</dt>
                    <dd className="text-foreground">{synced.length ? synced.join(" · ") : <span className="text-amber-fg">Nothing selected</span>}</dd>
                    {ai && (<><dt className="text-muted-foreground">AI tags</dt><dd className="truncate text-foreground">{ai}</dd></>)}
                    {pricingBits.length > 0 && s.ownership !== "stock_only" && s.syncPrices && (<><dt className="text-muted-foreground">Pricing</dt><dd className="truncate text-foreground">{pricingBits.join(" · ")}</dd></>)}
                  </dl>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:pt-0.5">
                  <Button size="sm" onClick={() => onConfigure(i)} disabled={busy} className="flex-1 sm:flex-none">
                    <Settings2 />
                    Configure
                  </Button>
                  <Menu
                    label={`Actions for ${name}`}
                    items={[
                      { label: "Configure", icon: <Settings2 />, onSelect: () => onConfigure(i) },
                      { label: "Remove source", icon: <Trash2 />, onSelect: () => { setRemoveError(null); setRemoving(i); }, danger: true },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-3 border-t border-border px-4 py-2 sm:hidden">
        <a href={createHref} className="text-xs font-medium text-muted-foreground hover:text-foreground">Create source ↗</a>
        <a href={feedsHref} className="text-xs font-medium text-muted-foreground hover:text-foreground">Manage feeds ↗</a>
      </div>

      {removing !== null && scopes[removing] && (
        <Modal
          title="Remove source?"
          onClose={() => !removeBusy && setRemoving(null)}
          size="sm"
          locked={removeBusy}
          footer={
            <>
              <Button onClick={() => setRemoving(null)} disabled={removeBusy}>Cancel</Button>
              <Button variant="destructive" onClick={confirmRemove} loading={removeBusy}>{removeBusy ? "Removing…" : "Remove source"}</Button>
            </>
          }
        >
          <p className="text-sm text-foreground">
            <span className="font-medium">{sourceName(scopes[removing], exportOptions, feedOptions)}</span> will stop syncing to{" "}
            <span className="font-medium">{locations.find((l) => l.id === scopes[removing].locationId)?.name || "its location"}</span>.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Products already in Shopify are left as they are. You can add the source again later.</p>
          {removeError && <Note tone="warning" className="mt-3">{removeError}</Note>}
        </Modal>
      )}
    </Section>
  );
}
