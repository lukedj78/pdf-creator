import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <>
      {/* KPI Cards — 2 rows of 4 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Sidebar + Main Content */}
      <div className="flex flex-col gap-2.5 mt-2.5 lg:flex-row">
        {/* Sidebar — 3 cards */}
        <div className="w-full shrink-0 space-y-2.5 lg:w-[270px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-xl" />
          ))}
        </div>

        {/* Main Content — header + 8 cards grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-64" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="w-7 h-7 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[240px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
