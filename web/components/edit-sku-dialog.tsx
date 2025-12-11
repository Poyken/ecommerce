"use client";

import { updateSkuAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface EditSkuDialogProps {
  sku: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSkuDialog({ sku, open, onOpenChange }: EditSkuDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    skuCode: sku.skuCode,
    price: sku.price,
    stock: sku.stock,
  });

  // Update form data when sku prop changes
  useEffect(() => {
    setFormData({
      skuCode: sku.skuCode,
      price: sku.price,
      stock: sku.stock,
    });
  }, [sku]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = {
      // skuCode is read-only and should not be updated here to avoid conflicts
      price: Number(formData.price),
      stock: Number(formData.stock),
    };

    const result = await updateSkuAction(sku.id, data);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit SKU</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-skuCode">SKU Code</Label>
            <Input
              id="edit-skuCode"
              value={formData.skuCode}
              readOnly
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
