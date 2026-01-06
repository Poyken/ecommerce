"use client";

import { useToast } from "@/components/shared/use-toast";
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
import { AdminTableWrapper } from "@/features/admin/components/admin-page-components";
import { CreatePageDialog } from "@/features/admin/components/create-page-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
import { Link } from "@/i18n/routing";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useState, useTransition } from "react";

interface PagesListClientProps {
  initialPages: any[];
}

/**
 * =================================================================================================
 * PAGES LIST CLIENT - DANH SÁCH TRANG (CLIENT COMPONENT)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYDRATION:
 *    - Dữ liệu `initialPages` được lấy từ Server (Prisma) và truyền vào Client Component này.
 *    - Đây là kĩ thuật phổ biến trong Next.js App Router (Server -> Client).
 *
 * 2. OPTIMISTIC UPDATES VS REFRESH:
 *    - Khi xóa trang (`handleDelete`), ta gọi Server Action.
 *    - Sau đó gọi `router.refresh()` để Next.js tải lại dữ liệu mới nhất từ Server mà không cần F5 trình duyệt.
 * =================================================================================================
 */
export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return { success: false, error: "No ID selected" };

    const res = await deletePageAction(deleteId);
    if (res.success) {
      setDeleteId(null);
      router.refresh();
    }
    return res;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full px-6 shadow-xl shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Page
        </Button>
      </div>

      <AdminTableWrapper title="All Pages">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPages.map((page: any) => (
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
                        Home
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
                    {page.isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(page.updatedAt), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 transition-opacity">
                    <Button variant="outline" size="sm" asChild className="h-9">
                      <Link href={`/admin/pages/${page.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Build
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-9 w-9"
                    >
                      <a
                        href={page.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(page.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {initialPages.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-20 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Edit className="h-8 w-8 opacity-20" />
                    <p>No pages found. Start by creating one.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      <CreatePageDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone."
        action={handleDelete}
        confirmLabel="Delete Page"
      />
    </div>
  );
}
