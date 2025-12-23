/**
 * =====================================================================
 * IMAGE UPLOAD - Thành phần tải ảnh lên (qua URL)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URL-BASED UPLOAD:
 * - Hiện tại hệ thống hỗ trợ nhập URL ảnh trực tiếp thay vì upload file vật lý.
 * - Giúp tiết kiệm tài nguyên server và tận dụng các CDN có sẵn.
 *
 * 2. PREVIEW MODE:
 * - Khi có URL, component hiển thị ảnh xem trước (`preview`).
 * - Có nút X (Clear) để xóa ảnh và quay lại ô nhập liệu.
 * =====================================================================
 */

/**
 * =====================================================================
 * IMAGE UPLOAD - Thành phần tải ảnh lên (qua URL)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URL-BASED UPLOAD:
 * - Hiện tại hệ thống hỗ trợ nhập URL ảnh trực tiếp thay vì upload file vật lý.
 * - Giúp tiết kiệm tài nguyên server và tận dụng các CDN có sẵn.
 *
 * 2. PREVIEW MODE:
 * - Khi có URL, component hiển thị ảnh xem trước (`preview`).
 * - Có nút X (Clear) để xóa ảnh và quay lại ô nhập liệu.
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const t = useTranslations("admin.media");
  const [preview, setPreview] = useState<string>(value || "");

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  const clearImage = () => {
    setPreview("");
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label || t("addImage")}</Label>

      {preview ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden group">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Input
          type="url"
          placeholder={t("urlPlaceholder")}
          value={value || ""}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      )}
    </div>
  );
}
