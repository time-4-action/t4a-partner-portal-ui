export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="h-9 w-48 bg-neutral-700 rounded-lg animate-pulse mb-2"></div>
                <div className="h-5 w-72 bg-neutral-700/50 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-11 w-32 bg-neutral-700 rounded-xl animate-pulse"></div>
                <div className="h-11 w-36 bg-neutral-700 rounded-xl animate-pulse"></div>
              </div>
            </div>
            <div className="h-12 w-80 bg-neutral-800/50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar Skeleton */}
          <div className="xl:col-span-1 space-y-6">
            {/* Export Format */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-5 border border-neutral-700/50">
              <div className="h-4 w-28 bg-neutral-700 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Pricelist Priority */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl border border-neutral-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-700/50">
                <div className="h-4 w-32 bg-neutral-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-48 bg-neutral-700/50 rounded animate-pulse"></div>
              </div>
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl border border-neutral-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-700/50">
                <div className="h-4 w-16 bg-neutral-700 rounded animate-pulse"></div>
              </div>
              <div className="p-5 space-y-4">
                <div className="h-10 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                <div className="h-10 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                <div className="h-10 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-9 flex-1 bg-neutral-700/30 rounded-lg animate-pulse"></div>
                  <div className="h-9 flex-1 bg-neutral-700/30 rounded-lg animate-pulse"></div>
                  <div className="h-9 flex-1 bg-neutral-700/30 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="xl:col-span-3 space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-4 border border-neutral-700/50">
                  <div className="h-8 w-12 bg-neutral-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-neutral-700/50 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Field Selection */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 border border-neutral-700/50">
              <div className="h-6 w-28 bg-neutral-700 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-10 bg-neutral-700/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 border border-neutral-700/50">
              <div className="h-6 w-20 bg-neutral-700 rounded animate-pulse mb-4"></div>
              <div className="rounded-xl border border-neutral-700/50 overflow-hidden">
                <div className="bg-neutral-800/80 h-12"></div>
                <div className="divide-y divide-neutral-700/50">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 bg-neutral-800/30 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
