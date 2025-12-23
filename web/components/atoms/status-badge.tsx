"use client";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * STATUS BADGE - Thẻ hiển thị trạng thái chuẩn hóa
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATUS MAPPING:
 * - Sử dụng `statusMap` để tự động ánh xạ các trạng thái từ API (VD: "PENDING", "DELIVERED") sang các biến thể màu sắc (warning, success).
 * - Giúp giao diện đồng nhất: Mọi nơi hiển thị "Đã giao hàng" đều sẽ có màu xanh lá.
 *
 * 2. FLEXIBILITY:
 * - Hỗ trợ cả `label` (nếu muốn hiển thị text tùy chỉnh) hoặc mặc định dùng chính `status`.
 * - Có thể override `variant` nếu cần thiết cho các trường hợp đặc biệt.
 * =====================================================================
 */

type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "secondary"
  | "purple";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string; // The raw status string (e.g., "PENDING")
  label?: string; // The localized label to display
  variant?: StatusVariant; // Optional override
  className?: string;
}

const statusMap: Record<string, StatusVariant> = {
  // Order Statuses
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "purple",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "error",
  REFUNDED: "secondary",

  // Stock/Product Statuses
  ACTIVE: "success",
  INACTIVE: "secondary",
  OUT_OF_STOCK: "error",
  LOW_STOCK: "warning",
  DRAFT: "secondary",
  PUBLISHED: "success",
  HIDDEN: "secondary",
  REJECTED: "error",
};

const variantStyles: Record<StatusVariant, string> = {
  default:
    "bg-foreground/5 text-foreground/60 dark:bg-foreground/10 dark:text-foreground/80 border-foreground/10",
  success:
    "bg-success/10 text-success border-success/30 shadow-sm shadow-success/10",
  warning:
    "bg-warning/10 text-warning border-warning/30 shadow-sm shadow-warning/10",
  error:
    "bg-destructive/10 text-destructive border-destructive/30 shadow-sm shadow-destructive/10",
  info: "bg-info/10 text-info border-info/30 shadow-sm shadow-info/10",
  secondary: "bg-muted text-muted-foreground border-border",
  purple:
    "bg-accent/10 text-accent border-accent/30 shadow-sm shadow-accent/10",
};

export function StatusBadge({
  status,
  label,
  variant,
  className,
  ...props
}: StatusBadgeProps) {
  // Determine variant from status if not explicitly provided
  const resolvedVariant =
    variant || statusMap[status.toUpperCase()] || "default";

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      {label || status}
    </span>
  );
}
