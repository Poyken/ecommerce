"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCategoryAction } from "@/features/admin/actions";
import { m } from "@/lib/animations";
import { Category } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { FolderTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

interface CreateCategoryDialogProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({
  categories,
  open,
  onOpenChange,
}: CreateCategoryDialogProps) {
/**
 * =====================================================================
 * CREATE CATEGORY DIALOG - Modal tạo danh mục mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUTO-GENERATED SLUG:
 * - Khi nhập Tên (Name), Slug sẽ tự động được tạo realtime (Title -> title).
 * - UX Pattern thông dụng trong các CMS.
 *
 * 2. USE TRANSITON:
 * - `useTransition` giúp UI không bị freeze khi đang submit form lên Server Action.
 * - Hiển thị trạng thái Loading (isPending) mượt mà.
 * =====================================================================
 */
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
    // Tự động tạo slug từ tên
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(generatedSlug);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("categories.errorNameRequired");
    }
    if (!slug.trim()) {
      newErrors.slug = t("categories.errorNameRequired");
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
      formData.append("slug", slug.trim());
      if (parentId && parentId !== "none") {
        formData.append("parentId", parentId);
      }
      if (image) formData.append("image", image);

      const result = await createCategoryAction(formData as any);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("categories.successCreate"),
        });
        // Reset form
        setName("");
        setSlug("");
        setParentId("");
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
      title={t("categories.createNew")}
      description={t("categories.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      disabled={!name.trim() || !slug.trim()}
      icon={<FolderTree className="h-5 w-5" />}
      variant="create"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("categories.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("categories.placeholder")}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
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
          <Label htmlFor="slug">{t("categories.slugLabel")}</Label>
          <Input
            id="slug"
            placeholder={t("categories.slugPlaceholder")}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
            }}
            disabled={isPending}
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
          <p className="text-sm text-gray-500">{t("categories.slugHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">{t("categories.parentLabel")}</Label>
          <Select
            value={parentId}
            onValueChange={setParentId}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("categories.selectParent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("categories.noneRoot")}</SelectItem>
              {categories.map((cat) => (
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
            onChange={setImage}
            onRemove={() => setImage(null)}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
