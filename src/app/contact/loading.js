export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-3xl mx-auto sm:px-6 lg:px-8">
        {/* Compact header — icon tile + title + badge + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-700/40 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-5 w-28 bg-neutral-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-neutral-700/40 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-80 max-w-full bg-neutral-700/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 sm:p-8 border border-neutral-700/50">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div>
              <div className="h-4 w-16 bg-neutral-700 rounded animate-pulse mb-2.5" />
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-20 bg-neutral-700 rounded animate-pulse mb-2.5" />
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse" />
            </div>
            <div className="sm:col-span-2">
              <div className="h-4 w-14 bg-neutral-700 rounded animate-pulse mb-2.5" />
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse" />
            </div>
            <div className="sm:col-span-2">
              <div className="h-4 w-20 bg-neutral-700 rounded animate-pulse mb-2.5" />
              <div className="h-32 bg-neutral-700/30 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="mt-8">
            <div className="h-12 w-full bg-neutral-700/40 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
