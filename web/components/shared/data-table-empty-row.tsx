/**
 * =====================================================================
 * DATA TABLE EMPTY ROW - Dòng trống khi bảng không có dữ liệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này hiển thị một dòng thông báo duy nhất khi bảng dữ liệu trống,
 * giúp người dùng biết rằng không có kết quả nào được tìm thấy.
 * =====================================================================
 */

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
