import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border flex flex-col overflow-y-auto bg-background">
      <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 flex-1">
        {/* Title */}
        <div className="space-y-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Tabs — 5 tabs */}
        <div className="flex gap-1 border-b border-border pb-px overflow-x-auto">
          <Skeleton className="h-9 w-20 rounded-t-md" />
          <Skeleton className="h-9 w-24 rounded-t-md" />
          <Skeleton className="h-9 w-20 rounded-t-md" />
          <Skeleton className="h-9 w-18 rounded-t-md" />
          <Skeleton className="h-9 w-24 rounded-t-md" />
        </div>
        {/* Tab description */}
        <Skeleton className="h-3 w-64" />
        {/* Vertical sub-tabs + content */}
        <div className="flex gap-6">
          {/* Vertical sub-tabs */}
          <div className="flex flex-col gap-0.5 w-36 shrink-0">
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
          </div>
          {/* Content — Account (default) */}
          <div className="flex-1 min-w-0">
            <div className="max-w-3xl">
              <div className="flex sm:flex-row flex-col gap-6">
                {/* Avatar */}
                <div className="sm:w-52 shrink-0 flex flex-col items-center gap-3">
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                {/* Form fields */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-20 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
