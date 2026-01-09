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
 * - Using DataTablePagination with page numbers
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
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/admin-page-components";
import { CreateCategoryDialog } from "@/features/admin/components/create-category-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
import { EditCategoryDialog } from "@/features/admin/components/edit-category-dialog";
import { useAdminCategories } from "@/features/admin/providers/admin-metadata-provider";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PaginationMeta } from "@/types/dtos";
import { Category } from "@/types/models";
import { format } from "date-fns";
import {
  Edit,
  Folder,
  FolderTree,
  GitBranch,
  Plus,
  Search,
  Trash2,
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

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
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("categories.title")}
        subtitle={`${total} categories in total`}
        icon={<FolderTree className="h-5 w-5" />}
        stats={[
          { label: "total", value: total, variant: "default" },
          { label: "parents", value: parentCount, variant: "info" },
          { label: "children", value: childCount, variant: "success" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("categories.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search", {
              item: t("categories.title").toLowerCase(),
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isValidating}>
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
    </div>
  );
}
