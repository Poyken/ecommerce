"use client";

import { UploadCloud, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

/**
 * =====================================================================
 * IMAGE UPLOAD - Thành phần tải lên hình ảnh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REACT DROPZONE:
 * - Sử dụng `useDropzone` để hỗ trợ kéo thả (Drag & Drop) tệp tin.
 * - `getRootProps` & `getInputProps`: Các props cần thiết để biến một vùng div thành vùng nhận file.
 *
 * 2. OBJECT URL PREVIEW:
 * - `URL.createObjectURL(file)`: Tạo một đường dẫn tạm thời để hiển thị ảnh ngay lập tức sau khi chọn, giúp user xem trước (Preview) mà không cần chờ upload lên server.
 * - Cần lưu ý dọn dẹp (revoke) URL này nếu dùng trong ứng dụng lớn để tránh rò rỉ bộ nhớ.
 *
 * 3. UI FEEDBACK:
 * - `isDragActive`: Thay đổi màu nền và viền khi user đang kéo file đè lên vùng upload.
 * - Hỗ trợ nút xóa (`handleRemove`) để user dễ dàng thay đổi lựa chọn.
 * =====================================================================
 */

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
}: ImageUploadProps) {
  const t = useTranslations("admin.media");
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    if (value !== undefined) {
      setPreview(value || null);
    }
  }, [value]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onChange(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onRemove();
  };

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
        ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-gray-300 dark:border-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary"}
      `}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative aspect-square w-full h-48 overflow-hidden rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Image src={preview} alt="Preview" fill className="object-contain" />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <UploadCloud size={40} className="mb-2" />
          <p className="text-sm font-medium">
            {isDragActive ? t("dropHere") : t("clickOrDrag")}
          </p>
          <p className="text-xs mt-1 text-gray-400">{t("uploadConstraints")}</p>
        </div>
      )}
    </div>
  );
}
