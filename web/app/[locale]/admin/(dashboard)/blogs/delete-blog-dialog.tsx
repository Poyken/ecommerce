"use client";

import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteBlogAction } from "@/features/blog/actions";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * =====================================================================
 * DELETE BLOG DIALOG - Modal xác nhận xóa bài viết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USE TRANSITION HOOK:
 * - Khi gọi `deleteBlogAction` (Server Action), ta bọc trong `startTransition`.
 * - Tác dụng: Giữ cho UI phản hồi (không bị freeze) trong khi đang chờ Server xử lý.
 * - `isPending` sẽ tự động true/false để hiển thị loading spinner.
 * =====================================================================
 */

interface DeleteBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blogId: string;
  blogTitle: string;
}

export function DeleteBlogDialog({
  open,
  onOpenChange,
  blogId,
  blogTitle,
}: DeleteBlogDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useTranslations("admin.blogs");

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteBlogAction(blogId);

      if (result.success) {
        toast({
          title: t("deleted"),
          description: t("deleteSuccess"),
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error || t("deleteError"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirm", { title: blogTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
