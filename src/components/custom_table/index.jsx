import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  // getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Typography from "@/components/typography";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Checkbox } from "../ui/checkbox";

function CustomTable({
  columns: rawColumns,
  data,
  isLoading,
  error,
  totalPages = 1,
  currentPage = 1,
  perPage = 10,
  onPageChange,
  emptyStateMessage = "No records available.",
  enableRowSelection = false,
  selectedRows = [],
  onRowSelectionChange,
  getRowId,
  hidePagination = false,
}) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(() => {
    const baseColumns = rawColumns.map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: () => <Typography>{col.label}</Typography>,
      cell: (info) =>
        col.render ? (
          col.render(info.getValue(), info.row.original)
        ) : (
          <Typography>{info.getValue()}</Typography>
        ),
    }));

    if (enableRowSelection) {
      return [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value);
              }}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => {
                row.toggleSelected(!!value);
              }}
              aria-label="Select row"
            />
          ),
        },
        ...baseColumns,
      ];
    }
    return baseColumns;
  }, [rawColumns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId || ((row, index) => row._id || `${index}`),
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
      rowSelection,
    },
    manualPagination: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
  });

  // Notify parent when row selection changes
  useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRowIds = Object.keys(rowSelection);
      onRowSelectionChange(selectedRowIds);
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full mb-2" />
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 text-center text-gray-500">{emptyStateMessage}</Card>
    );
  }

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && (
                      <ArrowUp size={14} />
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <ArrowDown size={14} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!hidePagination && (
        <Pagination>
          <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>

          {/* First Page */}
          {currentPage > 3 && (
            <>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(1);
                  }}
                  isActive={currentPage === 1}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {/* Page Range */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              return (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              );
            })
            .map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

          {/* Last Ellipsis */}
          {currentPage < totalPages - 2 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(totalPages);
                  }}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      )}
    </Card>
  );
}

export default CustomTable;
