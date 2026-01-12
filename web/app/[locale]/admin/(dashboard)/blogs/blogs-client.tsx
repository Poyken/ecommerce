"use client";

/**
 * =====================================================================
 * BLOGS CLIENT - Quản lý bài viết (Enhanced with Server-side filtering)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Server-side filtering via URL params (status, search)
 * - Pagination based on actual filtered results
 * - Consistent styling with other admin pages
 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  deleteBlogAction,
  toggleBlogPublishAction,
} from "@/features/blog/actions";
import { BlogFormDialog } from "@/features/blog/components/blog-form-dialog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { PaginationMeta } from "@/types/dtos";
import { BlogWithProducts, Category } from "@/types/models";
import { format } from "date-fns";
import {
  BookOpen,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface BlogsClientProps {
  blogs: BlogWithProducts[];
  categories: Category[];
  meta?: PaginationMeta;
  counts?: { total: number; published: number; drafts: number };
  currentStatus?: string;
}

type FilterType = "all" | "published" | "draft";

export function BlogsClient({
  blogs,
  categories,
  meta,
  counts,
  currentStatus = "all",
}: BlogsClientProps) {
  const t = useTranslations("admin.blogs");
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [selectedBlog, setSelectedBlog] = useState<BlogWithProducts | null>(
    null
  );
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const canCreate = hasPermission("blog:create");
  const canUpdate = hasPermission("blog:update");
  const canDelete = hasPermission("blog:delete");

  const page = meta?.page || 1;
  const limit = meta?.limit || 10;
  const total = meta?.total || blogs.length;

  // Use counts from server for accurate tab numbers
  const totalCount = counts?.total || total;
  const publishedCount = counts?.published || 0;
  const draftCount = counts?.drafts || 0;

  // Handle filter change - update URL
  const handleFilterChange = (filter: FilterType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("status");
      } else {
        params.set("status", filter);
      }
      params.set("page", "1");
      router.push(`/admin/blogs?${params.toString()}`);
    });
  };

  // Update URL when search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/admin/blogs?${params.toString()}`);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const handleCreate = () => {
    setSelectedBlog(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (blog: BlogWithProducts) => {
    setSelectedBlog(blog);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (blog: BlogWithProducts) => {
    setSelectedBlog(blog);
    setIsDeleteDialogOpen(true);
  };

  const handleTogglePublish = (blog: BlogWithProducts) => {
    startTransition(async () => {
      const result = await toggleBlogPublishAction(blog.id);
      if (result.success) {
        toast({
          title: t("updateSuccess"),
          description: blog.publishedAt
            ? "Post unpublished (Draft)"
            : "Post published successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("title") || "Blog Management"}
        subtitle={t("management") || "Manage blog posts"}
        icon={<BookOpen className="text-orange-500 fill-orange-500/10" />}
        stats={[
          { label: "total", value: totalCount, variant: "default" },
          { label: "published", value: publishedCount, variant: "success" },
          { label: "drafts", value: draftCount, variant: "warning" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("create")}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentStatus}
          onValueChange={(v) => handleFilterChange(v as FilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
              disabled={isPending}
            >
              <FileText className="h-4 w-4" />
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
              disabled={isPending}
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Published
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {publishedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-amber-600 transition-all gap-2"
              disabled={isPending}
            >
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              Drafts
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[10px] font-black"
              >
                {draftCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-primary/20 transition-all font-medium"
          />
          {isPending && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[30%]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Title
                </div>
              </TableHead>
              <TableHead>{t("fields.slug")}</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Author
                </div>
              </TableHead>
              <TableHead>{t("published")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right w-[100px]">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>
                  <AdminEmptyState
                    icon={BookOpen}
                    title={t("noFound") || "No posts found"}
                    description={
                      currentStatus === "draft"
                        ? "No draft posts found."
                        : currentStatus === "published"
                        ? "No published posts found."
                        : "Create your first blog post to get started."
                    }
                    action={
                      canCreate && currentStatus === "all" ? (
                        <Button onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("create")}
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              blogs.map((blog) => (
                <TableRow
                  key={blog.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{blog.title}</p>
                        <code className="text-xs text-muted-foreground">
                          ID: {blog.id.slice(0, 8)}...
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded border">
                      {blog.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{blog.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={blog.language === "en" ? "default" : "secondary"}
                    >
                      {blog.language.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{blog.author}</TableCell>
                  <TableCell>
                    {blog.publishedAt ? (
                      <span className="text-sm">
                        {format(new Date(blog.publishedAt), "dd/MM/yyyy")}
                      </span>
                    ) : (
                      <StatusBadge status="DRAFT" label={t("draft")} />
                    )}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEdit(blog)}
                              title={t("editPost")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0 hover:bg-muted",
                                blog.publishedAt
                                  ? "text-amber-500 hover:text-amber-600"
                                  : "text-emerald-500 hover:text-emerald-600"
                              )}
                              onClick={() => handleTogglePublish(blog)}
                              title={blog.publishedAt ? "Unpublish" : "Publish"}
                            >
                              {blog.publishedAt ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(blog)}
                            title={t("deleteConfirm")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination - Only show when there are items and more than 1 page */}
      {meta && blogs.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Dialogs */}
      {(canCreate || canUpdate) && (
        <BlogFormDialog
          key={selectedBlog?.id || "new"}
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          blog={selectedBlog}
          categories={categories}
        />
      )}

      {canDelete && selectedBlog && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t("deleteConfirm")}
          description={`Are you sure you want to delete "${selectedBlog.title}"?`}
          action={() => deleteBlogAction(selectedBlog.id)}
          confirmLabel="Delete"
          successMessage="Blog deleted successfully"
        />
      )}
    </div>
  );
}
