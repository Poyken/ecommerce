"use client";

import { deleteProductAction } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
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
import { CreateProductDialog } from "@/components/organisms/admin/create-product-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditProductDialog } from "@/components/organisms/admin/edit-product-dialog";
import { ProductTranslationDialog } from "@/components/organisms/admin/product-translation-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/auth-provider";
import { Product } from "@/types/models";
import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
      params.set("page", "1");
      router.push(`/admin/products?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  // Redirect to previous page if current page is empty and not the first page
  useEffect(() => {
    if (products.length === 0 && page > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", (page - 1).toString());
      router.push(`/admin/products?${params.toString()}`);
    }
  }, [products.length, page, router, searchParams]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("products.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("showing", {
              count: products.length,
              total: total,
              item: t("products.title").toLowerCase(),
            })}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t("products.createNew")}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder={t("search", { item: t("products.title").toLowerCase() })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("all", { item: t("products.title") })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("name")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("category")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("brand")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("created")}
              </TableHead>
              {(canTranslate || canUpdate || canDelete) && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.brand?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  {(canTranslate || canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canTranslate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTranslate(product)}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                            title={t("products.translate")}
                          >
                            <Languages className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(product)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          >
                            {t("edit")}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(product)}
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
                  colSpan={canTranslate || canUpdate || canDelete ? 5 : 4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noFound", { item: t("products.title").toLowerCase() })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              {t("pagination.page", { current: page, total: totalPages })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={!hasPrevPage}
                className="border-white/10 hover:bg-white/5"
              >
                {t("pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={!hasNextPage}
                className="border-white/10 hover:bg-white/5"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
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
