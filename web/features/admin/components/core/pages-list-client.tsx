/**
 * =====================================================================
 * PAGES LIST CLIENT - Danh sách Pages (CMS)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC IMPORT:
 * - `CreatePageDialog` và `DeleteConfirmDialog` được import dynamic.
 * - `ssr: false`: Chỉ load ở phía Client.
 * - Lý do: Các dialog này nặng và không cần thiết cho SEO / Initial Paint.
 *
 * 2. TABLE ACTIONS:
 * - "Build": Chuyển sang trang Page Builder (Drag & Drop).
 * - "ExternalLink": Mở trang thực tế (Public View).
 *
 * 3. HYDRATION:
 * - Component này chạy ở Client (`use client`) nhưng nhận dữ liệu ban đầu từ Server (`initialPages`).
 * - Kết hợp `useAdminTable` hook để xử lý search/filter client-side nhanh. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePageAction } from "@/features/admin/actions";
import { AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";
import { Link } from "@/i18n/routing";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

// Use dynamic imports with ssr: false to prevent flicking issues common in Next.js hydration
const CreatePageDialog = dynamic(
  () =>
    import("@/features/admin/components/content/create-page-dialog").then(
      (mod) => mod.CreatePageDialog
    ),
  { ssr: false }
);

const DeleteConfirmDialog = dynamic(
  () =>
    import("@/features/admin/components/shared/delete-confirm-dialog").then(
      (mod) => mod.DeleteConfirmDialog
    ),
  { ssr: false }
);

interface PagesListClientProps {
  initialPages: any[];
}

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const t = useTranslations("admin.pages");
  const { isPending } = useAdminTable("/admin/pages");

  // Local filter for search term if needed, or rely on server-side
  const pages = initialPages;

  const handleDelete = async () => {
    if (!selectedPage) return { success: false, error: "No page selected" };

    const res = await deletePageAction(selectedPage.id);
    if (res.success) {
      // Toast and dialog close are handled by DeleteConfirmDialog
      // setIsDeleteOpen(false);
    }
    return res;
  };

  const openDelete = (page: any) => {
    setSelectedPage(page);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full px-6 shadow-xl shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createNew")}
        </Button>
      </div>

      <AdminTableWrapper title={t("allPages")} isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.title")}</TableHead>
              <TableHead>{t("table.slug")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.lastUpdated")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page: any) => (
              <TableRow
                key={page.id}
                className="group hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium text-lg">
                  {page.title}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground font-mono">
                      {page.slug}
                    </code>
                    {page.slug === "/" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-tighter bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                      >
                        {t("table.homeBadge")}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={page.isPublished ? "default" : "secondary"}
                    className={
                      page.isPublished
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : ""
                    }
                  >
                    {page.isPublished
                      ? t("status.published")
                      : t("status.draft")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(page.updatedAt), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild className="h-9">
                      <Link href={`/admin/pages/${page.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t("actions.build")}
                      </Link>
                    </Button>
                    {(() => {
                      const hasBlocks =
                        Array.isArray(page.blocks) && page.blocks.length > 0;
                      const isDisabled = !hasBlocks || !page.isPublished;
                      const linkHref =
                        page.slug === "home" || page.slug === "/"
                          ? "/"
                          : `/${page.slug}`;

                      if (isDisabled) {
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="h-9 w-9 opacity-50"
                            title={
                              !page.isPublished
                                ? t("actions.publishToView")
                                : t("actions.addBlocksToView")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        );
                      }

                      return (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-9 w-9"
                        >
                          <Link
                            href={linkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      );
                    })()}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                      onClick={() => openDelete(page)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="text-center py-20 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Edit className="h-8 w-8 opacity-20" />
                    <p>{t("table.noPages")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      <CreatePageDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {selectedPage && (
        <DeleteConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title={t("delete.title")}
          description={t("delete.description", { title: selectedPage.title })}
          action={handleDelete}
          confirmLabel={t("delete.confirm")}
        />
      )}
    </div>
  );
}
