"use client";



import { DataTablePagination } from "@/components/shared/data-table-pagination";
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
import { deleteBrandAction, getBrandsAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { CreateBrandDialog } from "@/features/admin/components/taxonomy/create-brand-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { EditBrandDialog } from "@/features/admin/components/taxonomy/edit-brand-dialog";
import { useAdminBrands } from "@/features/admin/providers/admin-metadata-provider";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PaginationMeta } from "@/types/dtos";
import { Brand } from "@/types/models";
import { useBrandsImportExport } from "@/features/admin/hooks/use-brands-import-export";
import { ImportDialog } from "@/components/shared/data-table/import-dialog";
import { format } from "date-fns";
import {
  Award,
  Download,
  Edit,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const {
    downloadTemplate,
    exportBrands,
    importBrands,
    previewBrands,
    loading: importExportLoading,
  } = useBrandsImportExport();

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
  const {
    data: brandsRes,
    mutate: mutateLocalBrands,
    isValidating,
  } = useSWR(
    ["admin-brands-list", page, limit, debouncedSearchTerm],
    () => getBrandsAction(page, limit, debouncedSearchTerm),
    {
      fallbackData: {
        success: true,
        data: initialBrands,
        meta: meta!,
      },
      revalidateOnFocus: false,
    }
  );

  const { mutate: mutateGlobalBrands } = useAdminBrands();

  const brands =
    brandsRes && "data" in brandsRes
      ? Array.isArray(brandsRes.data)
        ? brandsRes.data
        : (brandsRes.data as any).data || []
      : [];
  const currentMeta =
    brandsRes && "meta" in brandsRes ? (brandsRes as any).meta : meta;
  const total = currentMeta?.total || 0;

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("brands.title")}
        subtitle={`${total} brands in total`}
        icon={<Award className="text-emerald-500 fill-emerald-500/10" />}
        variant="emerald"
        stats={[{ label: "total", value: total, variant: "slate" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportBrands}
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
                  {t("brands.createNew")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Search and Total */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder={t("search", { item: t("brands.title").toLowerCase() })}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border-none shadow-inner h-14">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Award className="h-3 w-3" />
            Total Brands: {total}
          </div>
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isValidating} >
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
                          ID: {brand.id}
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {brand.createdAt
                      ? format(new Date(brand.createdAt), "dd/MM/yyyy")
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
                    variant="minimal"
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
            key={selectedBrand.id}
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
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={importBrands}
        onPreview={previewBrands}
        onDownloadTemplate={downloadTemplate}
        title={`${t("import")} ${t("brands.title")}`}
      />
    </div>
  );
}
