"use client";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageAction } from "@/features/admin/actions";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toSlug } from "@/lib/utils";
import { useState, useTransition } from "react";

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * =================================================================================================
 * CREATE PAGE DIALOG - HỘP THOẠI TẠO TRANG MỚI
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SLUG GENERATION (AUTO-SLUG):
 *    - Khi User nhập Title ("Summer Collection 2024"), ta tự động tạo URL thân thiện ("summer-collection-2024").
 *    - Logic: `toLowerCase()`, `trim()`, thay khoảng trắng bằng gạch ngang `-`, bỏ ký tự đặc biệt.
 *
 * 2. SERVER ACTIONS (`createPageAction`):
 *    - Thay vì gọi API `/api/pages`, ta dùng Server Action của Next.js (chạy trực tiếp trên Server).
 *    - `useTransition`: Giúp UI không bị đơ (freezing) khi đang chờ Server xử lý. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function CreatePageDialog({
  open,
  onOpenChange,
}: CreatePageDialogProps) {
  const t = useTranslations("admin.pages.create");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);

    // Auto-generate slug
    if (val.toLowerCase() === "home" || val === "/") {
      setSlug("/");
    } else {
      setSlug("/" + toSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    // Ensure slug starts with /
    const finalSlug = slug.startsWith("/") ? slug : `/${slug}`;

    startTransition(async () => {
      const res = await createPageAction({
        title,
        slug: finalSlug,
        blocks: [],
        isPublished: false,
      });

      if (res.success && res.data) {
        toast({
          title: t("success"),
          description: t("successDesc", { title }),
        });
        onOpenChange(false);
        setTitle("");
        setSlug("");
        router.push(`/admin/pages/${res.data.id}`);
        router.refresh();
      } else {
        toast({
          title: t("error"),
          description: res.error || t("errorDefault"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              {t("title")}
            </DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("pageTitle")}</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder={t("pageTitlePlaceholder")}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">{t("urlSlug")}</Label>
                {slug === "/" && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-tighter">
                    {t("homepageBadge")}
                  </span>
                )}
              </div>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="/summer-collection"
                disabled={isPending}
                required
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {t("slugHelp")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !title || !slug}>
              {isPending ? t("creating") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
