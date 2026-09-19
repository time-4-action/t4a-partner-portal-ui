export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8">
        {/* Compact header — icon tile + title + subtitle, actions on the right */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
            <div>
              <div className="h-5 w-36 skeleton rounded mb-1.5" />
              <div className="h-3 w-80 max-w-full skeleton rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 skeleton rounded-lg" />
            <div className="h-9 w-28 skeleton rounded-lg" />
          </div>
        </div>

        {/* Feed table */}
        <div className="overflow-hidden rounded-2xl border border-border">
          {/* header row */}
          <div className="grid grid-cols-6 gap-4 border-b border-border bg-card px-4 py-3">
            {[16, 20, 14, 24, 20, 12].map((w, i) => (
              <div key={i} className="h-3 skeleton rounded" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
          {/* rows */}
          {[1, 2, 3].map((r) => (
            <div key={r} className="grid grid-cols-6 items-center gap-4 border-b border-border px-4 py-4 last:border-0">
              <div className="h-4 w-20 skeleton rounded" />
              <div className="h-3.5 w-32 skeleton rounded" />
              <div className="h-5 w-14 skeleton rounded-full" />
              <div className="h-3.5 w-36 skeleton rounded" />
              <div className="h-3 w-28 skeleton rounded" />
              <div className="flex justify-end gap-1.5">
                <div className="h-7 w-16 skeleton rounded-lg" />
                <div className="h-7 w-7 skeleton rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
