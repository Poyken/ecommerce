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
  icon?: React.ReactNode; // Optional icon
  className?: string;
}

const statusMap: Record<string, StatusVariant> = {
  // Order Statuses
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "purple", // Delivery related -> Violet/Purple
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "error",
  RETURNED: "secondary",

  // Payment Statuses
  UNPAID: "secondary",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "info", // Refund -> Blue/Info

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
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5",
  warning:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/5",
  error:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/5",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/5",
  secondary:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  purple:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 shadow-sm shadow-violet-500/5",
};

export function StatusBadge({
  status,
  label,
  variant,
  icon,
  className,
  ...props
}: StatusBadgeProps) {
  // Determine variant from status if not explicitly provided
  const resolvedVariant =
    variant || statusMap[status.toUpperCase()] || "default";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      {label || status}
    </span>
  );
}
