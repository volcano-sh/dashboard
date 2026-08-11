"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { useTranslations } from "next-intl";
} from "@tanstack/react-table"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
<<<<<<< HEAD
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  disablePagination?: boolean;
  filterPlaceholder?: string;
=======
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  disablePagination?: boolean
  storageKey?: string
  searchPlaceholder?: string
}

interface SavedViewState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
>>>>>>> 2994a7a (dashboard: add saved views support)
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  disablePagination = false,
<<<<<<< HEAD
  filterPlaceholder,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("common");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
=======
  storageKey,
  searchPlaceholder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [savedViews, setSavedViews] = useState<string[]>([])
  const [activeViewName, setActiveViewName] = useState<string | null>(null)

  const savedViewsStorageKey = storageKey
    ? `data-table-saved-views:${storageKey}`
    : null
  const activeViewStorageKey = storageKey
    ? `data-table-active-view:${storageKey}`
    : null

  const getViewStorageKey = (viewName: string) =>
    storageKey ? `data-table-view:${storageKey}:${viewName}` : null

  const loadView = (viewName: string) => {
    if (!storageKey) return

    const viewKey = getViewStorageKey(viewName)
    if (!viewKey) return

    const stored = localStorage.getItem(viewKey)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as SavedViewState
      setSorting(parsed.sorting ?? [])
      setColumnFilters(parsed.columnFilters ?? [])
      setColumnVisibility(parsed.columnVisibility ?? {})
      setActiveViewName(viewName)
      localStorage.setItem(activeViewStorageKey!, viewName)
    } catch {
      // ignore invalid saved view state
    }
  }

  const saveCurrentView = () => {
    if (!storageKey) return

    const name = window.prompt(
      "Save current dashboard view as:",
      activeViewName ?? ""
    )
    if (!name) return

    const trimmedName = name.trim()
    if (!trimmedName) return

    const viewKey = getViewStorageKey(trimmedName)
    if (!viewKey) return

    const payload: SavedViewState = {
      sorting,
      columnFilters,
      columnVisibility,
    }

    localStorage.setItem(viewKey, JSON.stringify(payload))

    const nextViews = savedViews.includes(trimmedName)
      ? savedViews
      : [...savedViews, trimmedName]

    setSavedViews(nextViews)
    localStorage.setItem(savedViewsStorageKey!, JSON.stringify(nextViews))
    setActiveViewName(trimmedName)
    localStorage.setItem(activeViewStorageKey!, trimmedName)
  }

  const deleteActiveView = () => {
    if (!storageKey || !activeViewName) return

    const viewKey = getViewStorageKey(activeViewName)
    if (viewKey) {
      localStorage.removeItem(viewKey)
    }
    const nextViews = savedViews.filter((view) => view !== activeViewName)
    setSavedViews(nextViews)
    localStorage.setItem(savedViewsStorageKey!, JSON.stringify(nextViews))
    setActiveViewName(null)
    localStorage.removeItem(activeViewStorageKey!)
  }

  const resetView = () => {
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setActiveViewName(null)
    if (activeViewStorageKey) {
      localStorage.removeItem(activeViewStorageKey)
    }
  }

  useEffect(() => {
    if (!storageKey) return

    const storedViews = localStorage.getItem(savedViewsStorageKey!)
    if (storedViews) {
      try {
        const parsedViews = JSON.parse(storedViews)
        if (Array.isArray(parsedViews)) {
          setSavedViews(parsedViews)
        }
      } catch {
        localStorage.removeItem(savedViewsStorageKey!)
        setSavedViews([])
      }
    }

    const activeView = localStorage.getItem(activeViewStorageKey!)
    if (activeView) {
      setActiveViewName(activeView)
      const viewKey = getViewStorageKey(activeView)
      if (viewKey) {
        const stored = localStorage.getItem(viewKey)
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as SavedViewState
            setSorting(parsed.sorting ?? [])
            setColumnFilters(parsed.columnFilters ?? [])
            setColumnVisibility(parsed.columnVisibility ?? {})
          } catch {
            localStorage.removeItem(activeViewStorageKey!)
            setActiveViewName(null)
          }
        }
      }
    }
  }, [savedViewsStorageKey, activeViewStorageKey, storageKey])
>>>>>>> 2994a7a (dashboard: add saved views support)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
        <Input
<<<<<<< HEAD
          placeholder={filterPlaceholder ?? t("noResults")}
=======
          placeholder={searchPlaceholder ?? "Filter rows..."}
>>>>>>> 2994a7a (dashboard: add saved views support)
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
<<<<<<< HEAD
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ms-auto">
              {t("actions.columns")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
=======
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {storageKey && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Views{activeViewName ? `: ${activeViewName}` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={saveCurrentView}>
                  Save current view
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {savedViews.length > 0 ? (
                  savedViews.map((view) => (
                    <DropdownMenuItem
                      key={view}
                      onSelect={() => loadView(view)}
                    >
                      {view}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No saved views
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!activeViewName}
                  onSelect={deleteActiveView}
                >
                  Delete active view
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={resetView}>
                  Reset view
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
>>>>>>> 2994a7a (dashboard: add saved views support)
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!disablePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {t("rowsSelected", {
              selected: table.getFilteredSelectedRowModel().rows.length,
              total: table.getFilteredRowModel().rows.length,
            })}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("actions.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("actions.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
