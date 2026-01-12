"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useState } from "react";

interface ImageItem {
  id?: string;
  url: string;
  alt?: string;
  displayOrder: number;
  file?: File; // For newly uploaded files
}

interface MediaGalleryProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  label?: string;
}

/**
 * =====================================================================
 * MEDIA GALLERY - Quản lý bộ sưu tập ảnh sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NATIVE DRAG & DROP:
 * - Thay vì dùng thư viện nặng như `dnd-kit`, ta dùng API kéo thả có sẵn của trình duyệt.
 * - Sự kiện: `onDragStart` (bắt đầu kéo), `onDragOver` (kéo qua phần tử khác), `onDragEnd` (thả tay).
 * - Logic `handleDragOver`: Hoán đổi vị trí trong mảng `images` ngay lập tức để tạo hiệu ứng mượt mà.
 *
 * 2. OBJECT URL PREVIEW:
 * - Khi user chọn file từ máy: `URL.createObjectURL(file)`.
 * - Tạo ra một URL giả (blob:http://...) để hiển thị ảnh ngay lập tức mà chưa cần upload lên server.
 * - UX tốt: User thấy ngay ảnh mình vừa chọn.
 *
 * 3. ACCESSIBILITY (ALT TEXT):
 * - Rất quan trọng cho SEO. Cho phép Admin nhập mô tả ảnh ngay lúc upload. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function MediaGallery({
  images,
  onChange,
  maxImages = 10,
  label,
}: MediaGalleryProps) {
  const t = useTranslations("admin.media");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      const filesToAdd = files.slice(0, remainingSlots);

      const newImages: ImageItem[] = filesToAdd.map((file, index) => ({
        url: URL.createObjectURL(file),
        alt: file.name.split(".")[0],
        displayOrder: images.length + index,
        file,
      }));

      onChange([...images, ...newImages]);
      e.target.value = ""; // Reset input
    },
    [images, maxImages, onChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      // Recalculate display order
      newImages.forEach((img, i) => {
        img.displayOrder = i;
      });
      onChange(newImages);
    },
    [images, onChange]
  );

  const handleAltChange = useCallback(
    (index: number, alt: string) => {
      const newImages = [...images];
      newImages[index] = { ...newImages[index], alt };
      onChange(newImages);
    },
    [images, onChange]
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, removed);

    // Recalculate display order
    newImages.forEach((img, i) => {
      img.displayOrder = i;
    });

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label || t("addImage")}</Label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id || image.url}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group border rounded-lg overflow-hidden bg-muted/50 aspect-square",
              draggedIndex === index && "opacity-50 border-primary"
            )}
          >
            <Image
              src={image.url}
              alt={image.alt || "Product image"}
              fill
              className="object-cover"
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-white" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Order badge */}
            {index === 0 && (
              <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {t("main")}
              </span>
            )}
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxImages && (
          <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("addImage")}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Alt text inputs */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">
            {t("altText")}
          </Label>
          <div className="grid gap-2">
            {images.map((image, index) => (
              <div
                key={image.id || image.url}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 relative rounded overflow-hidden shrink-0">
                  <Image src={image.url} alt="" fill className="object-cover" />
                </div>
                <Input
                  value={image.alt || ""}
                  onChange={(e) => handleAltChange(index, e.target.value)}
                  placeholder={t("altPlaceholder", { index: index + 1 })}
                  className="flex-1 h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
