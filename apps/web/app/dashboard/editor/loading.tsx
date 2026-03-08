import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:-mx-4 flex flex-col">
      {/* Toolbar */}
      <Skeleton className="h-12 w-full rounded-none" />

      {/* Editor panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Components panel */}
        <Skeleton className="w-56 h-full rounded-none hidden md:block" />
        {/* Canvas */}
        <Skeleton className="flex-1 h-full rounded-none" />
        {/* Properties panel */}
        <Skeleton className="w-64 h-full rounded-none hidden md:block" />
      </div>
    </div>
  )
}
