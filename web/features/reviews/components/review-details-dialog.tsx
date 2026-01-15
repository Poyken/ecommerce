"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { Product, Review, Sku, User } from "@/types/models";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * REVIEW DETAILS DIALOG - Xem chi tiết đánh giá (Dành cho Admin)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPREHENSIVE VIEW:
 * - Hiển thị đầy đủ thông tin: Người đánh giá (Email), Ngày giờ, Sản phẩm/SKU cụ thể.
 * - Giúp Admin kiểm soát nội dung đánh giá của khách hàng.
 *
 * 2. EXTERNAL LINKING:
 * - Cung cấp nút "View Product" để Admin có thể xem nhanh sản phẩm đang bị phản ánh.
 *
 * 3. WHITESPACE PRESERVATION:
 * - `whitespace-pre-wrap`: Giúp hiển thị đúng các dấu xuống dòng mà user đã nhập trong nội dung đánh giá. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface ReviewDetailsDialogProps {
  review: Review & {
    user?: User;
    sku?: Sku;
    product?: Product;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDetailsDialog({
  review,
  open,
  onOpenChange,
}: ReviewDetailsDialogProps) {
  const t = useTranslations("reviews.details");
  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("user")}:
            </span>
            <div className="flex flex-col">
              <span className="font-medium">
                {review.user?.firstName} {review.user?.lastName}
              </span>
              <span className="text-muted-foreground">
                {review.user?.email}
              </span>
            </div>

            <span className="font-medium text-muted-foreground">
              {t("date")}:
            </span>
            <span>{new Date(review.createdAt).toLocaleString()}</span>
          </div>

          {/* Product Info */}
          <div className="p-4 rounded-lg bg-muted/30 border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{t("productInfo")}</h4>
              <Link
                href={`/products/${review.product?.id}${
                  review.sku?.id ? `?skuId=${review.sku.id}` : ""
                }`}
                target="_blank"
              >
                <Button variant="link" size="sm" className="h-auto p-0">
                  {t("viewProduct")}
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">{t("product")}:</span>
              <span className="font-medium">{review.product?.name}</span>

              {review.sku?.skuCode && (
                <>
                  <span className="text-muted-foreground">{t("sku")}:</span>
                  <span className="font-mono text-xs">
                    {review.sku.skuCode}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Rating & Content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{t("rating")}:</span>
              <div className="flex items-center bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">
                <span className="font-bold text-yellow-600 mr-1">
                  {review.rating}
                </span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-medium">{t("content")}:</span>
              <div className="p-4 rounded-lg bg-muted/50 border min-h-[100px] whitespace-pre-wrap">
                {review.content || (
                  <span className="text-muted-foreground italic">
                    {t("noContent")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>{t("close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
