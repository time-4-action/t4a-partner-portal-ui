"use client";

/**
 * SyncActivity — the operational section: three compact stats (synced · pending · errors), a
 * dense table of the latest runs (5) with structured result chips, and the two modals behind it:
 * RunDetailsModal (one run, everything it did) and RunHistoryModal (the full window).
 */

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { table } from "@/lib/ui";
import {
  Badge, Button, Dot, Empty, Modal, RUN_COUNT_LABELS, Section, SkeletonRows,
  fmtDateTime, fmtDuration, fmtNum, fmtTimeShort, jobTypeLabel, ownershipMeta, runResultChips, runStatusMeta,
} from "./shared";

const RECENT = 5;

/** Result cell: structured chips from counts, else the row's free-text detail. */
function RunResult({ job, compact = false }) {
  const chips = runResultChips(job.counts);
  const status = runStatusMeta(job.status);
  if (job.error && job.status === "failed") {
    return <span className={cn("block truncate text-xs text-red-fg", !compact && "max-w-[28rem]")} title={job.error}>{job.error}</span>;
  }
  if (chips.length === 0) {
    const text = job.detail || job.error || (job.status === "running" ? "In progress…" : job.counts?.inScope === 0 ? "Nothing in scope" : "No changes");
    return <span className="block truncate text-xs text-muted-foreground" title={text}>{text}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {chips.slice(0, compact ? 4 : 6).map((c) => (
        <span key={c.key} className={cn("inline-flex items-center gap-1 rounded border px-1.5 text-[11px] leading-[18px] tabular-nums", c.tone === "danger" ? "border-red-500/25 text-red-fg" : c.tone === "warning" ? (status.tone === "danger" ? "border-red-500/25 text-red-fg" : "border-amber-500/25 text-amber-fg") : "border-border text-muted-foreground")}>
          <span>{c.label}</span><span className="font-medium text-foreground">{fmtNum(c.value)}</span>
        </span>
      ))}
      {chips.length > (compact ? 4 : 6) && <span className="text-[11px] text-muted-foreground">+{chips.length - (compact ? 4 : 6)}</span>}
    </span>
  );
}

function StatusCell({ status }) {
  const m = runStatusMeta(status);
  return <Badge tone={m.tone}>{status === "running" && <Dot tone="info" pulse />}{m.label}</Badge>;
}

export default function SyncActivity({ jobs, counts, state, onRefresh, refreshing, onOpenRun, onViewAll, nowTs }) {
  const recent = jobs.slice(0, RECENT);
  const loading = state === "loading";
  return (
    <Section
      title="Sync activity"
      actions={
        <>
          {jobs.length > 0 && <Button size="sm" variant="ghost" onClick={onViewAll} className="text-muted-foreground">View all runs</Button>}
          <Button size="icon-sm" variant="ghost" onClick={onRefresh} disabled={refreshing} aria-label="Refresh activity" title="Refresh" className="text-muted-foreground">
            <RefreshCw className={cn(refreshing && "animate-spin")} />
          </Button>
        </>
      }
      bodyClassName="p-0"
    >
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: "Synced", value: counts.synced, tone: "" },
          { label: "Pending", value: counts.pending, tone: counts.pending ? "text-amber-fg" : "" },
          { label: "Errors", value: counts.error, tone: counts.error ? "text-red-fg" : "" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={cn("text-lg font-semibold leading-tight tabular-nums", s.tone || "text-foreground")}>{loading ? <span className="inline-block h-5 w-12 skeleton rounded" /> : fmtNum(s.value)}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <SkeletonRows n={3} h="h-10" className="p-4" />
      ) : state === "error" ? (
        <Empty title="Couldn't load sync activity." className="m-4" action={<Button size="sm" onClick={onRefresh}>Try again</Button>} />
      ) : recent.length === 0 ? (
        <Empty title="No sync runs yet." className="m-4">Use <span className="font-medium text-foreground">Sync now</span> to push your first update.</Empty>
      ) : (
        <>
          {/* desktop */}
          <div className={cn(table.wrap, "hidden md:block")}>
            <table className={table.table}>
              <thead className={table.header}>
                <tr>
                  <th className={table.head}>Type</th>
                  <th className={table.head}>Scope</th>
                  <th className={table.head}>Status</th>
                  <th className={cn(table.head, "text-right")}>Attempts</th>
                  <th className={table.head}>Started</th>
                  <th className={cn(table.head, "w-full")}>Result</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {recent.map((j) => (
                  <tr key={j.id} className={cn(table.row, "cursor-pointer")} onClick={() => onOpenRun(j)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenRun(j); } }} tabIndex={0} role="button" aria-label={`Run ${jobTypeLabel(j.type)} ${runStatusMeta(j.status).label}, open details`}>
                    <td className={cn(table.cell, "pl-4 text-[13px] text-foreground")}>{jobTypeLabel(j.type)}</td>
                    <td className={table.cell}>
                      <span className="block text-[13px] tabular-nums text-foreground">{j.label ?? "—"}</span>
                      {j.trigger && <span className="block text-[11px] capitalize text-muted-foreground">{j.trigger}</span>}
                    </td>
                    <td className={table.cell}><StatusCell status={j.status} /></td>
                    <td className={cn(table.cell, "text-right tabular-nums text-muted-foreground")}>{j.attempts ?? 1}</td>
                    <td className={cn(table.cell, "text-muted-foreground")} title={fmtDateTime(j.startedAt || j.time)}>{fmtTimeShort(j.startedAt || j.time, nowTs)}</td>
                    <td className={cn(table.cell, "max-w-0 pr-4 whitespace-normal")}><RunResult job={j} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile */}
          <ul className="divide-y divide-border md:hidden">
            {recent.map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => onOpenRun(j)} className="flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground">{jobTypeLabel(j.type)}</span>
                    <StatusCell status={j.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">{j.label ?? "—"}</span>
                    <span>{fmtTimeShort(j.startedAt || j.time, nowTs)}</span>
                  </div>
                  <RunResult job={j} compact />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

/* ------------------------------ Run details ------------------------------- */

export function RunDetailsModal({ job, locations, onClose }) {
  const m = runStatusMeta(job.status);
  const counts = job.counts || null;
  return (
    <Modal
      title="Run details"
      titleAdornment={<><Badge tone="neutral">{jobTypeLabel(job.type)}</Badge><Badge tone={m.tone}>{job.status === "running" && <Dot tone="info" pulse />}{m.label}</Badge></>}
      onClose={onClose}
      size="lg"
      zIndex="z-[70]"
      footer={<Button variant="default" onClick={onClose}>Done</Button>}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Trigger</dt><dd className="mt-0.5 capitalize text-foreground">{job.trigger || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Started</dt><dd className="mt-0.5 text-foreground">{fmtDateTime(job.startedAt || job.time)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Finished</dt><dd className="mt-0.5 text-foreground">{job.finishedAt ? fmtDateTime(job.finishedAt) : job.status === "running" ? "In progress" : "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Duration</dt><dd className="mt-0.5 text-foreground">{fmtDuration(job.startedAt, job.finishedAt) || "—"}</dd></div>
      </dl>

      {job.error && <p className="mt-4 break-words rounded-md border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-sm text-red-fg">{job.error}</p>}

      {job.scopes?.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sources in this run</p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {job.scopes.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{s.source || "—"}</span>
                <Badge tone="neutral">{s.type === "own_source" ? "Feed" : "Patrik"}</Badge>
                <span className="text-xs text-muted-foreground">{ownershipMeta(s.ownership).short}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {locations.find((l) => l.id === s.locationId)?.name || (s.locationId ? `…${String(s.locationId).slice(-6)}` : "—")}
                  {typeof s.products === "number" ? ` · ${fmtNum(s.products)} items` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {counts && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">What this run did</p>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {RUN_COUNT_LABELS.map(([key, label]) => {
              const v = counts[key] || 0;
              const danger = (key === "failed" || key === "unmatched") && v > 0;
              return (
                <div key={key} className={cn("bg-card px-3 py-2", !v && "opacity-50")}>
                  <dd className={cn("text-base font-semibold leading-tight tabular-nums", danger ? (key === "failed" ? "text-red-fg" : "text-amber-fg") : "text-foreground")}>{fmtNum(v)}</dd>
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {job.errors?.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Errors · {job.errors.length}</p>
          <ul className="divide-y divide-border rounded-lg border border-red-500/25">
            {job.errors.map((e, i) => (
              <li key={i} className="break-words px-3 py-2 text-xs text-red-fg-soft">
                {e.parentCode && <span className="mr-2 font-mono text-red-fg">{e.parentCode}</span>}
                {e.error || String(e)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.unmatched?.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Unmatched · {job.unmatched.length}</p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {job.unmatched.map((u, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 px-3 py-1.5 text-xs">
                <span className="font-mono text-foreground">{u.sku}</span>
                {u.parentCode && <span className="text-muted-foreground">{u.parentCode}</span>}
                <span className="ml-auto text-muted-foreground">{u.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!counts && job.detail && <p className="mt-4 text-sm text-muted-foreground">{job.detail}</p>}
    </Modal>
  );
}

/* ------------------------------ Run history ------------------------------- */

export function RunHistoryModal({ jobs, loading, onOpenRun, onClose, nowTs }) {
  return (
    <Modal title="Sync history" description={loading ? "Loading…" : `${jobs?.length ?? 0} ${(jobs?.length ?? 0) === 1 ? "run" : "runs"} · select a run for details`} onClose={onClose} size="xl" bodyClassName="p-0">
      {loading ? (
        <SkeletonRows n={6} h="h-10" className="p-4" />
      ) : !jobs?.length ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No sync runs yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {jobs.map((j) => (
            <li key={j.id}>
              <button type="button" onClick={() => onOpenRun(j)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[7rem_6rem_minmax(0,1fr)_auto]">
                <span className="truncate text-[13px] text-foreground">{jobTypeLabel(j.type)}</span>
                <span className="sm:order-none order-first justify-self-end sm:justify-self-start"><StatusCell status={j.status} /></span>
                <span className="col-span-2 min-w-0 sm:col-span-1"><RunResult job={j} compact /></span>
                <span className="col-span-2 text-[11px] text-muted-foreground sm:col-span-1 sm:text-right sm:whitespace-nowrap" title={fmtDateTime(j.startedAt || j.time)}>{fmtTimeShort(j.startedAt || j.time, nowTs)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
