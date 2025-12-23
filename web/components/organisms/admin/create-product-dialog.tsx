"use client";

import { createProductAction } from "@/actions/admin";
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
import { toSlug } from "@/lib/utils";
import {
  useAdminBrands,
  useAdminCategories,
} from "@/providers/admin-metadata-provider";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE PRODUCT DIALOG - Dialog tạo sản phẩm mới (Phức tạp)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC OPTIONS:
 * - Cho phép Admin thêm không giới hạn các tùy chọn sản phẩm (VD: Màu sắc, Kích thước).
 * - Mỗi tùy chọn có thể có nhiều giá trị (VD: Đỏ, Xanh, Lớn, Nhỏ).
 *
 * 2. METADATA PROVIDERS:
 * - Sử dụng `useAdminBrands` và `useAdminCategories` để lấy danh sách thương hiệu/danh mục mà không cần fetch lại nhiều lần.
 *
 * 3. SLUG PREVIEW:
 * - Hiển thị gợi ý slug dựa trên tên sản phẩm đang nhập để Admin dễ hình dung URL.
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
  const [isLoading, setIsLoading] = useState(false); // Manual loading state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    brandId: "",
  });

  const [options, setOptions] = useState<UiOption[]>([
    { name: t("products.optionColor"), values: [] },
    { name: t("products.optionStatus"), values: [] },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
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

    setIsLoading(true);
    startTransition(async () => {
      const result = await createProductAction(payload as any);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("products.successCreate"),
        });
        onOpenChange(false);
        // Do NOT set isLoading(false) here to avoid flicker while closing
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("products.createNew")}
      onSubmit={handleSubmit}
      isPending={isLoading}
      submitLabel={t("create")}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("products.nameLabel")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              disabled={isLoading}
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
            <Label htmlFor="slug">{t("products.slugLabel")}</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder={
                formData.name
                  ? toSlug(formData.name)
                  : t("products.slugPlaceholder")
              }
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("products.descriptionLabel")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t("products.categoryLabel")}</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => {
                setFormData({ ...formData, categoryId: value });
                if (errors.categoryId) setErrors({ ...errors, categoryId: "" });
              }}
              disabled={isLoading}
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
            <Label htmlFor="brand">{t("products.brandLabel")}</Label>
            <Select
              value={formData.brandId}
              onValueChange={(value) => {
                setFormData({ ...formData, brandId: value });
                if (errors.brandId) setErrors({ ...errors, brandId: "" });
              }}
              disabled={isLoading}
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

        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">
              {t("products.optionsLabel")}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
                  onClick={() => handleRemoveOption(optIndex)}
                  disabled={isLoading}
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
                        disabled={isLoading}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("products.valuePlaceholder")}
                    disabled={isLoading}
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
      </div>
    </FormDialog>
  );
}
