"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { generateProductContentAction } from "@/features/admin/actions";

/**
 * =====================================================================
 * MAGIC WRITE BUTTON - Nút tạo nội dung AI cho sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AI CONTENT GENERATION:
 * - Nút này gọi API AI để tự động tạo description, meta title, meta description.
 * - Giúp Admin tiết kiệm thời gian nhập liệu thủ công.
 *
 * 2. PROPS:
 * - productName: Tên sản phẩm để AI hiểu context
 * - category: Danh mục sản phẩm
 * - brand: Thương hiệu (optional)
 * - onApply: Callback khi có kết quả từ AI
 * =====================================================================
 */

interface MagicWriteResult {
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
}

interface MagicWriteButtonProps {
  productName: string;
  category?: string;
  brand?: string;
  onApply: (result: MagicWriteResult) => void;
  disabled?: boolean;
}

export function MagicWriteButton({
  productName,
  category,
  brand,
  onApply,
  disabled = false,
}: MagicWriteButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Please enter product name first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateProductContentAction({
        productName,
        categoryName: category || "General",
        brandName: brand,
      });

      if (result.success && result.data) {
        onApply(result.data);
        toast({
          variant: "success",
          title: "AI Content Generated",
          description: "Content has been automatically filled in!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate content",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !productName.trim()}
      className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AI Write
        </>
      )}
    </Button>
  );
}
