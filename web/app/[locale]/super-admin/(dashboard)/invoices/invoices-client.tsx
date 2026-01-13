// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// INVOICES CLIENT COMPONENT - GIAO DIỆN QUẢN LÝ HÓA ĐƠN
// =================================================================================================
//
// Component này xử lý các tương tác người dùng liên quan đến danh sách hóa đơn.
// Vì cần dùng `useState` (quản lý state local) và `onClick` (event handler), file này phải là "use client".
//
// CÁC TÍNH NĂNG CHÍNH:
// 1. Hiển thị danh sách: Render bảng hóa đơn với các thông tin: Tenant, Số tiền, Trạng thái.
// 2. Cập nhật trạng thái (Manual Action):
//    - Cho phép Super Admin đánh dấu hóa đơn là "Đã thanh toán" (ví dụ: khi nhận chuyển khoản ngân hàng).
//    - Hủy hóa đơn nếu có sai sót.
// 3. Optimistic UI (cơ bản):
//    - Khi API trả về thành công, state local được cập nhật ngay lập tức (`setInvoices`)
//    - `router.refresh()` giúp đồng bộ lại dữ liệu mới nhất từ server mà không reload trọn trang.
//
// HELPER FUNCTIONS:
// - `getStatusBadge`: Render badge màu sắc trực quan (Xanh = Paid, Vàng = Pending, Đỏ = Overdue).
// - `formatCurrency`: Utility để hiển thị tiền tệ chuẩn format quốc tế.
// =================================================================================================
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateInvoiceStatusAction } from "@/features/super-admin/domain-actions/invoices-actions";
import { MoreHorizontal, Ban, CheckCircle, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Invoice {
  id: string;
  tenant: {
    name: string;
    domain: string;
  };
  amount: string;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";
  createdAt: string;
  dueDate: string;
  description?: string;
}

interface InvoicesClientProps {
  initialData: {
    data: Invoice[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function InvoicesClient({ initialData }: InvoicesClientProps) {
  const t = useTranslations("superAdmin.invoices");
  const [invoices, setInvoices] = useState(initialData.data);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await updateInvoiceStatusAction({ id, status });
    if (res?.data) {
      toast({ variant: "success", title: t("actions.successUpdate") });
      setInvoices(
        invoices.map((inv) =>
          inv.id === id ? { ...inv, status: status as any } : inv
        )
      );
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: res?.serverError || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-300 bg-yellow-50"
          >
            Pending
          </Badge>
        );
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "VOID":
        return <Badge variant="secondary">Void</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.id")}</TableHead>
            <TableHead>{t("table.tenant")}</TableHead>
            <TableHead>{t("table.amount")}</TableHead>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center h-24 text-muted-foreground"
              >
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono text-xs">
                  {invoice.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.tenant.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.tenant.domain}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(
                    Number(invoice.amount),
                    "en-US",
                    invoice.currency
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {t("actions.manage")}
                      </DropdownMenuLabel>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />{" "}
                        {t("actions.view")}
                      </DropdownMenuItem>
                      {invoice.status !== "PAID" && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(invoice.id, "PAID")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />{" "}
                          {t("actions.markPaid")}
                        </DropdownMenuItem>
                      )}
                      {invoice.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateStatus(invoice.id, "CANCELLED")
                          }
                        >
                          <Ban className="mr-2 h-4 w-4 text-red-500" />{" "}
                          {t("actions.cancel")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
