

"use client";

import { TableCell, TableRow } from "@/components/ui/table";

interface DataTableEmptyRowProps {
  colSpan: number;
  message: string;
}

export function DataTableEmptyRow({
  colSpan,
  message,
}: DataTableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center py-8 text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
