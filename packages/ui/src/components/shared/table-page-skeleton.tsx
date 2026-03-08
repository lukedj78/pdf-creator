import { Skeleton } from "@workspace/ui/components/skeleton";

interface TablePageSkeletonProps {
  /** Number of table columns */
  columns: number;
  /** Number of skeleton rows (default 5) */
  rows?: number;
  /** Whether to show the filter bar skeleton (default true) */
  showFilters?: boolean;
  /** Whether to show a search input skeleton (default false) */
  showSearch?: boolean;
  /** Whether to show an action button skeleton (default false) */
  showAction?: boolean;
}

export function TablePageSkeleton({
  columns,
  rows = 5,
  showFilters = true,
  showSearch = false,
  showAction = false,
}: TablePageSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Filters Skeleton */}
      {(showFilters || showSearch) && (
        <div className="flex items-center gap-3">
          {showSearch && (
            <Skeleton className="h-10 min-w-0 w-full sm:flex-1 sm:max-w-sm" />
          )}
          {showFilters && <Skeleton className="h-9 w-24 shrink-0" />}
          {showAction && (
            <div className="ml-auto shrink-0">
              <Skeleton className="h-10 w-36" />
            </div>
          )}
        </div>
      )}

      {/* Table Skeleton */}
      <div className="rounded-xl ring-1 ring-foreground/10 shadow-sm p-4">
        <div className="space-y-3">
          {/* Desktop: column header */}
          <div
            className="gap-4 pb-3 border-b hidden sm:grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>

          {/* Mobile: sort control placeholder */}
          <div className="flex items-center gap-2 pb-3 border-b sm:hidden">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 flex-1" />
          </div>

          {/* Desktop: table rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="gap-4 py-3 hidden sm:grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-8" />
              ))}
            </div>
          ))}

          {/* Mobile: card rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="py-3 border-b last:border-b-0 space-y-2 sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-2/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
