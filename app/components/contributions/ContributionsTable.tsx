'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { PreviewPaginationFooter } from '../layout/PreviewPaginationFooter';
import { SearchBar } from '../ui/search-bar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
}

export function ContributionsTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-3">

      {/* Search Bar */}
      <SearchBar
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Search Contributions..."
      />

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-md border border-white/20 bg-black/80 backdrop-blur-xl">
        <Table className="min-w-max text-sm">

          {/* HEADER */}
          <TableHeader>
            <TableRow className="bg-white/5 border-b border-white/20">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-white/80 font-medium border-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>

          {/* BODY */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer border-b border-white/10 hover:bg-white/5 transition-colors"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 text-white/90"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-white/60"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
      </div>

      {/* Pagination */}
      <PreviewPaginationFooter
        start={
          table.getState().pagination.pageIndex *
          table.getState().pagination.pageSize
        }
        end={
          (table.getState().pagination.pageIndex + 1) *
          table.getState().pagination.pageSize
        }
        total={table.getFilteredRowModel().rows.length}
        page={table.getState().pagination.pageIndex}
        totalPages={table.getPageCount()}
        setPage={(fn) =>
          table.setPageIndex(fn(table.getState().pagination.pageIndex))
        }
      />
    </div>
  );
}
