import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border md:overflow-hidden flex flex-col overflow-y-auto bg-background">
      <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 flex-1">
        {/* PageTitle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>

        {/* Toolbar: search + filter + view toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36 rounded-md" />
            <Skeleton className="h-9 w-[72px] rounded-md" />
          </div>
        </div>

        {/* Grid cards — mimic TemplateCard structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl ring-1 ring-foreground/10 p-4 space-y-3">
              {/* Icon */}
              <Skeleton className="h-10 w-10 rounded-lg" />
              {/* Title */}
              <Skeleton className="h-4 w-3/5" />
              {/* Description */}
              <Skeleton className="h-3 w-4/5" />
              {/* Footer: badge + date */}
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
