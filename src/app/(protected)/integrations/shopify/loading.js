export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-7 w-28 bg-neutral-700/40 rounded-full animate-pulse mb-4" />
            <div className="h-9 w-40 bg-neutral-700 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-80 max-w-full bg-neutral-700/30 rounded animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-neutral-700/40 rounded-xl animate-pulse" />
        </div>

        <div className="space-y-6">
          {/* Summary card */}
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

          {/* Config cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
              <div className="h-5 w-40 bg-neutral-700/50 rounded animate-pulse mb-2" />
              <div className="h-3.5 w-72 max-w-full bg-neutral-700/30 rounded animate-pulse mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-20 bg-neutral-700/20 rounded-xl animate-pulse border border-neutral-700/30" />
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
