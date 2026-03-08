import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border md:overflow-hidden flex flex-col overflow-y-auto bg-background">
      <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 flex-1">
        {/* PageTitle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Search */}
        <Skeleton className="h-9 w-full max-w-sm rounded-md" />

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 pb-2 border-b">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Table rows — mimic: icon+name+format | status badge | date | action */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        ))}

        {/* Mobile rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sm:hidden flex items-start gap-3 py-3 border-b last:border-0">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
