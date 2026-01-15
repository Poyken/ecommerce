"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Settings2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PageData {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  metaDescription?: string;
}

interface PageSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: PageData;
  onSave: (data: Partial<PageData>) => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

/**
 * =================================================================================================
 * PAGE SETTINGS SHEET - CẤU HÌNH TRANG (SEO & PUBLISH)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. META DESCRIPTION (SEO):
 *    - Thẻ này cực quan trọng cho Google Search.
 *    - Nên giới hạn < 160 ký tự để không bị cắt bớt trên trang kết quả tìm kiếm.
 *
 * 2. PUBLISHING WORKFLOW:
 *    - `isPublished`: Cờ (Flag) quyết định trang có được hiển thị cho khách hay không.
 *    - Draft (Nháp): Chỉ Admin thấy.
 *    - Published (Công khai): Mọi người đều thấy.
 *    - Khi sửa xong -> Save -> DB cập nhật -> Next.js revalidate cache (ISR). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function PageSettingsSheet({
  open,
  onOpenChange,
  page,
  onSave,
  onDelete,
  isSaving,
}: PageSettingsSheetProps) {
  const t = useTranslations("admin.pages.settings");
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription || ""
  );

  const handleSave = () => {
    onSave({
      title,
      slug,
      isPublished,
      metaDescription,
    });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug from title if slug matches old title pattern
    const autoSlug =
      "/" +
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    if (slug === page.slug || slug === "") {
      setSlug(autoSlug);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto px-6 py-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t("title")}
          </SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("basicInfo")}
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">{t("pageTitle")}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t("pageTitlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t("urlSlug")}</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={t("urlSlugPlaceholder")}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("urlSlugHelp")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* SEO Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("seo")}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">{t("metaDescription")}</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t("metaDescriptionPlaceholder")}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t("charCount", { count: metaDescription.length })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Publishing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("publishing")}
            </h3>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="published" className="text-base">
                  {t("publishPage")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublished ? t("publishedStatus") : t("draftStatus")}
                </p>
              </div>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>

            {onDelete && (
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete")}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
