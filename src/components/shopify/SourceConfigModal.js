"use client";

/**
 * SourceConfigModal — ALL settings of one source mapping in a focused modal. Used both to add a
 * source (`mode="add"`: source · location · ownership · synced data up front, everything else
 * behind "Advanced settings") and to configure an existing one (`mode="edit"`).
 *
 * The modal works on a local DRAFT of the scope. Save is disabled until something changed, the
 * modal stays open (error inline) if the save fails, and it closes only after the parent's
 * `onSave(draft)` resolves `{ ok: true }`. Settings that don't apply (pricing while Prices is off,
 * product creation while nothing creates products…) are shown disabled with a one-line reason,
 * never dropped — the stored values survive.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, GripVertical, RefreshCw } from "lucide-react";
import Select from "../ui/Select";
import { cn } from "@/lib/utils";
import { input } from "@/lib/ui";
import {
  ROUNDING_PRESETS, STEP_OPTIONS, normalizePriceRounding, applyPriceRounding, describePriceRounding,
  matchRoundingPreset, offsetOptionsForStep, roundingEndingLabel,
} from "@/lib/priceRounding";
import {
  PRICE_FIELD_OPTIONS, EXISTING_SALE_OPTIONS,
  normalizeCompareAtPricelist, normalizePriceFields, normalizeExistingSalePolicy,
} from "@/lib/comparePrice";
import {
  Badge, Button, Disclosure, Field, Modal, Note, OWNERSHIP_MODES, PRICE_FACTOR_DECIMALS, SYNC_FLAGS, Segmented, Toggle,
  buildPricelistPriority, fmtDate, formatPriceFactor, parsePriceFactor, sourceName, useNow,
} from "./shared";

/** Coerces a scope into a complete, key-ordered object so two drafts compare by JSON. */
export function normalizeScope(s, pricelists) {
  return {
    type: s.type === "own_source" ? "own_source" : "export_config",
    exportConfigId: s.type === "own_source" ? undefined : (s.exportConfigId || undefined),
    feedId: s.type === "own_source" ? (s.feedId || undefined) : undefined,
    id: s.id || undefined,
    name: s.name || undefined,
    enabled: typeof s.enabled === "boolean" ? s.enabled : undefined,
    locationId: s.locationId || null,
    ownership: OWNERSHIP_MODES.some((m) => m.value === s.ownership) ? s.ownership : "stock_only",
    syncStock: s.syncStock !== false,
    syncNewProducts: !!s.syncNewProducts,
    syncPrices: !!s.syncPrices,
    syncDescriptions: !!s.syncDescriptions,
    syncImages: !!s.syncImages,
    syncTags: s.syncTags !== false,
    priceVatMode: s.priceVatMode === "exclusive" ? "exclusive" : "inclusive",
    priceFactor: parsePriceFactor(s.priceFactor),
    priceRounding: normalizePriceRounding(s.priceRounding),
    futureDatedGuard: s.futureDatedGuard !== false,
    compareAtPricelist: normalizeCompareAtPricelist(s.compareAtPricelist),
    priceFields: normalizePriceFields(s.priceFields),
    existingSalePolicy: normalizeExistingSalePolicy(s.existingSalePolicy),
    variantOptionName: (s.variantOptionName || "").trim(),
    titlePrefix: (s.titlePrefix || "").trim(),
    pricelistPriority: buildPricelistPriority(pricelists, s.pricelistPriority).map((p, i) => ({ _id: p._id, name: p.name, vat: p.vat, valid_from: p.valid_from, enabled: p.enabled !== false, priority: i })),
    publicationIds: Array.isArray(s.publicationIds) ? [...s.publicationIds] : [],
    aiExportId: s.aiExportId || undefined,
  };
}

const VAT_OPTIONS = [{ value: "inclusive", label: "Includes VAT" }, { value: "exclusive", label: "Excludes VAT" }];

export default function SourceConfigModal({
  mode = "edit", initial, locations, detailLoaded, publications, publishingEnabled, needsReconnect, connecting, onReconnect,
  exportOptions, feedOptions, aiExportOptions, feedAiSets, pricelists, onSave, onClose, createHref, feedsHref,
}) {
  const base = useMemo(() => normalizeScope(initial, pricelists), [initial, pricelists]);
  const [draft, setDraft] = useState(base);
  const [factorText, setFactorText] = useState(() => formatPriceFactor(base.priceFactor));
  const [roundingCustom, setRoundingCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [advanced, setAdvanced] = useState(mode === "edit");
  const [open, setOpen] = useState({ content: false, creation: false, pricing: false, publishing: false });
  const nowTs = useNow();

  const patch = (p) => setDraft((d) => ({ ...d, ...(typeof p === "function" ? p(d) : p) }));
  const toggleOpen = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const stockOnly = draft.ownership === "stock_only";
  const isFeed = draft.type === "own_source";
  const hasSource = isFeed ? !!draft.feedId : !!draft.exportConfigId;
  const hasLocation = !!draft.locationId && locations.some((l) => l.id === draft.locationId);
  const createsProducts = draft.ownership === "create_then_handoff" || draft.syncNewProducts;
  const dirty = JSON.stringify(normalizeScope(draft, pricelists)) !== JSON.stringify(base);
  const canSave = hasSource && hasLocation && (mode === "add" || dirty) && !saving;
  const title = mode === "add" ? "Add source" : `Configure ${sourceName(draft, exportOptions, feedOptions)}`;

  /* ----- source / location ----- */
  const srcVal = isFeed ? `feed:${draft.feedId || ""}` : `export:${draft.exportConfigId || ""}`;
  const setSource = (val) => {
    const sep = val.indexOf(":");
    const kind = val.slice(0, sep);
    const id = val.slice(sep + 1);
    patch(kind === "feed" ? { type: "own_source", feedId: id, exportConfigId: undefined } : { type: "export_config", exportConfigId: id, feedId: undefined });
  };

  /* ----- ownership ----- */
  // Leaving stock-only opts the source up to the full push: default every sync flag + channel ON.
  const setOwnership = (v) =>
    patch((d) => (v !== "stock_only" && d.ownership === "stock_only"
      ? { ownership: v, syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncImages: true, syncTags: true, publicationIds: d.publicationIds?.length ? d.publicationIds : publications.map((p) => p.id) }
      : { ownership: v }));

  /* ----- pricing ----- */
  const rounding = normalizePriceRounding(draft.priceRounding);
  const showRoundingCustom = roundingCustom || matchRoundingPreset(rounding) === "custom";
  const roundingPreset = showRoundingCustom ? "custom" : matchRoundingPreset(rounding);
  const offsetChoices = offsetOptionsForStep(rounding.step);
  const roundingEnding = roundingEndingLabel(rounding);
  const setRounding = (p) => patch({ priceRounding: normalizePriceRounding({ ...rounding, ...p }) });
  const money = (n) => Number(n).toFixed(2);
  const roundingExamples = [12.34, 178.94, 2039.8].map((from) => {
    const onTarget = applyPriceRounding(from, { ...rounding, alwaysAdvance: false });
    return { from: money(from), to: money(applyPriceRounding(from, rounding)), onTarget: money(onTarget), onTargetOut: money(applyPriceRounding(onTarget, { ...rounding, alwaysAdvance: true })) };
  });
  const firstEnabledPricelist = draft.pricelistPriority.find((p) => p.enabled);
  const enabledPricelists = draft.pricelistPriority.filter((p) => p.enabled).length;

  /* ----- AI tags ----- */
  const feedSets = isFeed ? feedAiSets(draft.feedId) : [];
  const feedAiSet = isFeed ? (feedSets.find((s) => s._id === draft.aiExportId) || feedSets[0] || null) : null;
  const exportAiSet = !isFeed ? aiExportOptions.find((x) => x._id === draft.aiExportId) : null;
  const srcExport = !isFeed ? exportOptions.find((x) => x._id === draft.exportConfigId) : null;
  const optionDefault = (srcExport?.option1Name || "").trim() || "Size";

  /* ----- summaries for the collapsed groups ----- */
  const aiLabel = isFeed ? feedAiSet?.name : exportAiSet?.name;
  const contentSummary = [draft.titlePrefix ? `Prefix “${draft.titlePrefix}”` : "No title prefix", aiLabel ? `AI tags: ${aiLabel}` : "Catalogue tags"].join(" · ");
  const creationSummary = createsProducts ? `Variant option “${draft.variantOptionName || optionDefault}”` : "Off — this source doesn't create products";
  const pricingSummary = !draft.syncPrices
    ? "Off — prices aren't synced"
    : [firstEnabledPricelist ? `${firstEnabledPricelist.name} first` : "No pricelist enabled", draft.priceVatMode === "inclusive" ? "incl. VAT" : "excl. VAT", draft.priceFactor !== 1 && `×${formatPriceFactor(draft.priceFactor)}`, rounding.enabled && describePriceRounding(rounding), draft.compareAtPricelist && `compare-at ${draft.compareAtPricelist}`].filter(Boolean).join(" · ");
  const publishingSummary = !detailLoaded ? "Loading channels…" : !publishingEnabled ? "Reconnect to enable" : publications.length === 0 ? "No channels in store" : `${draft.publicationIds.filter((id) => publications.some((p) => p.id === id)).length} of ${publications.length} channels`;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await onSave(normalizeScope(draft, pricelists));
    if (res?.ok) { onClose(); return; }
    setError(res?.error || "Could not save the source.");
    setSaving(false);
  };

  const sectionTitle = (t) => <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t}</h3>;

  return (
    <Modal
      title={title}
      description={mode === "add" ? "Choose what to push and where it lands. Settings can be changed any time." : "Settings for this source only."}
      onClose={onClose}
      size="lg"
      locked={saving}
      footer={
        <>
          {error && <p role="alert" className="mr-auto text-xs text-red-fg">{error}</p>}
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="default" onClick={save} disabled={!canSave} loading={saving}>{saving ? "Saving…" : mode === "add" ? "Add source" : "Save"}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ------------------------------- Source ------------------------------ */}
        <section>
          {sectionTitle("Source")}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Source" hint={exportOptions.length === 0 && feedOptions.length === 0 ? "No exports or feeds yet." : undefined}>
              <Select ariaLabel="Source" value={srcVal} onChange={(e) => setSource(e.target.value)}>
                <option value="" disabled>Select a source…</option>
                {exportOptions.map((x) => <option key={`e${x._id}`} value={`export:${x._id}`}>{`Patrik · ${x.name}`}</option>)}
                {feedOptions.map((f) => <option key={`f${f.feedId}`} value={`feed:${f.feedId}`}>{`Feed · ${f.brand}${f.status === "paused" ? " (paused)" : ""}`}</option>)}
              </Select>
            </Field>
            <Field label="Shopify location" hint={detailLoaded && locations.length === 0 ? "No inventory locations found in this store." : undefined}>
              <Select ariaLabel="Shopify location" value={draft.locationId || ""} disabled={!detailLoaded || locations.length === 0} onChange={(e) => patch({ locationId: e.target.value })}>
                {!detailLoaded && <option value="">Loading locations…</option>}
                {detailLoaded && <option value="" disabled>Select a location…</option>}
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
          </div>
          <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <a href={createHref} className="inline-flex items-center gap-0.5 hover:text-foreground">Create a new export <ArrowUpRight className="size-3" /></a>
            <a href={feedsHref} className="inline-flex items-center gap-0.5 hover:text-foreground">Manage feeds <ArrowUpRight className="size-3" /></a>
          </p>
        </section>

        {/* ------------------------------ Ownership ---------------------------- */}
        <section>
          {sectionTitle("Ownership")}
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">Ownership mode</legend>
            {OWNERSHIP_MODES.map((m) => {
              const selected = draft.ownership === m.value;
              return (
                <label key={m.value} className={cn("flex cursor-pointer gap-2.5 rounded-lg border p-3 transition-colors", selected ? "border-foreground/40 bg-muted/40" : "border-border hover:bg-accent/60")}>
                  <input type="radio" name="ownership" value={m.value} checked={selected} onChange={() => setOwnership(m.value)} className="sr-only" />
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-input")} aria-hidden="true">
                    {selected && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {m.title}
                      {m.recommended && <Badge tone="brand">Recommended</Badge>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{m.desc}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {draft.ownership === "portal_authoritative" && <Note tone="warning" className="mt-2">{OWNERSHIP_MODES[2].warn}</Note>}
        </section>

        {/* ----------------------------- Synced data --------------------------- */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            {sectionTitle("Synced data")}
            {!stockOnly && (
              <div className="-mt-2 flex items-center gap-0.5 text-xs">
                <button type="button" onClick={() => patch(Object.fromEntries(SYNC_FLAGS.map((f) => [f.key, true])))} className="rounded px-1.5 py-0.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground">All</button>
                <span className="text-muted-foreground/40">/</span>
                <button type="button" onClick={() => patch(Object.fromEntries(SYNC_FLAGS.map((f) => [f.key, false])))} className="rounded px-1.5 py-0.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground">None</button>
              </div>
            )}
          </div>
          {stockOnly ? (
            <Note>Stock only pushes inventory quantities and nothing else. Pick another ownership mode to sync prices, content, tags or images.</Note>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {SYNC_FLAGS.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">{f.label}{f.slow && <Badge tone="warning">Slow</Badge>}</span>
                    <span className="block text-xs text-muted-foreground">{f.desc}</span>
                  </span>
                  <Toggle checked={!!draft[f.key]} onChange={(v) => patch({ [f.key]: v })} ariaLabel={`Sync ${f.label}`} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----------------------------- Advanced ------------------------------ */}
        {!stockOnly && (mode === "add" && !advanced ? (
          <button type="button" onClick={() => setAdvanced(true)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-3.5" /> Advanced settings — content, product creation, pricing, publishing
          </button>
        ) : (
          <div className="space-y-2">
            {/* Content & tags */}
            <Disclosure title="Content & tags" summary={contentSummary} open={open.content} onToggle={() => toggleOpen("content")}>
              <div className="space-y-4">
                <Field label="Title prefix" htmlFor="cfg-prefix" hint={draft.ownership === "create_then_handoff" ? "Applied when a product is created; products already in your store keep their title." : "Titles already in your store are rewritten with the prefix on the next sync. SKUs and matching are untouched."}>
                  <input id="cfg-prefix" value={draft.titlePrefix} onChange={(e) => patch({ titlePrefix: e.target.value })} maxLength={40} placeholder="e.g. WINDSURF -" className={cn(input)} />
                  {draft.titlePrefix.trim() && (
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">In Shopify: <span className="font-medium text-foreground">{draft.titlePrefix.trim()}</span> Product name</p>
                  )}
                </Field>

                {isFeed ? (
                  <Field label="AI tags" hint={feedSets.length === 0 ? <>Categorization is off for this feed — tags come from the feed&apos;s own tags. <a href={feedsHref} className="text-accent-brand hover:underline">Turn it on in the feed settings</a>.</> : feedSets.length > 1 ? `This feed is categorized against ${feedSets.length} sets; this store tags with the chosen one only.` : "Its categories replace the supplier's own tags."}>
                    {feedSets.length > 0 && (
                      <Select ariaLabel="AI tags" value={feedAiSet?._id || ""} onChange={(e) => patch({ aiExportId: e.target.value || undefined })}>
                        {feedSets.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
                      </Select>
                    )}
                  </Field>
                ) : aiExportOptions.length > 0 ? (
                  <Field label="AI tags" hint={exportAiSet ? (exportAiSet.description || `Products categorized by ${exportAiSet.name} get its categories (full path) as Shopify tags; the rest keep the catalogue's.`) : "Tags come from the catalogue's own categories."}>
                    <Select ariaLabel="AI tags" value={draft.aiExportId || ""} onChange={(e) => patch({ aiExportId: e.target.value || undefined })}>
                      <option value="">None — catalogue categories only</option>
                      {aiExportOptions.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
                    </Select>
                  </Field>
                ) : null}

                {aiLabel && draft.ownership === "create_then_handoff" && <Note tone="warning">In Create, then hand off, tags are applied only when a product is created. Use Portal authoritative to keep tags current.</Note>}
                {aiLabel && draft.ownership !== "create_then_handoff" && !draft.syncTags && <Note tone="warning">Tags aren&apos;t synced for this source — AI categories reach products only on creation. Turn on Tags under Synced data.</Note>}
              </div>
            </Disclosure>

            {/* Product creation */}
            <Disclosure
              title="Product creation"
              summary={creationSummary}
              open={open.creation}
              onToggle={() => toggleOpen("creation")}
              disabled={!createsProducts}
              disabledNote="This source doesn't create products. Turn on New products under Synced data (or choose Create, then hand off) to use these settings."
            >
              <Field label="Variant option name" htmlFor="cfg-option" hint={isFeed ? "Leave blank to use “Size”." : srcExport?.option1Name ? `Leave blank to use “${optionDefault}” — the Variant Option set on the ${srcExport.name} export.` : "Leave blank to use “Size”. Set a Variant Option on the export to change the default."}>
                <input id="cfg-option" value={draft.variantOptionName} onChange={(e) => patch({ variantOptionName: e.target.value })} maxLength={255} placeholder={optionDefault} className={cn(input)} />
              </Field>
            </Disclosure>

            {/* Pricing */}
            <Disclosure
              title="Pricing"
              summary={pricingSummary}
              open={open.pricing}
              onToggle={() => toggleOpen("pricing")}
              disabled={!draft.syncPrices}
              disabledNote="Prices aren't synced for this source. Turn on Prices under Synced data to push them."
            >
              <div className="space-y-5">
                <Field label="Pricelist priority" hint="The first enabled pricelist with a valid price wins. Drag or use the arrows to reorder.">
                  <PricelistPriority
                    rows={draft.pricelistPriority}
                    nowTs={nowTs}
                    futureGuard={draft.futureDatedGuard}
                    onChange={(rows) => patch({ pricelistPriority: rows.map((p, i) => ({ ...p, priority: i })) })}
                  />
                  {enabledPricelists === 0 && <Note tone="warning" className="mt-2">Enable at least one pricelist — with none enabled, no price can be resolved.</Note>}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tax (VAT)" hint="Whether the price sent to Shopify already includes tax.">
                    <Segmented ariaLabel="VAT mode" value={draft.priceVatMode} onChange={(v) => patch({ priceVatMode: v })} options={VAT_OPTIONS} />
                  </Field>
                  <Field label="Price factor" htmlFor="cfg-factor" hint={<>100.00 is pushed as <span className="font-mono">{(100 * draft.priceFactor).toFixed(2)}</span>. Up to {PRICE_FACTOR_DECIMALS} decimals; 1 = unchanged.</>}>
                    <div className="flex items-center gap-2">
                      <div className="relative w-32">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">×</span>
                        <input
                          id="cfg-factor"
                          inputMode="decimal"
                          value={factorText}
                          onChange={(e) => { const t = e.target.value.replace(/[^\d.,]/g, ""); setFactorText(t); patch({ priceFactor: parsePriceFactor(t) }); }}
                          onBlur={() => setFactorText(formatPriceFactor(draft.priceFactor))}
                          className={cn(input, "pl-7 font-mono")}
                          placeholder="1"
                        />
                      </div>
                      {draft.priceFactor !== 1 && <button type="button" onClick={() => { setFactorText("1"); patch({ priceFactor: 1 }); }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset</button>}
                    </div>
                  </Field>
                </div>

                <div className="rounded-lg border border-border">
                  <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">Round prices</span>
                      <span className="block text-xs text-muted-foreground">Snap to a shelf-friendly figure after the factor — e.g. ending in 9.</span>
                    </span>
                    <Toggle checked={rounding.enabled} onChange={(v) => setRounding({ enabled: v })} ariaLabel="Round prices" />
                  </label>
                  {rounding.enabled && (
                    <div className="space-y-3 border-t border-border px-3 py-3">
                      <Field label="Rule">
                        <Select ariaLabel="Rounding rule" value={roundingPreset} onChange={(e) => { const preset = ROUNDING_PRESETS.find((p) => p.id === e.target.value); if (preset) setRounding(preset.rule); setRoundingCustom(!preset); }}>
                          {ROUNDING_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                          <option value="custom">Custom…</option>
                        </Select>
                      </Field>
                      {showRoundingCustom && (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Direction">
                            <Select ariaLabel="Rounding direction" value={rounding.mode} onChange={(e) => setRounding({ mode: e.target.value })}>
                              <option value="up">Up</option><option value="down">Down</option><option value="nearest">Nearest</option>
                            </Select>
                          </Field>
                          <Field label="Step">
                            <Select ariaLabel="Rounding step" value={String(rounding.step)} onChange={(e) => { const step = Number(e.target.value); const opts = offsetOptionsForStep(step); setRounding({ step, offset: opts.includes(rounding.offset) ? rounding.offset : 0 }); }}>
                              {STEP_OPTIONS.map((s) => <option key={s} value={String(s)}>{s}</option>)}
                            </Select>
                          </Field>
                          <Field label="Ends in">
                            <Select ariaLabel="Price ending" value={String(rounding.offset)} disabled={offsetChoices.length <= 1} onChange={(e) => setRounding({ offset: Number(e.target.value) })}>
                              {offsetChoices.map((o) => <option key={o} value={String(o)}>{o === 0 ? "No ending" : String(o).replace(/^0/, "")}</option>)}
                            </Select>
                          </Field>
                        </div>
                      )}
                      {rounding.mode !== "nearest" && (
                        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
                          <input type="checkbox" checked={rounding.alwaysAdvance} onChange={() => setRounding({ alwaysAdvance: !rounding.alwaysAdvance })} className="mt-0.5 size-3.5 accent-primary" />
                          <span>
                            Always move {rounding.mode}, even when the price already {roundingEnding ? <>ends in <span className="font-mono text-foreground">{roundingEnding.replace("…", "")}</span></> : "sits on the step"}
                            {" "}— <span className="font-mono">{roundingExamples[1].onTarget}</span> becomes <span className="font-mono">{roundingExamples[1].onTargetOut}</span>.
                          </span>
                        </label>
                      )}
                      <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                        <p className="font-medium text-foreground">{describePriceRounding(rounding)}</p>
                        <p className="mt-1 font-mono text-muted-foreground">
                          {roundingExamples.map((ex, i) => <span key={ex.from}>{i > 0 && " · "}{ex.from} → <span className={ex.from === ex.to ? "" : "text-foreground"}>{ex.to}</span></span>)}
                        </p>
                        <p className="mt-1 text-muted-foreground">Applied to the {draft.priceVatMode === "inclusive" ? "VAT-inclusive price shoppers see." : "VAT-exclusive (net) price — what shoppers pay won't carry the ending."}</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-foreground">Ignore prices that haven&apos;t started yet</span>
                    <span className="block text-xs text-muted-foreground">Upcoming pricelists are skipped until their start date.</span>
                  </span>
                  <Toggle checked={draft.futureDatedGuard} onChange={(v) => patch({ futureDatedGuard: v })} ariaLabel="Ignore future-dated prices" />
                </label>

                <div className="space-y-3">
                  <Field label="Compare-at price (sale)" hint="A second pricelist pushed as the struck-through “was” price. Same VAT, factor and rounding; only sent when higher than the selling price.">
                    <Select ariaLabel="Compare-at pricelist" value={draft.compareAtPricelist || ""} onChange={(e) => patch({ compareAtPricelist: normalizeCompareAtPricelist(e.target.value) })}>
                      <option value="">Off</option>
                      {draft.pricelistPriority.map((pl) => <option key={pl._id} value={pl.name}>{pl.name}</option>)}
                    </Select>
                  </Field>
                  {draft.compareAtPricelist && draft.compareAtPricelist === firstEnabledPricelist?.name && (
                    <Note tone="warning">This is also the first enabled pricelist, so compare-at equals the selling price — nothing will show as a sale.</Note>
                  )}
                  {draft.compareAtPricelist && (
                    <Field label="Fields the portal maintains" hint={(PRICE_FIELD_OPTIONS.find((o) => o.v === draft.priceFields) || PRICE_FIELD_OPTIONS[0]).hint}>
                      <Segmented ariaLabel="Price fields" value={draft.priceFields} onChange={(v) => patch({ priceFields: normalizePriceFields(v) })} options={PRICE_FIELD_OPTIONS.map((o) => ({ value: o.v, label: o.label }))} />
                    </Field>
                  )}
                  <Field label="When a variant is already on sale in Shopify" hint={<>{(EXISTING_SALE_OPTIONS.find((o) => o.v === draft.existingSalePolicy) || EXISTING_SALE_OPTIONS[0]).hint} Applies to a compare-at the merchant set, not the portal. Automatic discounts aren&apos;t detected.</>}>
                    <Segmented ariaLabel="Existing sale policy" value={draft.existingSalePolicy} onChange={(v) => patch({ existingSalePolicy: normalizeExistingSalePolicy(v) })} options={EXISTING_SALE_OPTIONS.map((o) => ({ value: o.v, label: o.label }))} />
                  </Field>
                </div>
              </div>
            </Disclosure>

            {/* Publishing */}
            <Disclosure title="Publishing" summary={publishingSummary} open={open.publishing} onToggle={() => toggleOpen("publishing")}>
              {!detailLoaded ? (
                <div className="h-12 rounded-lg skeleton" />
              ) : !publishingEnabled ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Note tone="warning" className="flex-1">Reconnect this store to grant publishing permission, then choose the channels new products go live on.</Note>
                  <Button size="sm" onClick={onReconnect} loading={connecting} disabled={needsReconnect && connecting}>{!connecting && <RefreshCw />}Reconnect</Button>
                </div>
              ) : publications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales channels found in this store.</p>
              ) : (
                <>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {publications.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                        <span className="text-[13px] font-medium text-foreground">{p.name}</span>
                        <Toggle checked={draft.publicationIds.includes(p.id)} onChange={(v) => patch((d) => ({ publicationIds: v ? [...d.publicationIds, p.id] : d.publicationIds.filter((x) => x !== p.id) }))} ariaLabel={`Publish to ${p.name}`} />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {draft.ownership === "portal_authoritative" ? "New and existing products are kept on these channels." : "Newly-created products are published to these channels; existing ones are left alone."}
                  </p>
                </>
              )}
            </Disclosure>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* --------------------------- Pricelist priority --------------------------- */

/** Drag-to-reorder (pointer, so touch works) + arrow buttons, with an enable toggle per row. */
function PricelistPriority({ rows, onChange, nowTs, futureGuard }) {
  const listRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const fromRef = useRef(null);

  const move = (from, to) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const arr = [...rows];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    onChange(arr);
  };

  useEffect(() => {
    if (dragIdx === null) return;
    const onMove = (e) => {
      const from = fromRef.current;
      const els = listRef.current?.querySelectorAll("[data-pl-row]");
      if (from === null || !els) return;
      let to = null;
      if (from < els.length - 1) { const r = els[from + 1].getBoundingClientRect(); if (e.clientY > r.top + r.height / 2) to = from + 1; }
      if (to === null && from > 0) { const r = els[from - 1].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) to = from - 1; }
      if (to !== null) { move(from, to); fromRef.current = to; setDragIdx(to); }
    };
    const onUp = () => { fromRef.current = null; setDragIdx(null); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); };
  }, [dragIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ol ref={listRef} className="divide-y divide-border rounded-lg border border-border">
      {rows.map((pl, idx) => {
        const isFuture = nowTs > 0 && pl.valid_from && new Date(pl.valid_from).getTime() > nowTs;
        return (
          <li key={pl._id} data-pl-row className={cn("flex select-none items-center gap-2 px-2 py-1.5", dragIdx === idx && "bg-muted/60", !pl.enabled && "opacity-60")}>
            <button type="button" aria-label={`Drag to reorder ${pl.name}`} onPointerDown={(e) => { e.preventDefault(); fromRef.current = idx; setDragIdx(idx); }} className="flex size-7 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing">
              <GripVertical className="size-4" />
            </button>
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold tabular-nums", idx === 0 && pl.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{idx + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className={cn("truncate text-[13px] font-medium", pl.enabled ? "text-foreground" : "text-muted-foreground")}>{pl.name}</span>
                {isFuture && futureGuard && <Badge tone="warning">Future · skipped</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">VAT {pl.vat}% · from {fmtDate(pl.valid_from)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" aria-label={`Move ${pl.name} up`} disabled={idx === 0} onClick={() => move(idx, idx - 1)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
              <button type="button" aria-label={`Move ${pl.name} down`} disabled={idx === rows.length - 1} onClick={() => move(idx, idx + 1)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
              <Toggle checked={pl.enabled} onChange={(v) => onChange(rows.map((p, i) => (i === idx ? { ...p, enabled: v } : p)))} ariaLabel={`Enable ${pl.name}`} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
