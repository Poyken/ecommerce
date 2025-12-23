/**
 * =====================================================================
 * FORM DIALOG - Hộp thoại chứa Form
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSABLE FORM MODAL:
 * - Kết hợp `Dialog` và thẻ `form` để tạo ra một hộp thoại nhập liệu nhanh.
 * - Thường dùng cho các tác vụ Thêm/Sửa nhanh trong trang Admin.
 *
 * 2. PENDING STATE:
 * - Hỗ trợ prop `isPending` để vô hiệu hóa các nút bấm khi đang gửi dữ liệu (Submitting),
 *   ngăn chặn việc user nhấn gửi nhiều lần gây trùng lặp dữ liệu.
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: string; // e.g. "sm:max-w-md" or "sm:max-w-2xl"
  disabled?: boolean;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isPending = false,
  submitLabel,
  cancelLabel,
  maxWidth = "sm:max-w-md",
  disabled = false,
}: FormDialogProps) {
  const t = useTranslations("admin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {/* Form Content */}
          <div className="py-2">{children}</div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {cancelLabel || t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={disabled || isPending}
            >
              {submitLabel || t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
