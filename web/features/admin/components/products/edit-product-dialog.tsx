"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  updateProductAction,
} from "@/features/admin/actions";
import {
  useAdminBrands,
  useAdminCategories,
} from "@/features/admin/providers/admin-metadata-provider";
import { OptionValue, Product, ProductOption } from "@/types/models";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { ProductBasicInfo } from "./product-basic-info";
import { ProductMetadata } from "./product-metadata";
import { ProductSeoInfo } from "./product-seo-info";
import { ProductOptionsManager } from "./product-options-manager";



interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UiOption {
  name: string;
  values: string[];
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
}: EditProductDialogProps) {
  const { brands } = useAdminBrands();
  const { categories } = useAdminCategories();
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    categoryId: product.categoryId,
    brandId: product.brandId,
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    metaKeywords: product.metaKeywords || "",
  });

  // Init options from product props
  const [options, setOptions] = useState<UiOption[]>(() => {
    if (product.options && Array.isArray(product.options)) {
      return product.options.map((opt: ProductOption) => ({
        name: opt.name,
        values: opt.values ? opt.values.map((v: OptionValue) => v.value) : [],
      }));
    }
    return [];
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("products.errorNameRequired");
    if (!formData.categoryId)
      newErrors.categoryId = t("products.errorCategoryRequired");
    if (!formData.brandId) newErrors.brandId = t("products.errorBrandRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    const isFormDirty =
      formData.name !== product.name ||
      formData.slug !== product.slug ||
      formData.description !== (product.description || "") ||
      formData.categoryId !== product.categoryId ||
      formData.brandId !== product.brandId ||
      formData.metaTitle !== (product.metaTitle || "") ||
      formData.metaDescription !== (product.metaDescription || "") ||
      formData.metaKeywords !== (product.metaKeywords || "");

    if (isFormDirty) return true;

    const originalOptions: UiOption[] =
      product.options?.map((o: ProductOption) => ({
        name: o.name,
        values: o.values?.map((v: OptionValue) => v.value) || [],
      })) || [];

    return JSON.stringify(options) !== JSON.stringify(originalOptions);
  }, [formData, options, product]);

  const onSubmit = (e: React.FormEvent) => {
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
      const result = await updateProductAction(product.id, payload as any);

      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("products.successUpdate"),
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
          className: "premium-toast-error"
        });
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("products.edit")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="max-w-2xl"
      disabled={!isDirty}
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
