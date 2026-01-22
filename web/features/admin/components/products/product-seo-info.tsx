 
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductSeoInfoProps {
  formData: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
  setFormData: (data: any) => void;
  isPending: boolean;
}

export function ProductSeoInfo({
  formData,
  setFormData,
  isPending,
}: ProductSeoInfoProps) {
  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-sm text-gray-900">
        SEO Optimization
      </h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Meta Title</Label>
          <Input
            value={formData.metaTitle}
            onChange={(e) =>
              setFormData({ ...formData, metaTitle: e.target.value })
            }
            placeholder="SEO Title (60 chars)"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meta Description</Label>
          <Textarea
            value={formData.metaDescription}
            onChange={(e) =>
              setFormData({ ...formData, metaDescription: e.target.value })
            }
            placeholder="SEO Description (160 chars)"
            disabled={isPending}
            className="h-20 min-h-[80px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meta Keywords</Label>
          <Input
            value={formData.metaKeywords}
            onChange={(e) =>
              setFormData({ ...formData, metaKeywords: e.target.value })
            }
            placeholder="keyword1, keyword2, keyword3"
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
