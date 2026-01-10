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
 * - Stats header
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
    import("@/features/admin/components/products/product-translation-dialog").then(
      (mod) => mod.ProductTranslationDialog
    ),
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const canCreate = hasPermission("product:create");
  const canUpdate = hasPermission("product:update");
  const canDelete = hasPermission("product:delete");
  const canTranslate = hasPermission("product:update");

  const { searchTerm, setSearchTerm, isPending } =
    useAdminTable("/admin/products");

  const [filter, setFilter] = useState<FilterType>("all");

  const handleStatusChange = (status: FilterType) => {
    setFilter(status);
    // Note: This filter is currently client-side only based on current page data.
    // If you want server-side filtering, you should pass it to useAdminTable.
    // But since the original code was client-side, I'll keep it for now.
  };

  // Filter products (client-side for current page only)
  const filteredProducts = products.filter((product) => {
    if (filter === "all") return true;
    if (filter === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(product.createdAt) > weekAgo;
    }
    if (filter === "no-category") return !product.category;
    return true;
  });

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
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("products.title")}
        subtitle={t("showing", {
          count: products.length,
          total: total,
          item: t("products.title").toLowerCase(),
        })}
        icon={<Package className="h-5 w-5" />}
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
              onClick={() => alert("Export feature coming soon")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert("Import feature coming soon")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
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
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Box className="h-4 w-4" />
              All ({products.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recent ({recentCount})
            </TabsTrigger>
            {noCategoryCount > 0 && (
              <TabsTrigger value="no-category" className="gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                No Category ({noCategoryCount})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search", {
              item: t("products.title").toLowerCase(),
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table without virtual scrolling */}
      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[35%]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("name")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("category")}
                </div>
              </TableHead>
              <TableHead>{t("brand")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canTranslate || canUpdate || canDelete) && (
                <TableHead className="text-right w-[150px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canTranslate || canUpdate || canDelete ? 5 : 4}
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
              filteredProducts.map((product) => (
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
      {filteredProducts.length > 0 && total > limit && (
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
    </div>
  );
}
