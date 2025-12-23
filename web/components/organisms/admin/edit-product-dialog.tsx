"use client";

import { updateProductAction } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { FormDialog } from "@/components/atoms/form-dialog";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminBrands,
  useAdminCategories,
} from "@/providers/admin-metadata-provider";
import { OptionValue, Product, ProductOption } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT PRODUCT DIALOG - Dialog chỉnh sửa thông tin sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OPTION SYNCHRONIZATION:
 * - Phức tạp nhất là việc đồng bộ các tùy chọn (Options) và giá trị của chúng từ database lên form.
 * - Sử dụng `useMemo` để chuyển đổi cấu trúc dữ liệu từ model sang cấu trúc UI.
 *
 * 2. DEEP DIRTY CHECK:
 * - Kiểm tra thay đổi sâu (`JSON.stringify`) cho mảng `options` để biết khi nào cần cho phép lưu.
 * =====================================================================
 */

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

  // Update state when product prop changes
  useMemo(() => {
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      categoryId: product.categoryId,
      brandId: product.brandId,
    });
    if (product.options && Array.isArray(product.options)) {
      setOptions(
        product.options.map((opt: ProductOption) => ({
          name: opt.name,
          values: opt.values ? opt.values.map((v: OptionValue) => v.value) : [],
        }))
      );
    } else {
      setOptions([]);
    }
  }, [product]);

  const handleAddOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionNameChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].name = value;
    setOptions(newOptions);
  };

  const handleAddValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;
    const newOptions = [...options];
    newOptions[optionIndex].values.push(value);
    setOptions(newOptions);
  };

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.splice(valueIndex, 1);
    setOptions(newOptions);
  };

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
      formData.brandId !== product.brandId;

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

    const payload = {
      ...formData,
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
    >
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">{t("products.nameLabel")}</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-slug">{t("products.slugLabel")}</Label>
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <Label htmlFor="edit-description">
          {t("products.descriptionLabel")}
        </Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
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
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.categoryId}
              </motion.p>
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
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.brandId}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">
            {t("products.optionsLabel")}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={isPending}
          >
            {t("products.addOption")}
          </Button>
        </div>

        {options.map((option, optIndex) => (
          <div
            key={optIndex}
            className="p-4 border rounded-md space-y-3 bg-gray-50"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label>{t("products.optionNameLabel")}</Label>
                <Input
                  value={option.name}
                  onChange={(e) =>
                    handleOptionNameChange(optIndex, e.target.value)
                  }
                  placeholder={t("products.optionPlaceholder")}
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
                onClick={() => handleRemoveOption(optIndex)}
                disabled={isPending}
              >
                {t("remove")}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t("products.valuesLabel")}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {option.values.map((val, valIndex) => (
                  <div
                    key={valIndex}
                    className="bg-white border px-2 py-1 rounded text-sm flex items-center gap-2"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(optIndex, valIndex)}
                      className="text-gray-400 hover:text-red-500"
                      disabled={isPending}
                    >
                      {t("remove")}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("products.valuePlaceholder")}
                  disabled={isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddValue(optIndex, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
