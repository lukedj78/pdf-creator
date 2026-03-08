import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <Skeleton className="h-8 w-40 rounded-md" />

      {/* Title */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
