export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {/* Compact header — icon tile + title + subtitle, tabs below */}
        <div className="mb-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-700/40 animate-pulse" />
            <div>
              <div className="h-5 w-48 bg-neutral-700 rounded animate-pulse mb-1.5" />
              <div className="h-3 w-72 max-w-full bg-neutral-700/30 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex w-fit gap-1 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-1">
            {[28, 24, 32].map((w, i) => (
              <div key={i} className="h-8 rounded-xl bg-neutral-700/30 animate-pulse" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>

        {/* Content card: stats + list */}
        <div className="rounded-2xl border border-neutral-700/50 bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 overflow-hidden">
          {/* stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 border-b border-white/[0.05]">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-neutral-700/30 rounded animate-pulse mb-2" />
                <div className="h-7 w-16 bg-neutral-700/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* list rows */}
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-4 px-4 py-3.5">
                <div className="h-10 w-10 rounded-2xl bg-neutral-700/30 animate-pulse" />
                <div className="h-4 w-40 max-w-full bg-neutral-700/40 rounded animate-pulse" />
                <div className="h-4 w-56 max-w-full bg-neutral-700/25 rounded animate-pulse" />
                <div className="h-8 w-24 bg-neutral-800 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
