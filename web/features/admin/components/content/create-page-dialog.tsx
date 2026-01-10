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
import { useRouter } from "next/navigation";
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
 *    - `useTransition`: Giúp UI không bị đơ (freezing) khi đang chờ Server xử lý.
 * =================================================================================================
 */
export function CreatePageDialog({
  open,
  onOpenChange,
}: CreatePageDialogProps) {
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
      const autoSlug =
        "/" +
        val
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      setSlug(autoSlug);
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
          title: "Page created",
          description: `Successfully created page "${title}"`,
        });
        onOpenChange(false);
        setTitle("");
        setSlug("");
        router.push(`/admin/pages/${res.data.id}`);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to create page",
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
              Create New Page
            </DialogTitle>
            <DialogDescription>
              Enter the title and URL for your new page. You can add content
              blocks later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g., Summer Collection"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">URL Slug (Path)</Label>
                {slug === "/" && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-tighter">
                    Homepage
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
                MUST START WITH / (Use / for Homepage)
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title || !slug}>
              {isPending ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
