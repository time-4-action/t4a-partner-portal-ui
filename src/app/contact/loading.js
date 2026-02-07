export default function Loading() {
  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-3xl mx-auto sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-48 bg-neutral-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-neutral-700/50 rounded animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 sm:p-8 border border-neutral-700/50">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            {/* Name Field */}
            <div>
              <div className="h-4 w-16 bg-neutral-700 rounded animate-pulse mb-2.5"></div>
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse"></div>
            </div>

            {/* Company Field */}
            <div>
              <div className="h-4 w-20 bg-neutral-700 rounded animate-pulse mb-2.5"></div>
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse"></div>
            </div>

            {/* Email Field */}
            <div className="sm:col-span-2">
              <div className="h-4 w-14 bg-neutral-700 rounded animate-pulse mb-2.5"></div>
              <div className="h-11 bg-neutral-700/30 rounded-lg animate-pulse"></div>
            </div>

            {/* Message Field */}
            <div className="sm:col-span-2">
              <div className="h-4 w-20 bg-neutral-700 rounded animate-pulse mb-2.5"></div>
              <div className="h-32 bg-neutral-700/30 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className="mt-8">
            <div className="h-12 w-full bg-neutral-700/40 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
