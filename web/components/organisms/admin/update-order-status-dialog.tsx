"use client";

import { updateOrderStatusAction } from "@/actions/admin";
import { FormDialog } from "@/components/atoms/form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus } from "@/types/models";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * UPDATE ORDER STATUS DIALOG - Cập nhật trạng thái đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE TRANSITION LOGIC (`allowedTransitions`):
 * - Đây là phần quan trọng nhất. Đơn hàng không thể chuyển trạng thái tùy tiện (VD: Không thể chuyển từ PENDING sang DELIVERED ngay lập tức).
 * - Ta định nghĩa một "State Machine" đơn giản để giới hạn các lựa chọn hợp lệ cho Admin.
 * - Giúp tránh lỗi logic trong vận hành kho vận.
 *
 * 2. DISABLED OPTIONS:
 * - `isOptionDisabled`: Kiểm tra xem trạng thái mới có nằm trong danh sách "được phép" của trạng thái hiện tại hay không.
 * =====================================================================
 */

export function UpdateOrderStatusDialog({
  orderId,
  currentStatus,
  open,
  onOpenChange,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateOrderStatusAction(orderId, status);
    setLoading(false);

    if (result.success) {
      toast({
        title: t("success"),
        description: t("orders.successUpdateStatus"),
      });
      onOpenChange(false);
    } else {
      toast({
        title: t("error"),
        description: result.error || t("error"),
        variant: "destructive",
      });
    }
  };

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const isOptionDisabled = (optionValue: string) => {
    if (optionValue === currentStatus) return false; // Always allow keeping current status
    const allowed = allowedTransitions[currentStatus] || [];
    return !allowed.includes(optionValue);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("orders.updateStatus")}
      description={t("orders.changeStatusOf", { id: orderId.slice(0, 8) })}
      onSubmit={handleUpdate}
      isPending={loading}
      submitLabel={t("orders.updateStatus")}
    >
      <div className="py-4">
        <Select
          value={status}
          onValueChange={(val) => setStatus(val as OrderStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("orders.selectStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING" disabled={isOptionDisabled("PENDING")}>
              {t("orders.statusMapping.PENDING")}
            </SelectItem>
            <SelectItem
              value="PROCESSING"
              disabled={isOptionDisabled("PROCESSING")}
            >
              {t("orders.statusMapping.PROCESSING")}
            </SelectItem>
            <SelectItem value="SHIPPED" disabled={isOptionDisabled("SHIPPED")}>
              {t("orders.statusMapping.SHIPPED")}
            </SelectItem>
            <SelectItem
              value="DELIVERED"
              disabled={isOptionDisabled("DELIVERED")}
            >
              {t("orders.statusMapping.DELIVERED")}
            </SelectItem>
            <SelectItem
              value="CANCELLED"
              disabled={isOptionDisabled("CANCELLED")}
            >
              {t("orders.statusMapping.CANCELLED")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
