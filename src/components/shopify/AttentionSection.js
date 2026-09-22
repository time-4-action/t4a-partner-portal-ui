"use client";

/**
 * AttentionSection — "Needs attention": every item the last run could not push, grouped by what
 * went wrong, plus the handed-off products the merchant deleted in Shopify (which carry a real
 * action: "Recreate on next sync"). Blocking problems are red, recoverable ones amber; the box
 * itself stays calm — it is a work list, not an alarm.
 */

import { useMemo, useState } from "react";
import { Check, RefreshCw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, Dot, Empty, Modal, Section, fmtDateTime, fmtNum, relTime } from "./shared";

/** Buckets an unmatched row by its reason text (the API's reasons are a small fixed set). */
function categorize(reason = "") {
  const r = reason.toLowerCase();
  if (r.includes("duplicate")) return { key: "duplicate", label: "Duplicate SKU / barcode", title: "More than one variant matches", tone: "danger" };
  if (r.includes("no sku") || r.includes("barcode match")) return { key: "unmatched", label: "Unmatched products", title: "No matching Shopify variant", tone: "danger" };
  if (r.includes("inventory-tracked")) return { key: "tracking", label: "Inventory tracking off", title: "Variant isn't inventory-tracked", tone: "warning" };
  if (r.includes("removed in shopify")) return { key: "removed", label: "Removed in store", title: "Variant no longer in Shopify", tone: "warning" };
  if (r.includes("image")) return { key: "image", label: "Image failures", title: "Image could not be pushed", tone: "warning" };
  if (r.includes("content") || r.includes("description")) return { key: "content", label: "Content failures", title: "Content could not be pushed", tone: "warning" };
  if (r.includes("stock") || r.includes("inventory")) return { key: "stock", label: "Stock failures", title: "Stock could not be pushed", tone: "warning" };
  return { key: "other", label: "Other", title: "Could not be pushed", tone: "warning" };
}

const DELETED_CAT = { key: "deleted", label: "Deleted in Shopify", title: "Product deleted in Shopify", tone: "warning" };
const PREVIEW = 5;

export default function AttentionSection({ unmatched, deletedInStore, recreating, onRecreate, state, nowTs }) {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    const rows = unmatched.map((u) => ({ id: `u:${u.sku}`, kind: "unmatched", cat: categorize(u.reason), sku: u.sku, parentCode: u.parentCode, reason: u.reason }));
    const del = deletedInStore.map((d) => ({ id: `d:${d.parentCode}`, kind: "deleted", cat: DELETED_CAT, parentCode: d.parentCode, skus: d.skus || [], deletedInStoreAt: d.deletedInStoreAt, recreateRequested: d.recreateRequested }));
    return [...rows, ...del];
  }, [unmatched, deletedInStore]);

  const categories = useMemo(() => {
    const m = new Map();
    for (const it of items) { const c = m.get(it.cat.key) || { ...it.cat, count: 0 }; c.count += 1; m.set(it.cat.key, c); }
    return [...m.values()];
  }, [items]);

  const total = items.length;
  const anyBlocking = items.some((i) => i.cat.tone === "danger");
  const filtered = filter === "all" ? items : items.filter((i) => i.cat.key === filter);

  const row = (it) => {
    const busy = recreating.includes(it.parentCode);
    return (
      <li key={it.id} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <Dot tone={it.cat.tone} className="mt-1.5" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
              {it.kind === "unmatched" ? (
                <><span className="font-mono text-foreground">{it.sku}</span>{it.parentCode && <span className="text-xs text-muted-foreground">{it.parentCode}</span>}</>
              ) : (
                <><span className="font-mono text-foreground">{it.parentCode || "—"}</span><span className="text-xs text-muted-foreground">{it.skus.length} {it.skus.length === 1 ? "variant" : "variants"}</span></>
              )}
            </div>
            <p className="text-xs text-foreground/90">{it.cat.title}</p>
            <p className="text-xs text-muted-foreground">
              {it.kind === "unmatched" ? it.reason : <>Deleted in Shopify {it.deletedInStoreAt ? relTime(it.deletedInStoreAt, nowTs) : ""}{it.deletedInStoreAt && <span title={fmtDateTime(it.deletedInStoreAt)}> · not recreated automatically</span>}</>}
            </p>
          </div>
        </div>
        {it.kind === "deleted" && (
          it.recreateRequested ? (
            <div className="flex shrink-0 items-center gap-1.5 pl-5 sm:pl-0">
              <Badge tone="success"><Check className="size-3" />Queued for next sync</Badge>
              <Button size="xs" variant="ghost" onClick={() => onRecreate(it.parentCode, true)} loading={busy} title="Cancel — keep it deleted">{!busy && <Undo2 />}Undo</Button>
            </div>
          ) : (
            <Button size="xs" onClick={() => onRecreate(it.parentCode)} loading={busy} className="shrink-0 self-start sm:self-auto">{!busy && <RefreshCw />}Recreate on next sync</Button>
          )
        )}
      </li>
    );
  };

  return (
    <Section
      id="needs-attention"
      title="Needs attention"
      count={total}
      countTone={total === 0 ? "neutral" : anyBlocking ? "danger" : "warning"}
      actions={total > PREVIEW ? <Button size="sm" variant="ghost" onClick={() => setShowAll(true)} className="text-muted-foreground">View all</Button> : null}
      bodyClassName="p-0"
    >
      {state === "loading" ? (
        <div className="p-4"><div className="h-10 rounded-lg skeleton" /></div>
      ) : total === 0 ? (
        <Empty title="Nothing needs attention." className="m-4">{state === "error" ? "Activity couldn't be loaded — refresh to check again." : "Every product in scope was pushed on the last run."}</Empty>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2" role="group" aria-label="Filter by issue type">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All <span className="tabular-nums text-muted-foreground">{fmtNum(total)}</span></FilterChip>
              {categories.map((c) => (
                <FilterChip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)} tone={c.tone}>{c.label} <span className="tabular-nums text-muted-foreground">{fmtNum(c.count)}</span></FilterChip>
              ))}
            </div>
          )}
          <ul className="divide-y divide-border">{filtered.slice(0, PREVIEW).map(row)}</ul>
          {filtered.length > PREVIEW && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <span>Showing {PREVIEW} of {fmtNum(filtered.length)}</span>
              <button type="button" onClick={() => setShowAll(true)} className="font-medium text-foreground hover:underline">View all</button>
            </div>
          )}
        </>
      )}

      {showAll && (
        <Modal title="Needs attention" titleAdornment={<Badge tone={anyBlocking ? "danger" : "warning"}>{fmtNum(filtered.length)}</Badge>} onClose={() => setShowAll(false)} size="xl" bodyClassName="p-0">
          <ul className="divide-y divide-border">{filtered.map(row)}</ul>
        </Modal>
      )}
    </Section>
  );
}

function FilterChip({ active, onClick, tone, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active ? "border-foreground/30 bg-muted text-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {tone && <Dot tone={tone} />}
      {children}
    </button>
  );
}
