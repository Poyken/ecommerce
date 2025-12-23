"use client";

import { updateSkuAction } from "@/actions/admin";
import { FormDialog } from "@/components/atoms/form-dialog";
import { ImageUpload } from "@/components/atoms/image-upload";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useToast } from "@/hooks/use-toast";
import { Sku } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT SKU DIALOG - Dialog chỉnh sửa biến thể sản phẩm (SKU)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. READ-ONLY SKU CODE:
 * - `skuCode` là mã định danh duy nhất, không được phép sửa sau khi đã tạo để đảm bảo tính toàn vẹn dữ liệu kho.
 *
 * 2. PRICE & STOCK MANAGEMENT:
 * - Đây là nơi Admin cập nhật giá bán và số lượng tồn kho thực tế cho từng biến thể.
 *
 * 3. SKU-SPECIFIC IMAGE:
 * - Mỗi SKU có thể có ảnh riêng (VD: Áo màu Đỏ thì hiện ảnh áo Đỏ).
 * =====================================================================
 */

interface EditSkuDialogProps {
  sku: Sku;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSkuDialog({ sku, open, onOpenChange }: EditSkuDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    skuCode: sku.skuCode,
    price: sku.price,
    stock: sku.stock,
    imageUrl: sku.imageUrl,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useMemo(() => {
    setFormData({
      skuCode: sku.skuCode,
      price: sku.price,
      stock: sku.stock,
      imageUrl: sku.imageUrl,
    });
    setImageFile(null);
  }, [sku]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.price || Number(formData.price) <= 0)
      newErrors.price = t("skus.errorPriceRequired");
    if (
      formData.stock === undefined ||
      formData.stock === null ||
      Number(formData.stock) < 0
    )
      newErrors.stock = t("skus.errorStockRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    return (
      formData.price !== sku.price ||
      formData.stock !== sku.stock ||
      imageFile !== null ||
      (formData.imageUrl !== sku.imageUrl && !imageFile)
    );
  }, [formData, sku, imageFile]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      let data: FormData | { price: number; stock: number; imageUrl?: string };

      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("price", formData.price?.toString() || "0");
        formDataToSend.append("stock", formData.stock?.toString() || "0");
        formDataToSend.append("image", imageFile);
        data = formDataToSend;
      } else {
        data = {
          price: Number(formData.price),
          stock: Number(formData.stock),
          imageUrl: formData.imageUrl || undefined,
        };
      }

      const result = await updateSkuAction(sku.id, data);

      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("skus.successUpdate"),
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
      title={t("skus.edit")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-lg"
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-skuCode">{t("skus.skuCodeLabel")}</Label>
          <Input
            id="edit-skuCode"
            value={formData.skuCode}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-price">{t("skus.priceLabel")}</Label>
            <Input
              id="edit-price"
              type="number"
              value={formData.price ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, price: Number(e.target.value) });
                if (errors.price) setErrors({ ...errors, price: "" });
              }}
              disabled={isPending}
              className={errors.price ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.price && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.price}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-stock">{t("skus.stockLabel")}</Label>
            <Input
              id="edit-stock"
              type="number"
              value={formData.stock ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, stock: Number(e.target.value) });
                if (errors.stock) setErrors({ ...errors, stock: "" });
              }}
              disabled={isPending}
              className={errors.stock ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.stock && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.stock}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("skus.imageLabel")}</Label>
          <ImageUpload
            value={imageFile ? undefined : formData.imageUrl || undefined}
            onChange={(file) => setImageFile(file)}
            onRemove={() => {
              setImageFile(null);
              setFormData({ ...formData, imageUrl: "" });
            }}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
