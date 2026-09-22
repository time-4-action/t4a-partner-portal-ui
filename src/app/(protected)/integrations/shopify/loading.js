// Route-level skeleton — mirrors the integration page's shell (header · store switcher · store
// overview · sources · activity) so the real page lands without a layout jump.
export default function Loading() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <div>
            <div className="flex items-center gap-2"><div className="h-5 w-16 skeleton rounded" /><div className="h-4 w-20 skeleton rounded-full" /></div>
            <div className="mt-1.5 h-3 w-72 max-w-full skeleton rounded" />
          </div>
          <div className="h-8 w-20 skeleton rounded-md" />
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        {/* store switcher */}
        <div className="mb-4 flex gap-2">
          {[0, 1].map((i) => <div key={i} className="h-[52px] w-40 skeleton rounded-lg" />)}
          <div className="h-[52px] w-32 skeleton rounded-lg" />
        </div>

        <div className="space-y-4">
          {/* store overview */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2.5"><div className="h-5 w-32 skeleton rounded" /><div className="h-5 w-16 skeleton rounded-full" /></div>
                <div className="mt-1.5 h-3 w-48 skeleton rounded" />
                <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-md">
                  {[0, 1, 2].map((i) => <div key={i}><div className="h-2.5 w-14 skeleton rounded" /><div className="mt-1.5 h-4 w-20 skeleton rounded" /></div>)}
                </div>
              </div>
              <div className="flex gap-1.5"><div className="h-8 w-24 skeleton rounded-md" /><div className="h-8 w-24 skeleton rounded-md" /><div className="size-8 skeleton rounded-md" /></div>
            </div>
          </div>

          {/* sources */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5"><div className="h-4 w-36 skeleton rounded" /><div className="h-8 w-28 skeleton rounded-md" /></div>
            <div className="divide-y divide-border">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1"><div className="h-4 w-48 skeleton rounded" /><div className="mt-2 space-y-1.5"><div className="h-3 w-40 skeleton rounded" /><div className="h-3 w-56 skeleton rounded" /><div className="h-3 w-64 max-w-full skeleton rounded" /></div></div>
                  <div className="flex gap-1"><div className="h-8 w-24 skeleton rounded-md" /><div className="size-8 skeleton rounded-md" /></div>
                </div>
              ))}
            </div>
          </div>

          {/* activity */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5"><div className="h-4 w-28 skeleton rounded" /><div className="size-8 skeleton rounded-md" /></div>
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              {[0, 1, 2].map((i) => <div key={i} className="px-4 py-2.5"><div className="h-2.5 w-12 skeleton rounded" /><div className="mt-1.5 h-5 w-16 skeleton rounded" /></div>)}
            </div>
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
