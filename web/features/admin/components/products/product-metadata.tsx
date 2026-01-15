/**
 * =====================================================================
 * PRODUCT METADATA - Chọn Danh mục & Thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PROPS DRILLING:
 * - Component này nhận `formData` và `setFormData` từ component cha (`ProductForm`).
 * - Giúp tách nhỏ form khổng lồ thành các phần nhỏ dễ quản lý (Separation of Concerns).
 *
 * 2. DATA SOURCE:
 * - List `categories` và `brands` được fetch từ Server Component cha và truyền xuống,
 *   tránh việc component con phải tự fetch lại gây chậm (Waterfall requests). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */ 
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { m } from "@/lib/animations";

interface ProductMetadataProps {
  formData: {
    categoryId: string;
    brandId: string;
  };
  setFormData: (data: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: any) => void;
  isPending: boolean;
  categories: any[];
  brands: any[];
}

export function ProductMetadata({
  formData,
  setFormData,
  errors,
  setErrors,
  isPending,
  categories,
  brands,
}: ProductMetadataProps) {
  const t = useTranslations("admin");

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="edit-category">{t("products.categoryLabel")}</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => {
            setFormData({ ...formData, categoryId: value });
            if (errors.categoryId) setErrors({ ...errors, categoryId: "" });
          }}
          disabled={isPending}
        >
          <SelectTrigger
            className={errors.categoryId ? "border-destructive" : ""}
          >
            <SelectValue placeholder={t("products.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AnimatePresence>
          {errors.categoryId && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
            >
              {errors.categoryId}
            </m.p>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-brand">{t("products.brandLabel")}</Label>
        <Select
          value={formData.brandId}
          onValueChange={(value) => {
            setFormData({ ...formData, brandId: value });
            if (errors.brandId) setErrors({ ...errors, brandId: "" });
          }}
          disabled={isPending}
        >
          <SelectTrigger
            className={errors.brandId ? "border-destructive" : ""}
          >
            <SelectValue placeholder={t("products.selectBrand")} />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AnimatePresence>
          {errors.brandId && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
            >
              {errors.brandId}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
