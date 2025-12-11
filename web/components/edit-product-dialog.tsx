"use client";

import { getBrandsAction, getCategoriesAction, updateProductAction } from "@/actions/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface EditProductDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    categoryId: product.categoryId,
    brandId: product.brandId,
  });

  // Khởi tạo tùy chọn từ sản phẩm
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([]);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [brandsRes, categoriesRes] = await Promise.all([
          getBrandsAction(),
          getCategoriesAction(),
        ]);
        if (brandsRes.data) setBrands(brandsRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
      };
      fetchData();
      
      // Đặt lại dữ liệu form
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        categoryId: product.categoryId,
        brandId: product.brandId,
      });

      // Đặt lại tùy chọn từ sản phẩm
      if (product.options && Array.isArray(product.options)) {
          const formattedOptions = product.options.map((opt: any) => ({
              name: opt.name,
              values: opt.values ? opt.values.map((v: any) => v.value) : []
          }));
          setOptions(formattedOptions);
      } else {
          setOptions([]);
      }
    }
  }, [open, product]);

  const handleAddOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionNameChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].name = value;
    setOptions(newOptions);
  };

  const handleAddValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;
    const newOptions = [...options];
    newOptions[optionIndex].values.push(value);
    setOptions(newOptions);
  };

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.splice(valueIndex, 1);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Lọc bỏ các tùy chọn trống
    const validOptions = options.filter(
      (opt) => opt.name.trim() !== "" && opt.values.length > 0
    );

    const payload = {
        ...formData,
        options: validOptions
    };

    const result = await updateProductAction(product.id, payload);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) =>
                  setFormData({ ...formData, brandId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Options (Variants)</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                Add Option
              </Button>
            </div>
            
            {options.map((option, optIndex) => (
              <div key={optIndex} className="p-4 border rounded-md space-y-3 bg-gray-50">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label>Option Name</Label>
                    <Input
                      value={option.name}
                      onChange={(e) => handleOptionNameChange(optIndex, e.target.value)}
                      placeholder="e.g. Color, Size"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveOption(optIndex)}
                  >
                    X
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Values</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {option.values.map((val, valIndex) => (
                      <div key={valIndex} className="bg-white border px-2 py-1 rounded text-sm flex items-center gap-2">
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(optIndex, valIndex)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type value and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(optIndex, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
