export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8">
        {/* Compact header — icon tile + title + badge + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-5 w-24 skeleton rounded" />
              <div className="h-4 w-20 skeleton rounded-full" />
            </div>
            <div className="h-3 w-80 max-w-full skeleton rounded" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Status summary */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-2.5 w-2.5 rounded-full skeleton" />
              <div className="h-5 w-64 max-w-full skeleton rounded" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 w-16 skeleton rounded mb-2" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Sources & locations */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="h-5 w-48 skeleton rounded mb-2" />
            <div className="h-3.5 w-96 max-w-full skeleton rounded mb-6" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <div className="h-3 w-14 skeleton rounded mb-1.5" />
                      <div className="h-9 skeleton rounded-lg" />
                    </div>
                    <div>
                      <div className="h-3 w-20 skeleton rounded mb-1.5" />
                      <div className="h-9 skeleton rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-24 skeleton rounded-lg" />
                      <div className="h-9 w-9 skeleton rounded-lg" />
                    </div>
                  </div>
                  <div className="h-3 w-64 max-w-full skeleton rounded mt-2" />
                </div>
              ))}
              <div className="h-9 w-32 skeleton rounded-lg mt-1" />
            </div>
          </div>

          {/* Activity */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="h-5 w-32 skeleton rounded mb-5" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
