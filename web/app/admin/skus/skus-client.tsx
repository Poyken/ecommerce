"use client";

import { DeleteSkuDialog } from "@/components/delete-sku-dialog";
import { EditSkuDialog } from "@/components/edit-sku-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SkusClient({
  skus,
  total,
  page,
  limit,
}: {
  skus: any[];
  total: number;
  page: number;
  limit: number;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/skus?${params.toString()}`);
  };

  const openEdit = (sku: any) => {
    setSelectedSku(sku);
    setEditDialogOpen(true);
  };

  const openDelete = (sku: any) => {
    setSelectedSku(sku);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SKUs Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {skus.length} of {total} SKUs
          </p>
        </div>
        {/* Tạo SKU hiện được tự động tạo thông qua việc tạo Sản phẩm */}
        <div className="flex gap-2">
          <Select
            defaultValue={searchParams.get("status") || "ALL"}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value === "ALL") {
                params.delete("status");
              } else {
                params.set("status", value);
              }
              params.set("page", "1"); // Đặt lại về trang 1
              router.push(`/admin/skus?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="INACTIVE">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All SKUs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus && skus.length > 0 ? (
                skus.map((sku: any) => (
                  <TableRow key={sku.id} className={sku.status === 'INACTIVE' ? 'opacity-60 bg-gray-50' : ''}>
                    <TableCell className="font-medium font-mono">
                      {sku.skuCode}
                    </TableCell>
                    <TableCell>{sku.product?.name || "N/A"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(sku.price)}
                    </TableCell>
                    <TableCell>{sku.stock}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sku.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sku.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(sku)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDelete(sku)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No SKUs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={!hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSku && (
        <>
          <EditSkuDialog
            sku={selectedSku}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteSkuDialog
            skuId={selectedSku.id}
            skuCode={selectedSku.skuCode}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
