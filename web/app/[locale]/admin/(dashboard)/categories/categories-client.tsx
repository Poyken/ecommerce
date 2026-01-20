"use client";

/**
 * =====================================================================
 * CATEGORIES PAGE CLIENT - Quản lý danh mục (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - SWR for data fetching and caching
 * - Added Parent column to show category hierarchy
 * - Using DataTablePagination with page numbers *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
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
import {
  deleteCategoryAction,
  getCategoriesAction,
} from "@/features/admin/actions";
import {
  AdminActionBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { CreateCategoryDialog } from "@/features/admin/components/taxonomy/create-category-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { EditCategoryDialog } from "@/features/admin/components/taxonomy/edit-category-dialog";
import { useAdminCategories } from "@/features/admin/providers/admin-metadata-provider";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PaginationMeta } from "@/types/dtos";
import { Category } from "@/types/models";
import { useCategoriesImportExport } from "@/features/admin/hooks/use-categories-import-export";
import { ImportDialog } from "@/components/shared/data-table/import-dialog";
import { format } from "date-fns";
import {
  Download,
  Edit,
  Folder,
  FolderTree,
  GitBranch,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export function CategoriesPageClient({
  categories: initialCategories,
  meta,
}: {
  categories: Category[];
  meta?: PaginationMeta;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const {
    downloadTemplate,
    exportCategories,
    importCategories,
    previewCategories,
    loading: importExportLoading,
  } = useCategoriesImportExport();

  const canCreate = hasPermission("category:create");
  const canUpdate = hasPermission("category:update");
  const canDelete = hasPermission("category:delete");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  // Hybrid Fetching: SWR for the table list
  const {
    data: categoriesRes,
    mutate: mutateLocalCategories,
    isValidating,
  } = useSWR(
    ["admin-categories-list", page, limit, debouncedSearchTerm],
    () => getCategoriesAction(page, limit, debouncedSearchTerm),
    {
      fallbackData: {
        success: true,
        data: initialCategories,
        meta: meta!,
      },
      revalidateOnFocus: false,
    }
  );

  const { mutate: mutateGlobalCategories } = useAdminCategories();

  const categories =
    categoriesRes && "data" in categoriesRes
      ? Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : (categoriesRes.data as any).data || []
      : [];
  const currentMeta =
    categoriesRes && "meta" in categoriesRes
      ? (categoriesRes as any).meta
      : meta;
  const total = currentMeta?.total || 0;

  // Count stats
  const safeCategories = Array.isArray(categories) ? categories : [];
  const parentCount = safeCategories.filter(
    (c: Category) => !c.parentId
  ).length;
  const childCount = safeCategories.filter((c: Category) => c.parentId).length;

  const refreshData = () => {
    mutateLocalCategories();
    mutateGlobalCategories();
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      router.push(`/admin/categories?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const openEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const openDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Helper to find parent category name
  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    const parent = categories.find((c: Category) => c.id === parentId);
    return parent?.name || "Unknown";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("categories.title")}
        subtitle={`${total} categories in total`}
        icon={<FolderTree className="text-emerald-500 fill-emerald-500/10" />}
        variant="emerald"
        stats={[
          { label: "total", value: total, variant: "slate" },
          { label: "parents", value: parentCount, variant: "amber" },
          { label: "children", value: childCount, variant: "cyan" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportCategories}
              className="rounded-xl"
              disabled={importExportLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setImportDialogOpen(true)}
                  disabled={importExportLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("import")}
                </Button>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="rounded-xl shadow-lg shadow-primary/20"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("categories.createNew")}
                </Button>
              </>
            )}
          </div>
        }
      />
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder={t("search", {
              item: t("categories.title").toLowerCase(),
            })}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border-none shadow-inner h-14">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <GitBranch className="h-3 w-3" />
            Hierarchy
          </div>
          <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            Parents: {parentCount}
          </div>
          <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Children: {childCount}
          </div>
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isValidating} variant="emerald">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[30%]">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  {t("categories.nameLabel")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Parent
                </div>
              </TableHead>
              <TableHead>{t("categories.slugLabel")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right w-[120px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories && categories.length > 0 ? (
              categories.map((category: Category) => (
                <TableRow
                  key={category.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          category.parentId
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {category.parentId ? (
                          <Folder className="h-5 w-5" />
                        ) : (
                          <FolderTree className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <code className="text-xs text-muted-foreground">
                          ID: {category.id.slice(0, 8)}...
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.parentId ? (
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                      >
                        {getParentName(category.parentId)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm italic">
                        Root
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(category.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 5 : 4}>
                  <AdminEmptyState
                    icon={FolderTree}
                    title={t("noFound", {
                      item: t("categories.title").toLowerCase(),
                    })}
                    description="No categories found. Create one to get started."
                    action={
                      canCreate ? (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Category
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>
      {/* Pagination with page numbers */}
      {/* Pagination with page numbers - only show when needed */}
      {currentMeta &&
        categories.length > 0 &&
        currentMeta.total > currentMeta.limit && (
          <DataTablePagination
            page={currentMeta.page}
            total={currentMeta.total}
            limit={currentMeta.limit}
          />
        )}
      {/* Dialogs */}
      <CreateCategoryDialog
        categories={categories}
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) refreshData();
        }}
      />
      {selectedCategory && (
        <>
          <EditCategoryDialog
            key={selectedCategory.id}
            categories={categories}
            category={selectedCategory}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) refreshData();
            }}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) refreshData();
            }}
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", {
              item: selectedCategory.name,
            })}
            action={() => deleteCategoryAction(selectedCategory.id)}
            successMessage={t("categories.successDelete")}
          />
        </>
      )}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={importCategories}
        onPreview={previewCategories}
        onDownloadTemplate={downloadTemplate}
        title={`${t("import")} ${t("categories.title")}`}
      />
    </div>
  );
}
