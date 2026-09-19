export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8">

        {/* Compact header — icon tile + title + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
          <div>
            <div className="h-5 w-32 skeleton rounded mb-1.5" />
            <div className="h-3 w-72 max-w-full skeleton rounded" />
          </div>
        </div>

        {/* Tab switcher + preview */}
        <div className="mb-6 rounded-2xl border border-border bg-muted/40 p-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1">
              <div className="h-9 w-28 skeleton rounded-lg" />
              <div className="h-9 w-24 skeleton rounded-lg" />
            </div>
            <div className="h-9 w-32 skeleton rounded-xl" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="bg-card border border-input/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-input/50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full skeleton shrink-0" />
                    <div className="h-3.5 skeleton rounded w-16" />
                  </div>
                  <div className="h-2.5 skeleton rounded w-20 ml-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Main step card */}
          <div className="bg-gradient-to-br from-muted/80 to-card rounded-2xl border border-input/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-input/50 flex items-center justify-between">
              <div>
                <div className="h-4 w-32 skeleton rounded mb-2" />
                <div className="h-3 w-52 skeleton rounded" />
              </div>
              <div className="h-8 w-24 skeleton rounded-xl" />
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 skeleton rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between p-4 bg-card border border-input/50 rounded-2xl">
            <div className="h-9 w-24 skeleton rounded-xl" />
            <div className="h-9 w-36 skeleton rounded-xl" />
          </div>
        </div>

      </div>
    </div>
  );
}
