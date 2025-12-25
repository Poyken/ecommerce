"use client";

/**
 * =====================================================================
 * BRANDS PAGE CLIENT - Quản lý thương hiệu (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - SWR for data fetching and caching
 * - Consistent styling with other admin pages
 * =====================================================================
 */

import { deleteBrandAction, getBrandsAction } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { Input } from "@/components/atoms/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/components/organisms/admin/admin-page-components";
import { CreateBrandDialog } from "@/components/organisms/admin/create-brand-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditBrandDialog } from "@/components/organisms/admin/edit-brand-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminBrands } from "@/providers/admin-metadata-provider";
import { useAuth } from "@/providers/auth-provider";
import { PaginationMeta } from "@/types/dtos";
import { Brand } from "@/types/models";
import { format } from "date-fns";
import { Award, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export function BrandsPageClient({
  brands: initialBrands,
  meta,
}: {
  brands: Brand[];
  meta?: PaginationMeta;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const canCreate = hasPermission("brand:create");
  const canUpdate = hasPermission("brand:update");
  const canDelete = hasPermission("brand:delete");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  // Hybrid Fetching: SWR for the table list
  const { data: brandsRes, mutate: mutateLocalBrands } = useSWR(
    ["admin-brands-list", page, limit, debouncedSearchTerm],
    () => getBrandsAction(page, limit, debouncedSearchTerm),
    {
      fallbackData: {
        data: initialBrands,
        meta: meta!,
        statusCode: 200,
        message: "Success",
      },
      revalidateOnFocus: false,
    }
  );

  const { mutate: mutateGlobalBrands } = useAdminBrands();

  const brands = brandsRes && "data" in brandsRes ? brandsRes.data || [] : [];
  const currentMeta = brandsRes && "meta" in brandsRes ? brandsRes.meta : meta;
  const total = currentMeta?.total || 0;
  const totalPages = currentMeta
    ? Math.ceil(currentMeta.total / currentMeta.limit)
    : 1;

  const refreshData = () => {
    mutateLocalBrands();
    mutateGlobalBrands();
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
      router.push(`/admin/brands?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/brands?${params.toString()}`);
  };

  const openEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setEditDialogOpen(true);
  };

  const openDelete = (brand: Brand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("brands.title")}
        subtitle={`${total} brands in total`}
        icon={<Award className="h-5 w-5" />}
        stats={[{ label: "total", value: total, variant: "default" }]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("brands.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search", { item: t("brands.title").toLowerCase() })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50%]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {t("brands.nameLabel")}
                </div>
              </TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right w-[120px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands && brands.length > 0 ? (
              brands.map((brand: any) => (
                <TableRow
                  key={brand.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <code className="text-xs text-muted-foreground">
                          ID: {brand.id.slice(0, 8)}...
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {brand.createdAt
                      ? format(new Date(brand.createdAt), "dd MMM yyyy")
                      : "N/A"}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openEdit(brand)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(brand)}
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
                <TableCell colSpan={canUpdate || canDelete ? 3 : 2}>
                  <AdminEmptyState
                    icon={Award}
                    title={t("noFound", {
                      item: t("brands.title").toLowerCase(),
                    })}
                    description="No brands found. Create one to get started."
                    action={
                      canCreate ? (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Brand
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

      {/* Pagination with page numbers - only show when needed */}
      {brands.length > 0 && total > (currentMeta?.limit || 10) && (
        <DataTablePagination
          page={page}
          total={total}
          limit={currentMeta?.limit || 10}
        />
      )}

      {/* Dialogs */}
      <CreateBrandDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) refreshData();
        }}
      />

      {selectedBrand && (
        <>
          <EditBrandDialog
            brand={selectedBrand}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) refreshData();
            }}
          />
          <DeleteConfirmDialog
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", { item: selectedBrand.name })}
            action={() => deleteBrandAction(selectedBrand.id)}
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) refreshData();
            }}
          />
        </>
      )}
    </div>
  );
}
