export default function Loading() {
  return (
    <div className="relative bg-transparent py-6 lg:py-8">
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Compact header — icon tile + title + badge + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-700/40 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-5 w-24 bg-neutral-700 rounded animate-pulse" />
              <div className="h-4 w-20 bg-neutral-700/40 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-80 max-w-full bg-neutral-700/30 rounded animate-pulse" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Status summary */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-2.5 w-2.5 rounded-full bg-neutral-700 animate-pulse" />
              <div className="h-5 w-64 max-w-full bg-neutral-700/50 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-neutral-700/30 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-neutral-700/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Sources & locations */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="h-5 w-48 bg-neutral-700/50 rounded animate-pulse mb-2" />
            <div className="h-3.5 w-96 max-w-full bg-neutral-700/30 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <div className="h-3 w-14 bg-neutral-700/30 rounded animate-pulse mb-1.5" />
                      <div className="h-9 bg-neutral-800 border border-neutral-700/50 rounded-lg animate-pulse" />
                    </div>
                    <div>
                      <div className="h-3 w-20 bg-neutral-700/30 rounded animate-pulse mb-1.5" />
                      <div className="h-9 bg-neutral-800 border border-neutral-700/50 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-24 bg-neutral-800 border border-neutral-700/50 rounded-lg animate-pulse" />
                      <div className="h-9 w-9 bg-neutral-800 border border-neutral-700/50 rounded-lg animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-64 max-w-full bg-neutral-700/20 rounded animate-pulse mt-2" />
                </div>
              ))}
              <div className="h-9 w-32 bg-neutral-700/40 rounded-lg animate-pulse mt-1" />
            </div>
          </div>

          {/* Activity */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="h-5 w-32 bg-neutral-700/50 rounded animate-pulse mb-5" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-neutral-800/60 border border-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
