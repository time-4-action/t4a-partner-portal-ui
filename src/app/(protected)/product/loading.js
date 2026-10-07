function SkeletonCard() {
  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-3/4" />
        <div className="flex justify-between mt-1">
          <div className="h-2.5 skeleton rounded w-16" />
          <div className="h-2.5 skeleton rounded w-12" />
        </div>
        <div className="flex gap-1 mt-1">
          <div className="h-4 skeleton rounded-md w-16" />
          <div className="h-4 skeleton rounded-md w-14" />
        </div>
        <div className="h-7 skeleton rounded-lg w-full mt-1" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-8">
        {/* Compact header — icon tile + title + count, view toggle on the right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
            <div>
              <div className="h-5 w-44 skeleton rounded mb-1.5" />
              <div className="h-3 w-24 skeleton rounded" />
            </div>
          </div>
          <div className="flex bg-muted/80 border border-input/50 rounded-xl p-1 gap-0.5 w-fit">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="w-8 h-8 skeleton rounded-lg" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
