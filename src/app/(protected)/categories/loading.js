export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8">
        {/* Compact header — icon tile + title + subtitle, tabs below */}
        <div className="mb-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
            <div>
              <div className="h-5 w-48 skeleton rounded mb-1.5" />
              <div className="h-3 w-72 max-w-full skeleton rounded" />
            </div>
          </div>
          <div className="flex w-fit gap-1 rounded-2xl bg-muted/40 border border-border p-1">
            {[28, 24, 32].map((w, i) => (
              <div key={i} className="h-8 rounded-xl skeleton" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>

        {/* Content card: stats + list */}
        <div className="rounded-2xl border border-input/50 bg-gradient-to-br from-muted/80 to-card overflow-hidden">
          {/* stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 border-b border-border">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 skeleton rounded mb-2" />
                <div className="h-7 w-16 skeleton rounded" />
              </div>
            ))}
          </div>
          {/* list rows */}
          <div className="divide-y divide-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-4 px-4 py-3.5">
                <div className="h-10 w-10 rounded-2xl skeleton" />
                <div className="h-4 w-40 max-w-full skeleton rounded" />
                <div className="h-4 w-56 max-w-full skeleton rounded" />
                <div className="h-8 w-24 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
