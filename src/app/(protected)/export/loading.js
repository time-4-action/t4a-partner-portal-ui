export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">

        {/* Compact header — icon tile + title + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-700/40 animate-pulse" />
          <div>
            <div className="h-5 w-32 bg-neutral-700 rounded animate-pulse mb-1.5" />
            <div className="h-3 w-72 max-w-full bg-neutral-700/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Tab switcher + preview */}
        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1">
              <div className="h-9 w-28 bg-neutral-700/50 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-neutral-700/20 rounded-lg animate-pulse" />
            </div>
            <div className="h-9 w-32 bg-neutral-800/80 border border-neutral-700/50 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-neutral-700/50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-neutral-700/40 animate-pulse shrink-0" />
                    <div className="h-3.5 bg-neutral-700/40 rounded w-16 animate-pulse" />
                  </div>
                  <div className="h-2.5 bg-neutral-700/20 rounded w-20 animate-pulse ml-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Main step card */}
          <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl border border-neutral-700/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-700/50 flex items-center justify-between">
              <div>
                <div className="h-4 w-32 bg-neutral-700 rounded animate-pulse mb-2" />
                <div className="h-3 w-52 bg-neutral-700/40 rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-neutral-700/30 rounded-xl animate-pulse" />
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-neutral-700/20 rounded-2xl animate-pulse border border-neutral-700/30" />
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-700/50 rounded-2xl">
            <div className="h-9 w-24 bg-neutral-700/30 rounded-xl animate-pulse" />
            <div className="h-9 w-36 bg-neutral-700/40 rounded-xl animate-pulse" />
          </div>
        </div>

      </div>
    </div>
  );
}
