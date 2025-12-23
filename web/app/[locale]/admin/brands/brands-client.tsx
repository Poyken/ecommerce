"use client";

import { deleteBrandAction, getBrandsAction } from "@/actions/admin";
import { AdminSearchInput } from "@/components/organisms/admin/admin-search-input";
import { CreateBrandDialog } from "@/components/organisms/admin/create-brand-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditBrandDialog } from "@/components/organisms/admin/edit-brand-dialog";
import { Button } from "@/components/atoms/button";
import { DataTableEmptyRow } from "@/components/atoms/data-table-empty-row";
import { GlassCard } from "@/components/atoms/glass-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminBrands } from "@/providers/admin-metadata-provider";
import { useAuth } from "@/providers/auth-provider";
import { Brand } from "@/types/models";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export function BrandsPageClient({ brands: initialBrands }: { brands: Brand[] }) {
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

  // Hybrid Fetching: SWR for the table list
  const { data: brandsRes, mutate: mutateLocalBrands } = useSWR(
    ["admin-brands-list", debouncedSearchTerm],
    () => getBrandsAction(debouncedSearchTerm),
    {
      fallbackData: { data: initialBrands },
      revalidateOnFocus: false,
    }
  );

  const { mutate: mutateGlobalBrands } = useAdminBrands();

  const brands = brandsRes?.data || [];

  // Helper to mutate both local and global cache
  const refreshData = () => {
    mutateLocalBrands();
    mutateGlobalBrands();
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
      router.push(`/admin/brands?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("brands.title")}</h1>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t("brands.createNew")}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <AdminSearchInput
          placeholder={t("search", { item: t("brands.title").toLowerCase() })}
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("all", { item: t("brands.title") })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("brands.nameLabel")}
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
            {brands && brands.length > 0 ? (
              brands.map((brand: any) => (
                <TableRow
                  key={brand.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {brand.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {brand.createdAt
                      ? new Date(brand.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(brand)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          >
                            {t("edit")}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(brand)}
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
              <DataTableEmptyRow
                colSpan={canUpdate || canDelete ? 3 : 2}
                message={t("noFound", { item: t("brands.title").toLowerCase() })}
              />
            )}
          </TableBody>
        </Table>
      </GlassCard>

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
