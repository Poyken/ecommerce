"use client";

import {
  createProductAction,
} from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  useAdminBrands,
  useAdminCategories,
} from "@/features/admin/providers/admin-metadata-provider";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { ProductBasicInfo } from "./product-basic-info";
import { ProductMetadata } from "./product-metadata";
import { ProductSeoInfo } from "./product-seo-info";
import { ProductOptionsManager } from "./product-options-manager";

/**
 * =====================================================================
 * CREATE PRODUCT DIALOG - Dialog tạo sản phẩm mới (Phức tạp)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT REUSE:
 * - Sử dụng chung các sub-components (`ProductBasicInfo`, `ProductMetadata`, etc.)
 *   với `EditProductDialog` để đảm bảo tính đồng nhất UI/Logic.
 *
 * 2. DYNAMIC FORM (Form động):
 * - Sản phẩm có thể có N tùy chọn (Màu, Size, Chất liệu...).
 * - Ta sử dụng `ProductOptionsManager` để quản lý việc thêm/xóa các tùy chọn này.
 * =====================================================================
 */

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UiOption {
  name: string;
  values: string[];
}

export function CreateProductDialog({
  open,
  onOpenChange,
}: CreateProductDialogProps) {
  const t = useTranslations("admin");
  const { brands } = useAdminBrands();
  const { categories } = useAdminCategories();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    brandId: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  const [options, setOptions] = useState<UiOption[]>([
    { name: t("products.optionColor"), values: [] },
    { name: t("products.optionStatus"), values: [] },
  ]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("products.errorNameRequired");
    if (!formData.categoryId)
      newErrors.categoryId = t("products.errorCategoryRequired");
    if (!formData.brandId) newErrors.brandId = t("products.errorBrandRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Lọc bỏ các tùy chọn trống
    const validOptions = options.filter(
      (opt) => opt.name.trim() !== "" && opt.values.length > 0
    );

    const { categoryId, ...restFormData } = formData;
    const payload = {
      ...restFormData,
      categoryIds: [categoryId],
      options: validOptions,
    };

    startTransition(async () => {
      const result = await createProductAction(payload as any);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("products.successCreate"),
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("products.createNew")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      maxWidth="max-w-2xl"
      disabled={
        !formData.name.trim() || !formData.categoryId || !formData.brandId
      }
    >
      <ProductBasicInfo 
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        isPending={isPending}
        categories={categories}
        brands={brands}
      />

      <div className="mt-4">
        <ProductMetadata 
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          isPending={isPending}
          categories={categories}
          brands={brands}
        />
      </div>

      <ProductSeoInfo 
        formData={formData}
        setFormData={setFormData}
        isPending={isPending}
      />

      <ProductOptionsManager 
        options={options}
        setOptions={setOptions}
        isPending={isPending}
      />
    </FormDialog>
  );
}
