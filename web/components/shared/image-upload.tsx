"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (file: any) => void;
  onRemove?: () => void;
  label?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  disabled,
}: ImageUploadProps) {
/**
 * =====================================================================
 * IMAGE UPLOAD - Component upload ảnh đa năng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DUAL MODE (FILE & URL):
 * - Cho phép user upload file từ máy HOẶC paste link ảnh trực tiếp.
 * - `URL.createObjectURL(file)` tạo link preview tạm thời ngay tại browser trước khi upload thật.
 *
 * 2. CONTROLLED COMPONENT:
 * - Nhận `value` và `onChange` từ React Hook Form (thường thấy).
 * =====================================================================
 */
  const t = useTranslations("admin.media");
  const [preview, setPreview] = useState<string>(value || "");
  const [mode, setMode] = useState<"url" | "file">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    }
  };

  const clearImage = () => {
    setPreview("");
    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label || t("addImage")}</Label>
        {!preview && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-[10px] ${
                mode === "file" ? "bg-secondary" : ""
              }`}
              onClick={() => setMode("file")}
              disabled={disabled}
            >
              <Upload className="h-3 w-3 mr-1" />
              File
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-[10px] ${
                mode === "url" ? "bg-secondary" : ""
              }`}
              onClick={() => setMode("url")}
              disabled={disabled}
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              URL
            </Button>
          </div>
        )}
      </div>

      {preview ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden group">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={clearImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : mode === "file" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("uploadPlaceholder")}
          </span>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <Input
          type="url"
          placeholder={t("urlPlaceholder")}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
