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
import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * =====================================================================
 * DELETE CONFIRM DIALOG - Dialog xác nhận xóa (Enhanced)
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
 *
 * 4. ENHANCED UI:
 * - Icon warning để làm rõ đây là hành động nguy hiểm
 * - Better styling cho buttons
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
      try {
        const result = await action();
        if (result?.success) {
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
            description: result?.error || t("errorOccurred"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Delete action failed:", error);
        toast({
          title: t("error"),
          description:
            error instanceof Error ? error.message : t("errorOccurred"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {/* Warning Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-wrap text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isPending} className="w-full sm:w-auto">
            {cancelLabel || t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("processing")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                {confirmLabel || t("delete")}
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
