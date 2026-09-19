export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-3xl mx-auto sm:px-6 lg:px-8">
        {/* Compact header — icon tile + title + badge + subtitle */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-5 w-28 skeleton rounded" />
              <div className="h-4 w-16 skeleton rounded-full" />
            </div>
            <div className="h-3 w-80 max-w-full skeleton rounded" />
          </div>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-muted/80 to-card rounded-2xl p-6 sm:p-8 border border-input/50">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div>
              <div className="h-4 w-16 skeleton rounded mb-2.5" />
              <div className="h-11 skeleton rounded-lg" />
            </div>
            <div>
              <div className="h-4 w-20 skeleton rounded mb-2.5" />
              <div className="h-11 skeleton rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <div className="h-4 w-14 skeleton rounded mb-2.5" />
              <div className="h-11 skeleton rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <div className="h-4 w-20 skeleton rounded mb-2.5" />
              <div className="h-32 skeleton rounded-lg" />
            </div>
          </div>
          <div className="mt-8">
            <div className="h-12 w-full skeleton rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
