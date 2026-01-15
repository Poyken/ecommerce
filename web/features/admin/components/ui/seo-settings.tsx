"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface SeoSettingsProps {
  values: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  onChange: (values: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  }) => void;
  productName?: string; // For auto-generation suggestions
}

/**
 * =====================================================================
 * SEO SETTINGS - Cấu hình SEO cho sản phẩm/danh mục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. META TITLE:
 * - Tiêu đề hiển thị trên tab trình duyệt và kết quả tìm kiếm.
 * - Nên giữ dưới 60 ký tự để không bị cắt.
 *
 * 2. META DESCRIPTION:
 * - Mô tả ngắn gọn về trang, xuất hiện dưới tiêu đề trong kết quả Google.
 * - Nên giữ dưới 160 ký tự để tối ưu hiển thị.
 *
 * 3. META KEYWORDS:
 * - Các từ khóa liên quan đến sản phẩm, phân cách bởi dấu phẩy.
 * - Ít quan trọng hơn với Google hiện đại, nhưng vẫn hữu ích cho nội bộ. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function SeoSettings({
  values,
  onChange,
  productName,
}: SeoSettingsProps) {
  const t = useTranslations("admin.seo");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (
    field: "metaTitle" | "metaDescription" | "metaKeywords",
    value: string
  ) => {
    onChange({ ...values, [field]: value });
  };

  const titleLength = values.metaTitle?.length || 0;
  const descLength = values.metaDescription?.length || 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t("title")}</span>
          {(values.metaTitle || values.metaDescription) && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              {t("configured")}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          {/* Meta Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaTitle">{t("metaTitle")}</Label>
              <span
                className={`text-xs ${
                  titleLength > 60
                    ? "text-red-400"
                    : titleLength > 50
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                }`}
              >
                {titleLength}/60
              </span>
            </div>
            <Input
              id="metaTitle"
              value={values.metaTitle || ""}
              onChange={(e) => handleChange("metaTitle", e.target.value)}
              placeholder={productName || t("enterTitle")}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              {t("metaTitleDesc")}
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaDescription">{t("metaDescription")}</Label>
              <span
                className={`text-xs ${
                  descLength > 160
                    ? "text-red-400"
                    : descLength > 140
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                }`}
              >
                {descLength}/160
              </span>
            </div>
            <Textarea
              id="metaDescription"
              value={values.metaDescription || ""}
              onChange={(e) => handleChange("metaDescription", e.target.value)}
              placeholder={t("enterDesc")}
              className="bg-background min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              {t("metaDescriptionDesc")}
            </p>
          </div>

          {/* Meta Keywords */}
          <div className="space-y-2">
            <Label htmlFor="metaKeywords">{t("keywords")}</Label>
            <Input
              id="metaKeywords"
              value={values.metaKeywords || ""}
              onChange={(e) => handleChange("metaKeywords", e.target.value)}
              placeholder={t("enterKeywords")}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">{t("keywordsDesc")}</p>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-background/50">
            <p className="text-xs text-muted-foreground mb-2">
              {t("searchPreview")}:
            </p>
            <div className="space-y-1">
              <p className="text-primary text-lg truncate">
                {values.metaTitle || productName || t("productTitle")}
              </p>
              <p className="text-green-400 text-sm truncate">
                https://yoursite.com/products/...
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {values.metaDescription || t("noDescription")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
