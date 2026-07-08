export default function Loading() {
  return (
    <div className="relative bg-transparent py-6 lg:py-8">
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Compact header — icon tile + title + subtitle, actions on the right */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-700/40 animate-pulse" />
            <div>
              <div className="h-5 w-36 bg-neutral-700 rounded animate-pulse mb-1.5" />
              <div className="h-3 w-80 max-w-full bg-neutral-700/30 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-neutral-800/80 border border-neutral-700/50 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-neutral-700/40 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Feed table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-800">
          {/* header row */}
          <div className="grid grid-cols-6 gap-4 border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
            {[16, 20, 14, 24, 20, 12].map((w, i) => (
              <div key={i} className="h-3 bg-neutral-700/40 rounded animate-pulse" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
          {/* rows */}
          {[1, 2, 3].map((r) => (
            <div key={r} className="grid grid-cols-6 items-center gap-4 border-b border-neutral-800 px-4 py-4 last:border-0">
              <div className="h-4 w-20 bg-neutral-700/60 rounded animate-pulse" />
              <div className="h-3.5 w-32 bg-neutral-700/30 rounded animate-pulse" />
              <div className="h-5 w-14 bg-neutral-700/40 rounded-full animate-pulse" />
              <div className="h-3.5 w-36 bg-neutral-700/30 rounded animate-pulse" />
              <div className="h-3 w-28 bg-neutral-700/20 rounded animate-pulse" />
              <div className="flex justify-end gap-1.5">
                <div className="h-7 w-16 bg-neutral-800 rounded-lg animate-pulse" />
                <div className="h-7 w-7 bg-neutral-800 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
