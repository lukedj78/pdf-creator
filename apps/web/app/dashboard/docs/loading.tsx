import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border md:overflow-hidden flex flex-col overflow-y-auto bg-background">
      <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
