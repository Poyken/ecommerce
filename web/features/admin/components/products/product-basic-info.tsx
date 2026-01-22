
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { m } from "@/lib/animations";
import { MagicWriteButton } from "./magic-write-button";

interface ProductBasicInfoProps {
  formData: {
    name: string;
    slug: string;
    description: string;
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

export function ProductBasicInfo({
  formData,
  setFormData,
  errors,
  setErrors,
  isPending,
  categories,
  brands,
}: ProductBasicInfoProps) {
  const t = useTranslations("admin");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="edit-slug">{t("products.slugLabel")}</Label>
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="edit-description">
            {t("products.descriptionLabel")}
          </Label>
          <MagicWriteButton
            productName={formData.name}
            category={
              categories.find((c) => c.id === formData.categoryId)?.name
            }
            brand={brands.find((b) => b.id === formData.brandId)?.name}
            onApply={(result) => {
              setFormData((prev: any) => ({
                ...prev,
                description: result.description,
                metaTitle: result.metaTitle,
                metaDescription: result.metaDescription,
              }));
            }}
          />
        </div>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isPending}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
}
