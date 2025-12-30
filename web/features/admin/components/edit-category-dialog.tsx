"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/components/shared/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateCategoryAction } from "@/features/admin/actions";
import { Category } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT CATEGORY DIALOG - Dialog chỉnh sửa danh mục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SELF-PARENT PREVENTION:
 * - Khi chọn danh mục cha, hệ thống lọc bỏ chính danh mục đang sửa khỏi danh sách để tránh lỗi vòng lặp (danh mục là cha của chính nó).
 *
 * 2. SLUG EDITING:
 * - Khác với lúc tạo mới, khi sửa ta cho phép Admin can thiệp trực tiếp vào slug nếu cần thiết cho SEO.
 * =====================================================================
 */

interface EditCategoryDialogProps {
  categories: Category[];
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({
  categories,
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [parentId, setParentId] = useState<string>(category.parentId || "none");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // No useEffect needed here for prop syncing as the parent uses a 'key' prop to reset this component when the category changes.
  // This avoids react-hooks/set-state-in-effect linting errors.

  // Cleanup image preview URL when unmount or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("categories.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    return (
      name !== category.name ||
      slug !== category.slug ||
      parentId !== (category.parentId || "none") ||
      image !== null ||
      isImageRemoved
    );
  }, [
    name,
    category.name,
    slug,
    category.slug,
    parentId,
    category.parentId,
    image,
    isImageRemoved,
  ]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      if (parentId !== "none") {
        formData.append("parentId", parentId);
      }

      if (image) {
        formData.append("image", image);
      } else if (isImageRemoved) {
        formData.append("deleteImage", "true");
      }

      const result = await updateCategoryAction(category.id, formData as any);

      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("categories.successUpdate"),
        });
        onOpenChange(false);
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
      title={t("categories.edit")}
      description={t("categories.editDescription")}
      onSubmit={onSubmit}
      isPending={isLoading}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
      disabled={!name.trim() || !slug.trim() || !isDirty}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("categories.nameLabel")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            disabled={isLoading}
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
          <Label htmlFor="slug">{t("categories.slugLabel")}</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
            }}
            disabled={isLoading}
            className={errors.slug ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.slug && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.slug}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">{t("categories.parentLabel")}</Label>
          <Select
            value={parentId}
            onValueChange={setParentId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("categories.selectParent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("categories.noneRoot")}</SelectItem>
              {categories
                .filter((cat) => cat.id !== category.id)
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("categories.imageLabel")}</Label>
          <ImageUpload
            value={
              imagePreview ||
              (isImageRemoved ? undefined : category.imageUrl) ||
              undefined
            }
            onChange={(file) => {
              if (file) {
                setImage(file);
                const url = URL.createObjectURL(file);
                setImagePreview(url);
                setIsImageRemoved(false);
              }
            }}
            onRemove={() => {
              setImage(null);
              if (imagePreview) URL.revokeObjectURL(imagePreview);
              setImagePreview(null);
              setIsImageRemoved(true);
            }}
            disabled={isLoading}
          />
        </div>
      </div>
    </FormDialog>
  );
}
