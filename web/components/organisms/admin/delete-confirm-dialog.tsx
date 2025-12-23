"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * =====================================================================
 * DELETE CONFIRM DIALOG - Dialog xác nhận xóa (Dùng chung)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DESTRUCTIVE ACTION:
 * - Đây là hành động nguy hiểm (xóa dữ liệu), nên cần một bước xác nhận trung gian.
 * - Sử dụng `AlertDialog` từ Shadcn UI để ngăn người dùng vô tình click nhầm.
 *
 * 2. GENERIC ACTION:
 * - Nhận vào một `action` là một Promise. Điều này cho phép component này dùng được cho việc xóa bất kỳ thực thể nào (Product, User, Brand...).
 *
 * 3. LOADING STATE:
 * - Hiển thị spinner và vô hiệu hóa nút bấm khi đang trong quá trình xóa để tránh gửi yêu cầu trùng lặp.
 * =====================================================================
 */

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  action: () => Promise<{ success?: boolean; error?: string }>;
  successMessage?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  successMessage,
  cancelLabel,
  confirmLabel,
}: DeleteConfirmDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast({
          // @ts-ignore
          variant: "success",
          title: t("success"),
          description: successMessage || t("successDelete"),
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error || t("errorOccurred"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel || t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("processing")}
              </div>
            ) : (
              confirmLabel || t("delete")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
