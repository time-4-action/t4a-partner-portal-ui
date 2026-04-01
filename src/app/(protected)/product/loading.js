function SkeletonCard() {
  return (
    <div className="bg-neutral-900/70 border border-neutral-800/60 rounded-xl overflow-hidden">
      <div className="aspect-square bg-neutral-800 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-neutral-700/60 rounded w-full animate-pulse" />
        <div className="h-3 bg-neutral-700/60 rounded w-3/4 animate-pulse" />
        <div className="flex justify-between mt-1">
          <div className="h-2.5 bg-neutral-700/40 rounded w-16 animate-pulse" />
          <div className="h-2.5 bg-neutral-700/40 rounded w-12 animate-pulse" />
        </div>
        <div className="flex gap-1 mt-1">
          <div className="h-4 bg-neutral-800 rounded-md w-16 animate-pulse" />
          <div className="h-4 bg-neutral-800 rounded-md w-14 animate-pulse" />
        </div>
        <div className="h-7 bg-neutral-800 rounded-lg w-full animate-pulse mt-1" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="h-8 w-56 bg-neutral-700 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-24 bg-neutral-700/40 rounded animate-pulse" />
          </div>
          <div className="flex bg-neutral-800/80 border border-neutral-700/50 rounded-xl p-1 gap-0.5 w-fit">
            <div className="w-8 h-8 bg-neutral-700/40 rounded-lg animate-pulse" />
            <div className="w-8 h-8 bg-neutral-700/40 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
