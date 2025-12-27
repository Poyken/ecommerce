"use client";
import { GlassButton } from "@/components/shared/glass-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * =====================================================================
 * PRODUCT VARIANT SELECTOR - Bộ chọn thuộc tính sản phẩm (Size, Color...)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SMART SELECTION LOGIC:
 * - Khi người dùng chọn một thuộc tính (ví dụ: Size L), hệ thống sẽ tự động tìm SKU phù hợp nhất.
 * - Nếu tổ hợp hiện tại không tồn tại (ví dụ: Màu Đỏ không có Size L), hệ thống sẽ tự động chuyển sang một SKU hợp lệ gần nhất thay vì để người dùng bị "kẹt".
 *
 * 2. CONTROLLED COMPONENT PATTERN:
 * - Component này GIẢM BỚT trách nhiệm: Không còn tự gọi API Add to cart nữa.
 * - Thay vào đó, nó nhận prop `onAddToCart` từ component cha (`ProductDetailClient`).
 * - Điều này giúp logic sạch hơn (Single Responsibility Principle).
 *
 * 3. REACTION CONTROL:
 * - Sử dụng `useRef` (`lastNotifiedSkuId`) để tránh việc bắn event `onSkuChange` liên tục gây ra vòng lặp render vô tận.
 * =====================================================================
 */

interface ProductVariantSelectorProps {
  options: ProductOption[];
  skus: Sku[];
  selectedSkuId?: string | null;
  onSkuChange?: (sku: Sku | null) => void;
  onImageChange?: (imageUrl: string) => void;
  // New Props
  onAddToCart?: () => void;
  isAdding?: boolean;
}

export function ProductVariantSelector({
  options,
  skus,
  selectedSkuId,
  onSkuChange,
  onImageChange,
  onAddToCart,
  isAdding = false,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Ref to track last notified SKU ID to prevent infinite loops (reaction control)
  const lastNotifiedSkuId = useRef<string | undefined>(undefined);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Sync state FROM Parent's selectedSkuId (Unidirectional Flow)
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedOptions(newSelectedOptions);
      }
    }
  }, [selectedSkuId, skus]);

  // Initialize from "skuId" ONLY (Initial Load)
  useEffect(() => {
    if (Object.keys(selectedOptions).length > 0) return;

    const newSelectedOptions: Record<string, string> = {};

    // 1. Try to load from URL skuId
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

    // 2. If valid options found from SKU, use them.
    if (Object.keys(newSelectedOptions).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOptions(newSelectedOptions);
      return;
    }

    // 3. Fallback: Default selection logic (Auto-select first available)
    const currentSelectedCount = Object.keys(newSelectedOptions).length;
    if (
      currentSelectedCount < options.length &&
      Object.keys(selectedOptions).length === 0
    ) {
      // Find compatible SKUs
      const availableSku = skus.find((s) => s.stock > 0) || skus[0];

      if (availableSku && availableSku.optionValues) {
        availableSku.optionValues.forEach((ov) => {
          if (ov?.optionValue)
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValue.id;
        });
        setSelectedOptions(newSelectedOptions);
      }
    }
  }, [searchParams, skus, options, selectedOptions]); // Keep this for initial hydration from server URL

  /*
   * SMART SELECTION LOGIC
   */
  const handleSelect = (optionId: string, valueId: string) => {
    // 1. Prepare optimistic next options
    const nextOptions = { ...selectedOptions, [optionId]: valueId };

    // 2. Try Exact Match
    let bestSku = skus.find((sku) => {
      if (!sku.optionValues || sku.optionValues.length === 0) return false;

      return sku.optionValues.every((ov) => {
        return nextOptions[ov.optionValue.optionId] === ov.optionValue.id;
      });
    });

    // 3. Smart Switch: If no exact match, find best compatible SKU
    if (!bestSku) {
      // Must have the NEW option value
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
        // Find the SKU that preserves the MOST existing selections
        bestSku = compatibleSkus.reduce((best, current) => {
          // Simplified matching logic for shared types
          // Count how many current selections match
          const countMatches = (sku: Sku) => {
            if (!sku.optionValues) return 0;
            return sku.optionValues.reduce((cnt, ov) => {
              if (ov.optionValue.optionId === optionId) return cnt; // ignore trigger
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
            // Tie-breaker: Prefer In-Stock
            if (current.stock > 0 && best.stock <= 0) return current;
          }
          return best;
        }, compatibleSkus[0]);
      }
    }

    // 4. Update state if valid
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
                selectedSku.stock > 0 ? "bg-success" : "bg-destructive"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                selectedSku.stock > 0 ? "text-success" : "text-destructive"
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
                        "opacity-50 cursor-not-allowed border-destructive/30 text-destructive"
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
        <GlassButton
          className="flex-1 w-full border-primary text-primary hover:bg-primary/5"
          variant="outline"
          size="lg"
          onClick={() => {
            if (onAddToCart) {
              onAddToCart();
              // We let the parent handle the flow, but Buy Now usually implies immediate redirect?
              // For now, let's assume onAddToCart handles it, or we can chain it if we returned a promise.
              // Since onAddToCart is void here, let's just call it.
              // Or if we want strict Buy Now flow:
              setTimeout(() => router.push("/cart"), 500);
            }
          }}
          disabled={!selectedSku || isOutOfStock}
        >
          Buy Now
        </GlassButton>
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
