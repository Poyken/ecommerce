"use client";

/**
 * =====================================================================
 * PRODUCTS CLIENT - Quản lý sản phẩm (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Removed virtual scrolling for simpler pagination
 * - Using DataTablePagination with page numbers
 * - Filter tabs
 * - Stats header *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Enterprise Catalog Management: Cung cấp giao diện quản trị mạnh mẽ để kiểm soát hàng nghìn SKU sản phẩm, từ việc thiết lập thuộc tính đến quản lý phân loại và thương hiệu một cách khoa học.
 * - Multi-dimensional Product Insights: Giúp Admin nhanh chóng nhận diện các sản phẩm mới nhập (Recent) hoặc các sản phẩm chưa được phân loại (No Category) để kịp thời tối ưu hóa luồng hiển thị trên Storefront.

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteProductAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Product } from "@/types/models";
import { useProductsImportExport } from "@/features/admin/hooks/use-products-import-export";
import { ImportDialog } from "@/components/shared/data-table/import-dialog";
import { format } from "date-fns";
import {
  Box,
  Download,
  Edit,
  Languages,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const CreateProductDialog = dynamic(
  () =>
    import("@/features/admin/components/products/create-product-dialog").then(
      (mod) => mod.CreateProductDialog
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
const EditProductDialog = dynamic(
  () =>
    import("@/features/admin/components/products/edit-product-dialog").then(
      (mod) => mod.EditProductDialog
    ),
  { ssr: false }
);
const ProductTranslationDialog = dynamic(
  () =>
    import(
      "@/features/admin/components/products/product-translation-dialog"
    ).then((mod) => mod.ProductTranslationDialog),
  { ssr: false }
);

type FilterType = "all" | "recent" | "no-category";

export function ProductsClient({
  products,
  total,
  page,
  limit,
}: {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    downloadTemplate,
    exportProducts,
    importProducts,
    previewProducts,
    loading: importExportLoading,
  } = useProductsImportExport();

  const canCreate = hasPermission("product:create");
  const canUpdate = hasPermission("product:update");
  const canDelete = hasPermission("product:delete");
  const canTranslate = hasPermission("product:update");

  const { searchTerm, setSearchTerm, isPending } =
    useAdminTable("/admin/products");

  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as FilterType) || "all";

  const handleStatusChange = (status: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("filter");
    } else {
      params.set("filter", status);
    }
    params.set("page", "1"); // Reset to page 1
    router.push(`/admin/products?${params.toString()}`);
  };

  // Stats (based on current page)
  const recentCount = products.filter((p) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(p.createdAt) > weekAgo;
  }).length;
  const noCategoryCount = products.filter((p) => !p.category).length;
  const categoriesSet = new Set(
    products.map((p) => p.category?.id).filter(Boolean)
  );

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const openDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const openTranslate = (product: Product) => {
    setSelectedProduct(product);
    setTranslateDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("products.title")}
        subtitle={t("showing", {
          count: products.length,
          total: total,
          item: t("products.title").toLowerCase(),
        })}
        icon={<Package className="text-blue-500 fill-blue-500/10" />}
        stats={[
          { label: "total", value: total, variant: "default" },
          { label: "recent", value: recentCount, variant: "success" },
          { label: "categories", value: categoriesSet.size, variant: "info" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportProducts}
              disabled={importExportLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  disabled={importExportLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("import")}
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("products.createNew")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={filter}
          onValueChange={(v) => handleStatusChange(v as FilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <Box className="h-4 w-4" />
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {products.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Recent
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {recentCount}
              </Badge>
            </TabsTrigger>
            {noCategoryCount > 0 && (
              <TabsTrigger
                value="no-category"
                className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-amber-600 transition-all gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                No Category
                <Badge
                  variant="outline"
                  className="ml-1 h-5 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[10px] font-black"
                >
                  {noCategoryCount}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search", {
              item: t("products.title").toLowerCase(),
            })}
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

      {/* Table without virtual scrolling */}
      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("name")}
                </div>
              </TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("category")}
                </div>
              </TableHead>
              <TableHead>{t("brand")}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canTranslate || canUpdate || canDelete) && (
                <TableHead className="text-right w-[150px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canTranslate || canUpdate || canDelete ? 7 : 6}
                >
                  <AdminEmptyState
                    icon={Package}
                    title={t("noFound", {
                      item: t("products.title").toLowerCase(),
                    })}
                    description="No products found matching your criteria."
                    action={
                      canCreate ? (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Product
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <code className="text-xs text-muted-foreground">
                          ID: {product.id.slice(0, 8)}...
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                      {product.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        {product.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">
                        N/A
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.brand ? (
                      <span className="font-medium text-sm">
                        {product.brand.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">
                        N/A
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.deletedAt ? "destructive" : "success"}
                    >
                      {product.deletedAt ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(product.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  {(canTranslate || canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canTranslate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => openTranslate(product)}
                            title={t("products.translate")}
                          >
                            <Languages className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(product)}
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

      {/* Pagination with page numbers - only show when needed */}
      {products.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Dialogs */}
      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            key={selectedProduct.id}
            product={selectedProduct}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", { item: selectedProduct.name })}
            action={() => deleteProductAction(selectedProduct.id)}
            successMessage={t("products.successDelete")}
          />
          <ProductTranslationDialog
            product={selectedProduct}
            open={translateDialogOpen}
            onOpenChange={setTranslateDialogOpen}
          />
        </>
      )}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={importProducts}
        onPreview={previewProducts}
        onDownloadTemplate={downloadTemplate}
        title={`${t("import")} ${t("products.title")}`}
      />
    </div>
  );
}
