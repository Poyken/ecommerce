/**
 * =====================================================================
 * PRODUCT VARIANT SELECTOR - Bộ chọn thuộc tính sản phẩm (Size, Color...)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPLEX STATE MANAGEMENT:
 * - Quản lý việc chọn các option (Size: M, Color: Red) và tìm ra SKU tương ứng.
 * - Nếu một kết hợp không tồn tại, nó sẽ cố gắng tìm SKU "gần giống nhất" hoặc còn hàng.
 *
 * 2. URL SYNC:
 * - Cập nhật `skuId` lên URL để khi user reload trang hoặc chia sẻ link, biến thể đã chọn vẫn được giữ nguyên.
 *
 * 3. DYNAMIC PRICING:
 * - Giá sản phẩm sẽ thay đổi ngay lập tức khi user chọn các biến thể khác nhau.
 * =====================================================================
 */

"use client";
import { Badge } from "@/components/atoms/badge";
import { GlassButton } from "@/components/atoms/glass-button";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * =====================================================================
 * PRODUCT VARIANT SELECTOR - Bộ chọn thuộc tính sản phẩm (Size, Color...)
 * =====================================================================
 */

interface ProductVariantSelectorProps {
  options: ProductOption[];
  skus: Sku[];
  isLoggedIn?: boolean;
  selectedSkuId?: string | null;
  onSkuChange?: (sku: Sku | null) => void;
  onImageChange?: (imageUrl: string) => void;
  onAddToCart?: () => void;
  isAdding?: boolean;
  showBuyNow?: boolean;
}

export function ProductVariantSelector({
  options,
  skus,
  isLoggedIn = false,
  selectedSkuId,
  onSkuChange,
  onImageChange,
  onAddToCart,
  isAdding = false,
  showBuyNow = true,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const lastNotifiedSkuId = useRef<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (selectedSkuId) {
      const targetSku = skus.find((s) => s.id === selectedSkuId);
      if (targetSku && targetSku.optionValues) {
        const newSelectedOptions: Record<string, string> = {};
        targetSku.optionValues.forEach((ov) => {
          if (ov?.optionValue) {
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValue.id;
          }
        });
        setSelectedOptions(newSelectedOptions);
      }
    }
  }, [selectedSkuId, skus]);

  useEffect(() => {
    if (Object.keys(selectedOptions).length > 0) return;

    const newSelectedOptions: Record<string, string> = {};
    const skuIdFromUrl = searchParams.get("skuId");

    if (skuIdFromUrl) {
      const targetSku = skus.find((s) => s.id === skuIdFromUrl);
      if (targetSku && targetSku.optionValues) {
        targetSku.optionValues.forEach((ov) => {
          if (ov?.optionValue)
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValue.id;
        });
      }
    }

    if (Object.keys(newSelectedOptions).length > 0) {
      setSelectedOptions(newSelectedOptions);
      return;
    }

    if (options.length > 0) {
      const availableSku = skus.find((s) => s.stock > 0) || skus[0];
      if (availableSku && availableSku.optionValues) {
        availableSku.optionValues.forEach((ov) => {
          if (ov?.optionValue)
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValue.id;
        });
        setSelectedOptions(newSelectedOptions);
      }
    }
  }, [searchParams, skus, options]);

  const handleSelect = (optionId: string, valueId: string) => {
    const nextOptions = { ...selectedOptions, [optionId]: valueId };
    let bestSku = skus.find((sku) => {
      if (!sku.optionValues || sku.optionValues.length === 0) return false;
      return sku.optionValues.every((ov) => {
        return nextOptions[ov.optionValue.optionId] === ov.optionValue.id;
      });
    });

    if (!bestSku) {
      const compatibleSkus = skus.filter(
        (s) =>
          s.optionValues &&
          s.optionValues.some(
            (ov) =>
              ov.optionValue.optionId === optionId &&
              ov.optionValue.id === valueId
          )
      );

      if (compatibleSkus.length > 0) {
        bestSku = compatibleSkus.reduce((best, current) => {
          const countMatches = (sku: Sku) => {
            if (!sku.optionValues) return 0;
            return sku.optionValues.reduce((cnt, ov) => {
              if (ov.optionValue.optionId === optionId) return cnt;
              if (
                selectedOptions[ov.optionValue.optionId] === ov.optionValue.id
              )
                return cnt + 1;
              return cnt;
            }, 0);
          };

          const currentMatches = countMatches(current);
          const bestMatches = countMatches(best);

          if (currentMatches > bestMatches) return current;
          if (currentMatches === bestMatches) {
            if (current.stock > 0 && best.stock <= 0) return current;
          }
          return best;
        }, compatibleSkus[0]);
      }
    }

    if (bestSku && bestSku.optionValues && bestSku.optionValues.length > 0) {
      const newResolvedOptions: Record<string, string> = {};
      bestSku.optionValues.forEach((ov) => {
        newResolvedOptions[ov.optionValue.optionId] = ov.optionValue.id;
      });

      setSelectedOptions(newResolvedOptions);

      if (bestSku.imageUrl && onImageChange) {
        onImageChange(bestSku.imageUrl);
      }
    }
  };

  const selectedSku = useMemo(() => {
    if (Object.keys(selectedOptions).length < options.length) return null;

    return skus.find((sku) => {
      if (!sku.optionValues) return false;
      return sku.optionValues.every((ov) => {
        return selectedOptions[ov.optionValue.optionId] === ov.optionValue.id;
      });
    });
  }, [selectedOptions, skus, options]);

  useEffect(() => {
    const currentId = selectedSku?.id;
    if (currentId !== lastNotifiedSkuId.current) {
      lastNotifiedSkuId.current = currentId;
      if (onSkuChange) {
        onSkuChange(selectedSku || null);
      }
    }
  }, [selectedSku, onSkuChange]);

  const getOptionValueStatus = (optionId: string, valueId: string) => {
    const relevantSkus = skus.filter((sku) => {
      return sku.optionValues?.some((ov) => ov.optionValue.id === valueId);
    });

    if (relevantSkus.length === 0) return "unavailable";
    if (relevantSkus.every((s) => s.stock <= 0)) return "out_of_stock";

    return "available";
  };

  const price = selectedSku ? selectedSku.price : skus[0]?.price;
  const isOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
          {formatCurrency(Number(price) || 0)}
        </h2>
        {selectedSku && (
          <div className="flex items-center gap-2 mt-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                selectedSku.stock > 0 ? "bg-emerald-500" : "bg-destructive"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                selectedSku.stock > 0 ? "text-emerald-600" : "text-destructive"
              )}
            >
              {selectedSku.stock > 0
                ? `Available: ${selectedSku.stock}`
                : "Out of Stock"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.id}>
            <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-muted-foreground/80">
              {option.name}
            </h3>
            <div className="flex flex-wrap gap-3">
              {option.values.map((value) => {
                const status = getOptionValueStatus(option.id, value.id);
                const isSelected = selectedOptions[option.id] === value.id;

                return (
                  <Badge
                    key={value.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-5 py-2.5 text-sm border transition-all duration-300 backdrop-blur-md",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        : "border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-foreground dark:text-white hover:border-primary/50 hover:text-primary",
                      status === "unavailable" &&
                        "opacity-30 cursor-not-allowed bg-transparent text-muted-foreground line-through decoration-white/20",
                      status === "out_of_stock" &&
                        "opacity-50 cursor-not-allowed border-red-500/30 text-red-400"
                    )}
                    onClick={() => {
                      handleSelect(option.id, value.id);
                    }}
                  >
                    {value.value}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
        <GlassButton
          id="add-to-cart-btn"
          className="flex-1 w-full"
          variant="primary"
          size="lg"
          disabled={!selectedSku || isOutOfStock || isAdding}
          onClick={onAddToCart}
        >
          {isAdding
            ? "Adding..."
            : isOutOfStock
            ? "Out of Stock"
            : "Add to Cart"}
        </GlassButton>
        {showBuyNow && (
          <GlassButton
            className="flex-1 w-full border-primary text-primary hover:bg-primary/5"
            variant="outline"
            size="lg"
            onClick={() => {
              if (onAddToCart) {
                onAddToCart();
                setTimeout(() => router.push("/cart"), 500);
              }
            }}
            disabled={!selectedSku || isOutOfStock}
          >
            Buy Now
          </GlassButton>
        )}
      </div>

      {selectedSku && isOutOfStock && (
        <p className="text-destructive text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
          Item is currently out of stock
        </p>
      )}
    </div>
  );
}
