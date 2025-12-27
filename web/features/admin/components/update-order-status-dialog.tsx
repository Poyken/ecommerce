"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction } from "@/features/admin/actions";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types/models";
import { Check } from "lucide-react";
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
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "CANCELLED" && !cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await updateOrderStatusAction(
      orderId,
      status,
      notify,
      cancellationReason
    );
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

  const isUnchanged = status === currentStatus;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("orders.updateStatus")}
      description={t("orders.changeStatusOf", { id: orderId.slice(0, 8) })}
      onSubmit={handleUpdate}
      isPending={loading}
      disabled={loading || isUnchanged}
      submitLabel={t("orders.updateStatus")}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("orders.statusLabel")}
          </label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as OrderStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("orders.selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="PENDING"
                disabled={isOptionDisabled("PENDING")}
              >
                {t("orders.statusMapping.PENDING")}
              </SelectItem>
              <SelectItem
                value="PROCESSING"
                disabled={isOptionDisabled("PROCESSING")}
              >
                {t("orders.statusMapping.PROCESSING")}
              </SelectItem>
              <SelectItem
                value="SHIPPED"
                disabled={isOptionDisabled("SHIPPED")}
              >
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

        {status === "CANCELLED" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-sm font-medium text-red-500">
              Cancellation Reason (Required)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Why is this order being cancelled?"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              required
            />
          </div>
        )}

        {/* Custom Styled Checkbox "Send to user" */}
        <div
          onClick={() => setNotify(!notify)}
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group select-none",
            notify
              ? "border-primary/30 bg-primary/5"
              : "border-muted hover:border-muted-foreground/30 bg-muted/20"
          )}
        >
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground cursor-pointer block">
              {t("notifications.sendToUser")}
            </label>
            <p className="text-xs text-muted-foreground pr-4 font-medium leading-relaxed">
              Notify customer about this status change via email/notification.
            </p>
          </div>
          <div
            className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
              notify
                ? "bg-primary border-primary text-primary-foreground shadow-sm scale-110"
                : "border-muted-foreground/30 group-hover:border-primary/50"
            )}
          >
            {notify && <Check size={14} strokeWidth={3} />}
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
