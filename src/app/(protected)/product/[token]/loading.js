export default function Loading() {
  return (
    <div className="min-h-full">
      <div className="relative p-4 md:p-8 text-foreground">
        {/* Back button */}
        <div className="mb-6 h-9 w-40 rounded-lg skeleton" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div>
            <div className="aspect-square w-full rounded-lg skeleton" />
            <div className="flex justify-center mt-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 w-3 rounded-full skeleton" />
              ))}
            </div>
          </div>

          {/* Details column */}
          <div>
            <div className="h-9 w-3/4 skeleton rounded-lg mb-3" />
            <div className="h-5 w-1/2 skeleton rounded mb-5" />

            <div className="space-y-2 mb-6">
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-5/6 skeleton rounded" />
            </div>

            {/* Available models */}
            <div className="h-7 w-44 skeleton rounded mb-4" />
            <div className="space-y-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full rounded-lg border-2 skeleton" />
              ))}
            </div>

            {/* Stock / price card */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-28 skeleton rounded" />
                <div className="h-6 w-20 skeleton rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-40 skeleton rounded" />
                <div className="h-3.5 w-48 skeleton rounded" />
                <div className="h-3.5 w-44 skeleton rounded" />
              </div>
            </div>

            {/* Details */}
            <div className="h-7 w-28 skeleton rounded mt-8 mb-4" />
            <div className="space-y-2">
              {[11, 10, 11, 9, 10, 8].map((w, i) => (
                <div key={i} className="h-4 skeleton rounded" style={{ width: `${w * 9}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
