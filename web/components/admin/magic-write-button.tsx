"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/shared/use-toast";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

interface MagicWriteResult {
  description: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  hashtags: string[];
}

interface MagicWriteButtonProps {
  productName: string;
  category?: string;
  brand?: string;
  onApply?: (result: MagicWriteResult) => void;
}

async function generateMagicContent(
  productName: string,
  features: string[],
  category?: string,
  brand?: string
): Promise<MagicWriteResult> {
  const res = await fetch("/api/v1/ai-automation/magic-write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productName, features, category, brand }),
  });
  const data = await res.json();
  if (!data.success) throw new Error("Failed to generate content");
  return data.data;
}

export function MagicWriteButton({
  productName,
  category,
  brand,
  onApply,
}: MagicWriteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState("");
  const [result, setResult] = useState<MagicWriteResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm trước",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const featuresList = features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const res = await generateMagicContent(
        productName,
        featuresList,
        category,
        brand
      );
      setResult(res);
      toast({
        title: "✨ Nội dung đã được tạo!",
        description: "Bạn có thể xem và áp dụng nội dung bên dưới",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo nội dung. Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApplyAll = () => {
    if (result && onApply) {
      onApply(result);
      toast({
        title: "Đã áp dụng",
        description: "Nội dung đã được điền vào form",
        variant: "success",
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300"
        >
          <Sparkles className="h-4 w-4" />
          Magic Write
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Magic Write - Tạo nội dung AI
          </DialogTitle>
          <DialogDescription>
            AI sẽ tạo mô tả sản phẩm chuẩn SEO dựa trên thông tin bạn cung cấp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Section */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <Label>Tên sản phẩm</Label>
              <Input value={productName} disabled className="bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Danh mục</Label>
                <Input
                  value={category || "Chưa chọn"}
                  disabled
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Thương hiệu</Label>
                <Input
                  value={brand || "Chưa chọn"}
                  disabled
                  className="bg-white"
                />
              </div>
            </div>
            <div>
              <Label>Tính năng/Đặc điểm (mỗi dòng 1 tính năng)</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-white text-sm resize-none"
                placeholder="VD:&#10;Cotton 100% cao cấp&#10;Thấm hút mồ hôi tốt&#10;Size M - XXL&#10;Có 5 màu"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-linear-to-r from-violet-500 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo nội dung...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo nội dung với AI
                </>
              )}
            </Button>
          </div>

          {/* Result Section */}
          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Kết quả</h3>
                <Button onClick={handleApplyAll} size="sm">
                  Áp dụng tất cả
                </Button>
              </div>

              {/* Meta Title */}
              <ResultField
                label="Meta Title"
                value={result.metaTitle}
                maxLength={60}
                copied={copied === "metaTitle"}
                onCopy={() => handleCopy(result.metaTitle, "metaTitle")}
              />

              {/* Meta Description */}
              <ResultField
                label="Meta Description"
                value={result.metaDescription}
                maxLength={155}
                copied={copied === "metaDescription"}
                onCopy={() =>
                  handleCopy(result.metaDescription, "metaDescription")
                }
              />

              {/* Short Description */}
              <ResultField
                label="Mô tả ngắn"
                value={result.shortDescription}
                copied={copied === "shortDescription"}
                onCopy={() =>
                  handleCopy(result.shortDescription, "shortDescription")
                }
              />

              {/* Full Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mô tả chi tiết</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(result.description, "description")
                    }
                  >
                    {copied === "description" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div
                  className="p-4 bg-slate-50 rounded-lg text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.description }}
                />
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer hover:bg-violet-100"
                      onClick={() => handleCopy(`#${tag}`, `tag-${i}`)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultField({
  label,
  value,
  maxLength,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  maxLength?: number;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          {maxLength && (
            <span
              className={`text-xs ${
                value.length > maxLength
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              {value.length}/{maxLength}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-sm">{value}</div>
    </div>
  );
}
