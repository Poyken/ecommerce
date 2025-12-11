"use client";

import { getOrderDetailsAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      setError(null);
      getOrderDetailsAction(orderId).then((result) => {
        if (result.data) {
          setOrder(result.data);
        } else {
          setError(result.error || "Failed to load order");
        }
        setLoading(false);
      });
    }
  }, [open, orderId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="py-8 text-center">Loading...</div>}

          {error && (
            <div className="py-8 text-center text-red-600">{error}</div>
          )}

          {order && !loading && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Order Info
                  </h3>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="font-medium text-gray-500">ID:</span>
                    <span className="font-mono">{order.id}</span>

                    <span className="font-medium text-gray-500">Date:</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>

                    <span className="font-medium text-gray-500">Status:</span>
                    <span>
                      <Badge>{order.status}</Badge>
                    </span>

                    <span className="font-medium text-gray-500">Total:</span>
                    <span className="font-semibold text-lg">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Customer Info
                  </h3>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="font-medium text-gray-500">Name:</span>
                    <span>{order.recipientName || order.user?.firstName}</span>

                    <span className="font-medium text-gray-500">Email:</span>
                    <span>{order.user?.email}</span>

                    <span className="font-medium text-gray-500">Phone:</span>
                    <span>{order.phoneNumber}</span>

                    <span className="font-medium text-gray-500">Address:</span>
                    <span>{order.shippingAddress}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.sku?.product?.name || "Unknown Product"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {item.sku?.skuCode}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.priceAtPurchase)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.priceAtPurchase * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t flex justify-end bg-gray-50">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
