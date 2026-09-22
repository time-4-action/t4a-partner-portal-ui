"use client";

/**
 * ConnectionPanel — everything for ONE connected store. Owns the store's live data (locations,
 * sales channels, reconnect flag), its saved source config, its sync activity, and every
 * mutation (save sources, sync now, recreate, rename, reconnect, disconnect). The sections it
 * composes are presentational; the modals work on drafts and call back into `persistScopes`.
 *
 * Keyed by connection id in the orchestrator so switching stores remounts it with a clean slate.
 *
 * API surface (through the /nextapi proxies):
 *   GET  …/connection/:id/detail     locations · publications · publishingEnabled · needsReconnect
 *   GET  …/connection/:id/activity   jobs · counts · unmatched · deletedInStore
 *   PUT  …/connection/:id/config     { shopifyLocationId, config: { …, scopes } } | { displayName }
 *   POST …/connection/:id/sync       → 202 { job }
 *   POST …/connection/:id/recreate   { parentCodes, cancel }
 *   DELETE …/connection/:id
 */

import { useEffect, useRef, useState } from "react";
import { normalizePriceRounding } from "@/lib/priceRounding";
import { normalizeCompareAtPricelist, normalizePriceFields, normalizeExistingSalePolicy } from "@/lib/comparePrice";
import {
  DEFAULT_SCOPE_CONFIG, MOCK_COUNTS, MOCK_DELETED_IN_STORE, MOCK_LOCATIONS, MOCK_SYNC_JOBS, MOCK_UNMATCHED,
  buildPricelistPriority, connKey, parsePriceFactor, shopLabel, useNow,
} from "./shared";
import { normalizeScope } from "./SourceConfigModal";
import StoreOverview, { RenameStoreModal, StoreDetailsModal } from "./StoreOverview";
import SourcesSection from "./SourcesSection";
import SourceConfigModal from "./SourceConfigModal";
import SyncActivity, { RunDetailsModal, RunHistoryModal } from "./SyncActivity";
import AttentionSection from "./AttentionSection";
import ApiAccessSection from "./ApiAccessSection";
import DangerZone from "./DangerZone";

const EMPTY_COUNTS = { synced: 0, pending: 0, error: 0 };

/**
 * Builds the panel's saved config from a connection record: `scopes[]` with every per-source
 * setting filled in (a source that doesn't set a value inherits the connection-level one, which
 * is how a legacy single-scope connection migrates), locations validated against the live list
 * once it is known.
 */
function makeConfig(conn, locs, pubs, validate, pricelists) {
  const cfg = conn.config || {};
  const storedLoc = conn.shopifyLocationId ?? cfg.shopifyLocationId ?? null;
  const validLoc = (id) => {
    const want = id ?? storedLoc;
    if (!validate) return want;
    return locs.some((l) => l.id === want) ? want : (locs[0]?.id ?? null);
  };
  const validPubs = (ids) => (ids || []).filter((id) => (validate ? pubs.some((p) => p.id === id) : true));
  const base = { ...DEFAULT_SCOPE_CONFIG, ...Object.fromEntries(Object.entries(cfg).filter(([k]) => k in DEFAULT_SCOPE_CONFIG)) };
  const withCfg = (s, inheritBase) => {
    const pick = (k) => (s[k] !== undefined ? s[k] : base[k]);
    return normalizeScope({
      ...s,
      locationId: validLoc(s.locationId),
      ownership: pick("ownership"), syncStock: pick("syncStock"), syncNewProducts: pick("syncNewProducts"), syncPrices: pick("syncPrices"),
      syncDescriptions: pick("syncDescriptions"), syncImages: pick("syncImages"), syncTags: pick("syncTags"),
      priceVatMode: pick("priceVatMode"), futureDatedGuard: pick("futureDatedGuard"), priceFactor: pick("priceFactor"), priceRounding: pick("priceRounding"),
      compareAtPricelist: pick("compareAtPricelist"), priceFields: pick("priceFields"), existingSalePolicy: pick("existingSalePolicy"),
      variantOptionName: pick("variantOptionName"), titlePrefix: pick("titlePrefix"),
      pricelistPriority: s.pricelistPriority ?? (inheritBase ? cfg.pricelistPriority : undefined),
      publicationIds: validPubs(s.publicationIds ?? (inheritBase ? cfg.publicationIds : [])),
    }, pricelists);
  };
  const withSource = (s) => s && (s.exportConfigId || s.feedId);
  let scopes = [];
  if (Array.isArray(cfg.scopes) && cfg.scopes.length) scopes = cfg.scopes.filter(withSource).map((s) => withCfg(s, false));
  else if (cfg.scope && withSource(cfg.scope)) scopes = [withCfg({ ...cfg.scope, locationId: storedLoc }, true)];
  else if (cfg.exportConfigId) scopes = [withCfg({ type: "export_config", exportConfigId: cfg.exportConfigId, locationId: storedLoc }, true)];
  return { scopes, shopifyLocationId: scopes[0]?.locationId ?? validLoc(storedLoc) };
}

/** The PUT body for a set of scopes: cleaned scopes + the first source mirrored to the top level. */
function buildConfigPayload(scopes, previous) {
  const cleanOne = (s) => ({
    type: s.type,
    ...(s.type === "own_source" ? { feedId: s.feedId } : { exportConfigId: s.exportConfigId }),
    // Identity keys the Sources API set — sending them keeps a source's id stable across saves.
    ...(s.id ? { id: s.id } : {}),
    ...(s.name ? { name: s.name } : {}),
    ...(typeof s.enabled === "boolean" ? { enabled: s.enabled } : {}),
    locationId: s.locationId,
    ownership: s.ownership ?? "stock_only",
    syncStock: s.syncStock ?? true,
    syncNewProducts: !!s.syncNewProducts,
    syncPrices: !!s.syncPrices,
    syncDescriptions: !!s.syncDescriptions,
    syncImages: !!s.syncImages,
    syncTags: s.syncTags ?? true,
    priceVatMode: s.priceVatMode ?? "inclusive",
    // Every pricing / creation field is always present so a source can never inherit another
    // source's value through the connection-level fallback.
    priceFactor: parsePriceFactor(s.priceFactor),
    priceRounding: normalizePriceRounding(s.priceRounding),
    futureDatedGuard: s.futureDatedGuard ?? true,
    compareAtPricelist: normalizeCompareAtPricelist(s.compareAtPricelist),
    priceFields: normalizePriceFields(s.priceFields),
    existingSalePolicy: normalizeExistingSalePolicy(s.existingSalePolicy),
    variantOptionName: (s.variantOptionName || "").trim(),
    titlePrefix: (s.titlePrefix || "").trim(),
    // Only the resolution-relevant fields; vat/valid_from are re-derived from the catalogue.
    pricelistPriority: (s.pricelistPriority || []).map((p, i) => ({ name: p.name, enabled: p.enabled !== false, priority: p.priority ?? i })),
    publicationIds: s.publicationIds || [],
    ...(s.aiExportId ? { aiExportId: s.aiExportId } : {}),
  });
  const cleanScopes = scopes
    .filter((s) => s.locationId && (s.type === "own_source" ? s.feedId : s.exportConfigId))
    .map(cleanOne);
  const first = cleanScopes[0] || (previous ? cleanOne(previous) : null);
  const { type, exportConfigId, feedId, id, name, enabled, locationId, aiExportId, ...top } = first || {};
  return {
    shopifyLocationId: cleanScopes[0]?.locationId ?? null,
    config: { ...top, scopes: cleanScopes },
  };
}

export default function ConnectionPanel({
  connection: initialConn, variant = "standard", exportOptions, feedOptions = [], aiExportOptions = [], pricelists,
  addSourceId, onAddSourceConsumed, onNotice, onDisconnected, onPatch,
}) {
  const isDemo = !initialConn._id;
  const myKey = connKey(initialConn);
  const exportFromParam = variant === "prerelease" ? "&from=prerelease" : "";
  const createHref = `/export?source=shopify&shop=${encodeURIComponent(initialConn.shopDomain)}${exportFromParam}`;
  const feedsHref = "/integrations/own-sources";
  const nowTs = useNow();

  /* ----- store + live data ----- */
  const [connection, setConnection] = useState(initialConn);
  const [locations, setLocations] = useState(isDemo ? MOCK_LOCATIONS : []);
  const [publications, setPublications] = useState([]);
  const [publishingEnabled, setPublishingEnabled] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [detailLoaded, setDetailLoaded] = useState(isDemo);
  const [config, setConfig] = useState(() => makeConfig(initialConn, isDemo ? MOCK_LOCATIONS : [], [], isDemo, pricelists));

  /* ----- activity ----- */
  const [jobs, setJobs] = useState(isDemo ? MOCK_SYNC_JOBS : []);
  const [counts, setCounts] = useState(isDemo ? MOCK_COUNTS : EMPTY_COUNTS);
  const [unmatched, setUnmatched] = useState(isDemo ? MOCK_UNMATCHED : []);
  const [deletedInStore, setDeletedInStore] = useState(isDemo ? MOCK_DELETED_IN_STORE : []);
  const [activityState, setActivityState] = useState(isDemo ? "ready" : "loading"); // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);
  const [recreating, setRecreating] = useState([]);

  /* ----- commands in flight ----- */
  const [isSyncing, setIsSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  /* ----- modals ----- */
  const [configModal, setConfigModal] = useState(null); // { mode: "add"|"edit", index?, initial }
  const [showDetails, setShowDetails] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyJobs, setHistoryJobs] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailJob, setDetailJob] = useState(null);

  const aliveRef = useRef(true);
  const timers = useRef([]);
  const jobSeq = useRef(0);
  const schedule = (fn, ms) => { const id = setTimeout(() => { timers.current = timers.current.filter((t) => t !== id); fn(); }, ms); timers.current.push(id); };
  const sleep = (ms) => new Promise((r) => schedule(r, ms));
  // Reset on (re)mount — React Strict Mode unmounts + remounts on the same fiber in dev.
  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; timers.current.forEach(clearTimeout); };
  }, []);

  const attentionCount = unmatched.length + deletedInStore.length;
  // Keep the switcher pill in step with what this panel knows (issues, reconnect, syncing).
  useEffect(() => { onPatch?.(myKey, { attentionCount, needsReconnect, syncing: isSyncing }); }, [attentionCount, needsReconnect, isSyncing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ----- loaders ----- */
  const loadActivity = async () => {
    if (isDemo) return null;
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/activity`, { cache: "no-store" });
      if (!res.ok) { if (aliveRef.current) setActivityState((s) => (s === "loading" ? "error" : s)); return null; }
      const data = await res.json();
      if (!aliveRef.current) return data;
      setJobs(data.jobs ?? []);
      setCounts(data.counts ?? EMPTY_COUNTS);
      setUnmatched(data.unmatched ?? []);
      setDeletedInStore(data.deletedInStore ?? []);
      setActivityState("ready");
      return data;
    } catch {
      if (aliveRef.current) setActivityState((s) => (s === "loading" ? "error" : s));
      return null;
    }
  };

  // Polls /activity until no run is "running", then settles the store's last-sync status.
  const pollActiveSync = async (runId = null) => {
    for (let i = 0; i < 80 && aliveRef.current; i++) {
      await sleep(runId ? 1500 : 2000);
      const activity = await loadActivity();
      if (!aliveRef.current) return null;
      const run = runId ? activity?.jobs?.find((j) => j.id === runId) : activity?.jobs?.[0];
      const stillRunning = runId ? (!run || run.status === "running") : activity?.jobs?.some((j) => j.status === "running");
      if (!stillRunning) {
        if (run) {
          const lastSyncStatus = run.status === "failed" ? "failed" : "done";
          setConnection((c) => ({ ...c, lastSyncAt: run.time, lastSyncStatus }));
          onPatch?.(myKey, { lastSyncAt: run.time, lastSyncStatus });
        }
        return run || null;
      }
    }
    return null;
  };

  // Mount (real store): live locations + channels, then re-seed the config with validation; and
  // the activity, resuming the "Syncing…" state if a run is mid-flight after a reload.
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/nextapi/export/shopify/connection/${initialConn._id}/detail`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !aliveRef.current) return;
        if (data.uninstalled) {
          onDisconnected?.(myKey, { tone: "error", text: `${shopLabel(initialConn.shopDomain)} was uninstalled in Shopify — removed from your stores.` });
          return;
        }
        const locs = data.locations ?? [];
        const pubs = data.publications ?? [];
        const conn = data.connection ? { ...initialConn, ...data.connection } : initialConn;
        setLocations(locs);
        setPublications(pubs);
        setPublishingEnabled(Boolean(data.publishingEnabled));
        setNeedsReconnect(Boolean(data.needsReconnect));
        setConnection(conn);
        setConfig(makeConfig(conn, locs, pubs, true, pricelists));
      } catch {
        /* keep the optimistic seed */
      } finally {
        if (!cancelled && aliveRef.current) setDetailLoaded(true);
      }
    })();
    loadActivity().then((activity) => {
      if (cancelled || !aliveRef.current) return;
      if (activity?.jobs?.some((j) => j.status === "running")) {
        setIsSyncing(true);
        pollActiveSync().finally(() => { if (aliveRef.current) setIsSyncing(false); });
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- persistence ----- */
  const scopes = config.scopes;
  const feedAiSets = (feedId) => {
    const ai = feedOptions.find((f) => f.feedId === feedId)?.aiCategorization;
    if (!ai?.enabled) return [];
    return (ai.exportIds || []).map((id) => ({ _id: id, name: aiExportOptions.find((x) => x._id === id)?.name || "AI categories" }));
  };
  const effectiveFeedAiSet = (scope) => {
    const sets = feedAiSets(scope.feedId);
    if (!sets.length) return null;
    return sets.find((s) => s._id === scope.aiExportId) || sets[0];
  };

  /** PUT the given scope list. Resolves { ok } / { ok:false, error } — never throws. */
  const persistScopes = async (nextScopes) => {
    if (isDemo) {
      setConfig({ scopes: nextScopes, shopifyLocationId: nextScopes[0]?.locationId ?? null });
      return { ok: true };
    }
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/config`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildConfigPayload(nextScopes, scopes[0])),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); return { ok: false, error: data.error || "Could not save the configuration." }; }
      if (aliveRef.current) setConfig({ scopes: nextScopes, shopifyLocationId: nextScopes[0]?.locationId ?? null });
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server to save." };
    }
  };

  const newScopeDefaults = (preset = {}) => normalizeScope({
    type: "export_config",
    ...(exportOptions[0] ? { exportConfigId: exportOptions[0]._id } : feedOptions[0] ? { type: "own_source", feedId: feedOptions[0].feedId } : {}),
    locationId: locations[0]?.id ?? null,
    ownership: "create_then_handoff", syncStock: true, syncNewProducts: true, syncPrices: true, syncDescriptions: true, syncImages: true, syncTags: true,
    publicationIds: publications.map((p) => p.id),
    ...preset,
  }, pricelists);

  const openAdd = (preset) => setConfigModal({ mode: "add", initial: newScopeDefaults(preset) });
  const openEdit = (index) => setConfigModal({ mode: "edit", index, initial: scopes[index] });
  const saveFromModal = async (draft) => {
    const next = configModal.mode === "add" ? [...scopes, draft] : scopes.map((s, i) => (i === configModal.index ? draft : s));
    const res = await persistScopes(next);
    if (res.ok) onNotice?.({ tone: "success", text: configModal.mode === "add" ? "Source added." : "Source settings saved." });
    return res;
  };
  const removeScope = async (index) => {
    const res = await persistScopes(scopes.filter((_, i) => i !== index));
    if (res.ok) onNotice?.({ tone: "success", text: "Source removed." });
    return res;
  };

  // Returning from "Create source" (?addSource=<id>): open the Add modal with that export preselected.
  // Waits for the live /detail load so the location list is real. Consumed once.
  useEffect(() => {
    if (!addSourceId || !detailLoaded) return;
    const known = exportOptions.some((x) => x._id === addSourceId);
    const already = scopes.some((s) => s.type === "export_config" && s.exportConfigId === addSourceId);
    if (known && !already) openAdd({ type: "export_config", exportConfigId: addSourceId, feedId: undefined });
    onAddSourceConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSourceId, detailLoaded]);

  /* ----- commands ----- */
  const reconnect = async () => {
    if (connecting || !connection.shopDomain) return;
    setConnecting(true);
    try {
      const endpoint = variant === "prerelease"
        ? `/nextapi/export/shopify/connection/${connection._id}/reconnect-custom`
        : `/nextapi/export/shopify/connect?shop=${encodeURIComponent(connection.shopDomain)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      onNotice?.({ tone: "error", text: data.error || "Could not start the reconnect." });
    } catch {
      onNotice?.({ tone: "error", text: "Could not reach the server to reconnect." });
    }
    setConnecting(false);
  };

  const disconnect = async () => {
    if (isDemo) { onDisconnected(myKey); return { ok: true }; }
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json().catch(() => ({})); return { ok: false, error: data.error || "Could not disconnect the store." }; }
      onDisconnected(myKey);
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server to disconnect." };
    }
  };

  const syncNow = async () => {
    if (isSyncing) return;
    if (isDemo) {
      setIsSyncing(true);
      const id = `job_${++jobSeq.current}`;
      const startedAt = new Date().toISOString();
      setJobs((list) => [{ id, type: "Stock", label: "4,581 / 4,581 stock", trigger: "manual", status: "running", attempts: 1, time: startedAt, startedAt, counts: { inScope: 4581 } }, ...list]);
      schedule(() => {
        const doneAt = new Date().toISOString();
        setJobs((list) => list.map((j) => (j.id === id ? { ...j, status: "done", time: doneAt, finishedAt: doneAt, counts: { inScope: 4581, matched: 4581, pushed: 4581 } } : j)));
        setConnection((c) => ({ ...c, lastSyncAt: doneAt, lastSyncStatus: "done" }));
        onPatch?.(myKey, { lastSyncAt: doneAt, lastSyncStatus: "done" });
        setIsSyncing(false);
        onNotice?.({ tone: "success", text: "Sync complete." });
      }, 1800);
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "REAUTH_REQUIRED") setNeedsReconnect(true);
        onNotice?.({ tone: "error", text: data.error || "Could not start the sync." });
        setIsSyncing(false);
        return;
      }
      await loadActivity();
      const run = await pollActiveSync(data.job?.id);
      if (run) {
        const summary = run.status === "failed" ? `Sync failed${run.error ? ` — ${run.error}` : "."}`
          : run.status === "partial" ? `Sync finished — ${run.counts?.unmatched || 0} unmatched, ${run.counts?.failed || 0} failed.`
          : "Sync complete.";
        onNotice?.({ tone: run.status === "failed" ? "error" : "success", text: summary });
      }
    } catch {
      onNotice?.({ tone: "error", text: "Could not reach the server to start the sync." });
    }
    if (aliveRef.current) setIsSyncing(false);
  };

  const requestRecreate = async (parentCode, cancel = false) => {
    if (!parentCode || recreating.includes(parentCode)) return;
    const okMsg = cancel ? `Recreation of ${parentCode} cancelled.` : `${parentCode} will be recreated on the next sync.`;
    if (isDemo) {
      setDeletedInStore((list) => list.map((d) => (d.parentCode === parentCode ? { ...d, recreateRequested: !cancel } : d)));
      onNotice?.({ tone: "success", text: okMsg });
      return;
    }
    setRecreating((r) => [...r, parentCode]);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/recreate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentCodes: [parentCode], cancel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { onNotice?.({ tone: "error", text: data.error || "Could not update the product." }); return; }
      if (aliveRef.current) setDeletedInStore(data.deletedInStore ?? []);
      onNotice?.({ tone: "success", text: okMsg });
    } catch {
      onNotice?.({ tone: "error", text: "Could not reach the server to update the product." });
    } finally {
      if (aliveRef.current) setRecreating((r) => r.filter((p) => p !== parentCode));
    }
  };

  const refreshActivity = async () => {
    if (refreshing) return;
    setRefreshing(true);
    if (!isDemo) { if (activityState === "error") setActivityState("loading"); await loadActivity(); }
    else await sleep(500);
    if (aliveRef.current) setRefreshing(false);
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    if (isDemo) { setHistoryJobs(jobs); return; }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/activity?limit=100`, { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      if (aliveRef.current) setHistoryJobs(data?.jobs ?? jobs);
    } catch {
      if (aliveRef.current) setHistoryJobs(jobs);
    } finally {
      if (aliveRef.current) setHistoryLoading(false);
    }
  };

  const saveDisplayName = async (next) => {
    const applyLocal = () => { setConnection((c) => ({ ...c, displayName: next || null })); onPatch?.(myKey, { displayName: next || null }); };
    if (isDemo) { applyLocal(); return { ok: true }; }
    try {
      const res = await fetch(`/nextapi/export/shopify/connection/${connection._id}/config`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: next }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); return { ok: false, error: data.error || "Could not rename the store." }; }
      applyLocal();
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server to rename the store." };
    }
  };

  const canAddSource = detailLoaded && (exportOptions.length > 0 || feedOptions.length > 0);

  /* ====================================================================== */
  return (
    <div className="space-y-4">
      <StoreOverview
        connection={connection}
        latestRun={jobs[0] || null}
        isSyncing={isSyncing}
        attentionCount={attentionCount}
        needsReconnect={needsReconnect}
        connecting={connecting}
        nowTs={nowTs}
        onSync={syncNow}
        onReconnect={reconnect}
        onRename={() => setRenaming(true)}
        onDisconnect={() => setDisconnecting(true)}
        onViewDetails={() => setShowDetails(true)}
      />

      <SourcesSection
        scopes={scopes}
        locations={locations}
        detailLoaded={detailLoaded}
        exportOptions={exportOptions}
        feedOptions={feedOptions}
        aiExportOptions={aiExportOptions}
        effectiveFeedAiSet={effectiveFeedAiSet}
        onAdd={() => openAdd()}
        onConfigure={openEdit}
        onRemove={removeScope}
        createHref={createHref}
        feedsHref={feedsHref}
        canAdd={canAddSource}
        busy={isSyncing}
      />

      <SyncActivity
        jobs={jobs}
        counts={counts}
        state={activityState}
        onRefresh={refreshActivity}
        refreshing={refreshing}
        onOpenRun={setDetailJob}
        onViewAll={openHistory}
        nowTs={nowTs}
      />

      <AttentionSection
        unmatched={unmatched}
        deletedInStore={deletedInStore}
        recreating={recreating}
        onRecreate={requestRecreate}
        state={activityState}
        nowTs={nowTs}
      />

      {!isDemo && <ApiAccessSection connectionId={connection._id} shopDomain={connection.shopDomain} onNotice={onNotice} />}

      <DangerZone connection={connection} onDisconnect={disconnect} open={disconnecting} onOpen={() => setDisconnecting(true)} onClose={() => setDisconnecting(false)} />

      {/* ------------------------------ modals ------------------------------ */}
      {configModal && (
        <SourceConfigModal
          mode={configModal.mode}
          initial={configModal.initial}
          locations={locations}
          detailLoaded={detailLoaded}
          publications={publications}
          publishingEnabled={publishingEnabled}
          needsReconnect={needsReconnect}
          connecting={connecting}
          onReconnect={reconnect}
          exportOptions={exportOptions}
          feedOptions={feedOptions}
          aiExportOptions={aiExportOptions}
          feedAiSets={feedAiSets}
          pricelists={pricelists}
          onSave={saveFromModal}
          onClose={() => setConfigModal(null)}
          createHref={createHref}
          feedsHref={feedsHref}
        />
      )}
      {showDetails && <StoreDetailsModal connection={connection} scopes={scopes} locations={locations} exportOptions={exportOptions} feedOptions={feedOptions} onClose={() => setShowDetails(false)} />}
      {renaming && <RenameStoreModal connection={connection} onSave={saveDisplayName} onClose={() => setRenaming(false)} />}
      {historyOpen && <RunHistoryModal jobs={historyJobs} loading={historyLoading} onOpenRun={setDetailJob} onClose={() => setHistoryOpen(false)} nowTs={nowTs} />}
      {detailJob && <RunDetailsModal job={detailJob} locations={locations} onClose={() => setDetailJob(null)} />}
    </div>
  );
}
