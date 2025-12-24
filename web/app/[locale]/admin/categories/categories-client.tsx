"use client";

import { deleteCategoryAction, getCategoriesAction } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { CreateCategoryDialog } from "@/components/organisms/admin/create-category-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditCategoryDialog } from "@/components/organisms/admin/edit-category-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminCategories } from "@/providers/admin-metadata-provider";
import { useAuth } from "@/providers/auth-provider";
import { PaginationMeta } from "@/types/dtos";
import { Category } from "@/types/models";
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
  const { data: categoriesRes, mutate: mutateLocalCategories } = useSWR(
    ["admin-categories-list", page, limit, debouncedSearchTerm],
    () => getCategoriesAction(page, limit, debouncedSearchTerm),
    {
      fallbackData: {
        data: initialCategories,
        meta: meta!,
        statusCode: 200,
        message: "Success",
      },
      revalidateOnFocus: false,
    }
  );

  const { mutate: mutateGlobalCategories } = useAdminCategories();

  const categories =
    categoriesRes && "data" in categoriesRes ? categoriesRes.data || [] : [];

  // Helper to mutate both local and global cache
  const refreshData = () => {
    mutateLocalCategories();
    mutateGlobalCategories();
  };

  // Update URL when debounced search term changes
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("categories.title")}</h1>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t("categories.createNew")}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder={t("search", {
            item: t("categories.title").toLowerCase(),
          })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("all", { item: t("categories.title") })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("categories.nameLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("categories.slugLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("created")}
              </TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
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
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {category.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(category)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          >
                            {t("edit")}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(category)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            {t("delete")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canUpdate || canDelete ? 4 : 3}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noFound", { item: t("categories.title").toLowerCase() })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {categoriesRes && "meta" in categoriesRes && categoriesRes.meta && (
        <DataTablePagination
          page={categoriesRes.meta.page}
          total={categoriesRes.meta.total}
          limit={categoriesRes.meta.limit}
        />
      )}

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
