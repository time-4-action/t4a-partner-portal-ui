function SkeletonCard() {
  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
      {/* Image Placeholder */}
      <div className="bg-neutral-700 w-full aspect-square animate-pulse"></div>
      <div className="p-4 flex flex-col flex-grow">
        {/* Title Placeholder - making it taller to simulate multi-line titles */}
        <div className="h-14 bg-neutral-700 rounded w-full animate-pulse"></div>
        <div className="mt-auto pt-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="h-3 bg-neutral-700 rounded w-12 mb-2 animate-pulse"></div>
              <div className="h-8 bg-neutral-700 rounded w-24 animate-pulse"></div>
            </div>
            <div className="h-5 bg-neutral-700 rounded w-28 animate-pulse"></div>
          </div>
          {/* Button Placeholder */}
          <div className="h-10 bg-neutral-700 rounded-lg w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="h-9 w-64 bg-neutral-700 rounded animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-24 bg-neutral-800 rounded-lg animate-pulse"></div>
            <div className="h-9 w-24 bg-neutral-800 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}