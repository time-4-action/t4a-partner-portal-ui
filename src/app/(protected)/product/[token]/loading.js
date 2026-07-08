export default function Loading() {
  return (
    <div className="relative py-4 sm:py-6 md:py-8">
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        {/* Back button */}
        <div className="mb-6 h-9 w-40 rounded-lg border border-neutral-800 bg-neutral-900/60 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div>
            <div className="aspect-square w-full rounded-lg bg-neutral-800 animate-pulse" />
            <div className="flex justify-center mt-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 w-3 rounded-full bg-neutral-700/60 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details column */}
          <div>
            <div className="h-9 w-3/4 bg-neutral-700 rounded-lg animate-pulse mb-3" />
            <div className="h-5 w-1/2 bg-neutral-700/40 rounded animate-pulse mb-5" />

            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-neutral-800 rounded animate-pulse" />
            </div>

            {/* Available models */}
            <div className="h-7 w-44 bg-neutral-700/60 rounded animate-pulse mb-4" />
            <div className="space-y-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full rounded-lg border-2 border-transparent bg-neutral-800 animate-pulse" />
              ))}
            </div>

            {/* Stock / price card */}
            <div className="bg-neutral-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-28 bg-neutral-700/60 rounded animate-pulse" />
                <div className="h-6 w-20 bg-neutral-700/60 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-40 bg-neutral-700/40 rounded animate-pulse" />
                <div className="h-3.5 w-48 bg-neutral-700/40 rounded animate-pulse" />
                <div className="h-3.5 w-44 bg-neutral-700/40 rounded animate-pulse" />
              </div>
            </div>

            {/* Details */}
            <div className="h-7 w-28 bg-neutral-700/60 rounded animate-pulse mt-8 mb-4" />
            <div className="space-y-2">
              {[11, 10, 11, 9, 10, 8].map((w, i) => (
                <div key={i} className="h-4 bg-neutral-800 rounded animate-pulse" style={{ width: `${w * 9}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
