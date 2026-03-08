"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  type OnChangeFn,
  type VisibilityState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  SortingIcon,
} from "@hugeicons/core-free-icons";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { staggerItem } from "@workspace/ui/lib/animation";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

const MotionTableRow = motion.create(TableRow);

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  footer?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  pageCount?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  paginationState?: PaginationState;
  sortingState?: SortingState;
  /** Render a mobile card for each row. When provided, card view replaces the table on mobile. */
  renderMobileCard?: (row: TData, index: number) => React.ReactNode;
  /** Strip Card wrapper — use when DataTable is inside a PageShell or other container. */
  bare?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  emptyState,
  pagination = true,
  pageSize = 10,
  className,
  footer,
  onRowClick,
  getRowClassName,
  pageCount,
  onPaginationChange,
  onSortingChange,
  paginationState: externalPaginationState,
  sortingState: externalSortingState,
  renderMobileCard,
  bare = false,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const showCards = isMobile && !!renderMobileCard;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalPaginationState, setInternalPaginationState] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const finalPaginationState = externalPaginationState ?? internalPaginationState;
  const finalSortingState = externalSortingState ?? sorting;

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: onPaginationChange ?? setInternalPaginationState,
    manualPagination: !!pageCount,
    manualSorting: !!externalSortingState,
    state: {
      sorting: finalSortingState,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: finalPaginationState,
    },
  });

  const sortableColumns = React.useMemo(
    () => table.getAllColumns().filter((col) => col.getCanSort()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {searchKey && <Skeleton className="h-9 w-full max-w-sm" />}
        <div className="space-y-2">
          {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = data.length > 0;
  const hasResults = table.getFilteredRowModel().rows.length > 0;
  const hasFooter = columns.some((c) => c.footer);

  const Wrapper = bare ? "div" : Card;
  const wrapperClassName = bare
    ? cn("w-full flex flex-col gap-4", className)
    : cn("w-full overflow-hidden pb-0 pt-6 gap-6", className);
  const px = bare ? "" : "px-6";

  return (
    <Wrapper className={wrapperClassName}>
      {!bare && (title || description) && (
        <CardHeader className="px-6">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      <CardContent className={bare ? "p-0" : "px-0"}>
        {/* Search */}
        {searchKey && (
          <div className={cn(px, "pb-4")}>
            <div className="relative flex-1 max-w-sm">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(e) =>
                  table.getColumn(searchKey)?.setFilterValue(e.target.value)
                }
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}

        {/* Mobile Sort Control */}
        {showCards && sortableColumns.length > 0 && (
          <div className={cn("flex items-center gap-2 pb-3", px)}>
            <span className="text-xs text-muted-foreground shrink-0">Sort by</span>
            <Select
              value={finalSortingState[0]?.id ?? ""}
              onValueChange={(value) => {
                if (!value) return;
                const current = finalSortingState[0];
                const handler = onSortingChange ?? setSorting;
                if (current?.id === value) {
                  handler([{ id: value, desc: !current.desc }]);
                } else {
                  handler([{ id: value, desc: false }]);
                }
              }}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortableColumns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id}
                    {finalSortingState[0]?.id === col.id &&
                      (finalSortingState[0]?.desc ? ` ↓` : ` ↑`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Card View (mobile) or Table View (desktop) */}
        {showCards ? (
          // --- Mobile Card View ---
          hasResults ? (
            <div className="divide-y divide-border">
              {table.getRowModel().rows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    cn("animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both py-4", px),
                    onRowClick && "cursor-pointer active:bg-muted/50",
                    getRowClassName?.(row.original),
                  )}
                  style={{ animationDelay: `${rowIndex * 30}ms` }}
                >
                  {renderMobileCard(row.original, rowIndex)}
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(px, "py-8 text-center")}>
              {!hasData ? (
                emptyState || (
                  <p className="text-sm text-muted-foreground py-8">No data available.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground py-8">No results found.</p>
              )}
            </div>
          )
        ) : (
          // --- Desktop Table View ---
          <div className="overflow-x-auto">
            <Table className="min-w-2xl">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent!">
                    {headerGroup.headers.map((header, index) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          index === 0
                            ? "p-3 ps-6"
                            : index === headerGroup.headers.length - 1
                              ? "p-3 pe-6"
                              : "p-2",
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex items-center gap-1 cursor-pointer select-none hover:text-foreground",
                              !header.column.getCanSort() &&
                                "flex items-center gap-1",
                              index === headerGroup.headers.length - 1 &&
                                "justify-end",
                            )}
                            {...(header.column.getCanSort()
                              ? {
                                  role: "button" as const,
                                  tabIndex: 0,
                                  onClick: header.column.getToggleSortingHandler(),
                                  onKeyDown: (e: React.KeyboardEvent) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      header.column.getToggleSortingHandler()?.(e);
                                    }
                                  },
                                }
                              : {
                                  onClick: header.column.getToggleSortingHandler(),
                                })}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-muted-foreground">
                                {header.column.getIsSorted() === "asc" ? (
                                  <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                                ) : (
                                  <HugeiconsIcon icon={SortingIcon} size={14} className="opacity-30" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {hasResults ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <MotionTableRow
                      key={row.id}
                      variants={staggerItem}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: rowIndex * 0.04 }}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        onRowClick && "cursor-pointer",
                        getRowClassName?.(row.original),
                      )}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "whitespace-nowrap",
                            index === 0
                              ? "p-3 ps-6"
                              : index === row.getVisibleCells().length - 1
                                ? "p-3 pe-6 text-right"
                                : "p-2",
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </MotionTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 px-6 text-center text-muted-foreground">
                      {!hasData ? (
                        emptyState || "No data available."
                      ) : (
                        "No results found."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {/* Table Footer (desktop only) */}
              {hasResults && hasFooter && (
                <TableFooter>
                  {table.getFooterGroups().map((footerGroup) => (
                    <TableRow key={footerGroup.id} className="hover:bg-muted/50">
                      {footerGroup.headers.map((header, index) => (
                        <TableCell
                          key={header.id}
                          className={cn(
                            "whitespace-nowrap font-medium",
                            index === 0
                              ? "p-3 ps-6"
                              : index === footerGroup.headers.length - 1
                                ? "p-3 pe-6"
                                : "p-2",
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.footer, header.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableFooter>
              )}
            </Table>
          </div>
        )}

        {/* Mobile Footer Summary (card mode with column footers) */}
        {showCards && hasResults && hasFooter && (
          <div className={cn("border-t bg-muted/50 py-3", px)}>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {table.getFooterGroups().flatMap((footerGroup) =>
                footerGroup.headers
                  .filter(
                    (header) =>
                      !header.isPlaceholder && header.column.columnDef.footer,
                  )
                  .map((header) => (
                    <div key={header.id} className="font-medium">
                      {flexRender(header.column.columnDef.footer, header.getContext())}
                    </div>
                  )),
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && hasResults && (
          <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4 border-t", px)}>
            <p className="text-xs text-muted-foreground">
              Showing {table.getRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} results
            </p>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Page size — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows</span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-7 w-16">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    className="hidden sm:inline-flex"
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                  <Button
                    className="hidden sm:inline-flex"
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <HugeiconsIcon icon={ArrowRightDoubleIcon} size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {footer && !bare && (
        <CardFooter className="p-0 border-t bg-muted/50">{footer}</CardFooter>
      )}
      {footer && bare && (
        <div className="border-t bg-muted/50">{footer}</div>
      )}
    </Wrapper>
  );
}

export function createSortableColumn<TData>(
  accessorKey: string,
  header: string,
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    enableSorting: true,
  };
}

export function createCustomColumn<TData>(
  accessorKey: string,
  header: string,
  cell: (info: TData) => React.ReactNode,
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    cell: ({ row }) => cell(row.original),
  };
}

export default DataTable;
