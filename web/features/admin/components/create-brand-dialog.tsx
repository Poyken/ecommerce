"use client";

import { createBrandAction } from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/shared/use-toast";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE BRAND DIALOG - Dialog tạo thương hiệu mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM HANDLING:
 * - Sử dụng `useState` để quản lý tên thương hiệu và file ảnh logo.
 * - `useTransition` (`isPending`) giúp quản lý trạng thái loading khi gọi Server Action.
 *
 * 2. IMAGE UPLOAD:
 * - Tích hợp component `ImageUpload` để xử lý việc chọn và xem trước logo.
 *
 * 3. VALIDATION:
 * - Kiểm tra tên thương hiệu không được để trống trước khi gửi.
 * =====================================================================
 */

/**
 * =====================================================================
 * CREATE CATEGORY DIALOG - Dialog tạo danh mục sản phẩm mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUTO-SLUG GENERATION:
 * - Khi nhập tên danh mục, hệ thống tự động tạo `slug` (URL-friendly) tương ứng.
 * - Giúp Admin tiết kiệm thời gian và đảm bảo URL chuẩn SEO.
 *
 * 2. HIERARCHICAL STRUCTURE:
 * - Cho phép chọn `parentId` để tạo danh mục con (Sub-category).
 * - Danh sách `categories` được truyền vào từ component cha.
 *
 * 3. MULTIPART FORM DATA:
 * - Vì có upload ảnh, dữ liệu được đóng gói vào `FormData` trước khi gửi qua Server Action.
 * =====================================================================
 */

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBrandDialog({
  open,
  onOpenChange,
}: CreateBrandDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("brands.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Gọi server action
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (image) formData.append("image", image);

      const result = await createBrandAction(formData);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("brands.successCreate"),
        });
        // Reset form
        setName("");
        setImage(null);
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
      title={t("brands.createNew")}
      description={t("brands.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      disabled={!name.trim()}
      icon={<Award className="h-5 w-5" />}
      variant="create"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("brands.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("brands.placeholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.name && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.name}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label>{t("brands.logoLabel")}</Label>
          <ImageUpload
            onChange={setImage}
            onRemove={() => setImage(null)}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
