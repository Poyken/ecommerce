"use client";

import { deleteReviewAction } from "@/actions/admin";
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
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * DELETE REVIEW DIALOG - Xác nhận xóa đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ALERT DIALOG (Radix UI):
 * - Sử dụng Alert Dialog thay vì Dialog thông thường cho các hành động mang tính "hủy diệt" (Destructive).
 * - Yêu cầu người dùng phải xác nhận rõ ràng trước khi thực hiện.
 *
 * 2. LOADING STATE:
 * - `disabled={loading}`: Ngăn chặn người dùng click nhiều lần trong khi đang xử lý xóa trên server.
 *
 * 3. PREVENT DEFAULT:
 * - `e.preventDefault()`: Cần thiết khi dùng `AlertDialogAction` để tránh việc đóng dialog trước khi logic xóa hoàn tất (nếu cần).
 * =====================================================================
 */

interface DeleteReviewDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteReviewDialog({
  reviewId,
  open,
  onOpenChange,
}: DeleteReviewDialogProps) {
  const t = useTranslations("reviews.delete");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteReviewAction(reviewId);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? t("deleting") : tCommon("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
