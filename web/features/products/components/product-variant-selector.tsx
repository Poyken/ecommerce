/**
 * =====================================================================
 * PRODUCT VARIANT SELECTOR - Bộ chọn thuộc tính sản phẩm (Size, Color...)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE & PROPS SYNC:
 * - Component này vừa quản lý State nội bộ (`selectedOptions`) để UI mượt.
 * - Vừa phải nghe Props `selectedSkuId` từ URL để đồng bộ khi user share link.
 *
 * 2. INTELLIGENT MATCHING (Thuật toán tìm SKU thông minh):
 * - Vấn đề: User chọn "Màu Đỏ", sau đó chọn "Size XL". Nhưng có thể không có "Đỏ XL".
 * - Giải pháp:
 *   A. Tìm `Perfect Match`: Có cả Đỏ và XL -> Chọn ngay.
 *   B. Nếu không có: Tìm `Best Fit`:
 *      - Giữ nguyên "Màu Đỏ" (ưu tiên cái user vừa click chọn sau cùng).
 *      - Tự động nhảy sang Size khác còn hàng (VD: Đỏ L).
 *   -> Giúp người dùng luôn chọn được sản phẩm có thể mua được, tránh "Dead ends" (Ngõ cụt).
 *
 * 3. VISUAL FEEDBACK:
 * - Badge "Outline": Chưa chọn.
 * - Badge "Solid" (Primary): Đang chọn.
 * - Badge "Opacity-50 + Line-through": Hết hàng hoặc không tồn tại.
 * =====================================================================
 */

"use client";
import { GlassButton } from "@/components/shared/glass-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface ProductVariantSelectorProps {
  options: ProductOption[]; // Danh sách các Option (Màu, Size)
  skus: Sku[]; // Danh sách các biến thể thực tế (SKU)
  selectedSkuId?: string | null;
  onSkuChange?: (sku: Sku | null) => void;
  onImageChange?: (imageUrl: string) => void;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  onConfirm?: () => void; // Generic alternative to onAddToCart

  isAdding?: boolean;
  showBuyNow?: boolean;
  confirmLabel?: string; // e.g., "Add to Cart", "Update Cart"
}

export function ProductVariantSelector({
  options,
  skus,
  selectedSkuId,
  onSkuChange,
  onImageChange,
  onAddToCart,
  onBuyNow,
  onConfirm,
  isAdding = false,
  showBuyNow = true,
  confirmLabel,
}: ProductVariantSelectorProps) {
  // State lưu trữ các lựa chọn của user.
  // Format: { [OptionID]: ValueID }
  // Ví dụ: { "opt_color": "val_red", "opt_size": "val_m" }
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const lastNotifiedSkuId = useRef<string | undefined>(undefined);
  const isInitialized = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. SYNC TỪ PROPS: Khi selectedSkuId thay đổi từ bên ngoài (VD: từ URL ban đầu)
  // -> Cập nhật state selectedOptions
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

  // 2. AUTO-SELECT DEFAULT: Tự động chọn SKU đầu tiên còn hàng khi mới vào
  useEffect(() => {
    // Skip if already initialized or selectedSkuId from props is being used
    if (isInitialized.current || selectedSkuId) return;
    // Nếu đã có lựa chọn thì thôi
    if (Object.keys(selectedOptions).length > 0) return;

    const newSelectedOptions: Record<string, string> = {};
    const skuIdFromUrl = searchParams.get("skuId");

    // Case A: URL có skuId -> Ưu tiên dùng
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
      isInitialized.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOptions(newSelectedOptions);
      // Notify initial selection
      if (options.length > 0) {
        const initialSku = skus.find((sku) => {
          if (!sku.optionValues) return false;
          return sku.optionValues.every((ov) => {
            return (
              newSelectedOptions[ov.optionValue.optionId] === ov.optionValue.id
            );
          });
        });
        if (initialSku && initialSku.id !== lastNotifiedSkuId.current) {
          lastNotifiedSkuId.current = initialSku.id;
          onSkuChange?.(initialSku);
        }
      }
      return;
    }

    // Case B: URL không có -> Chọn SKU đầu tiên còn hàng (Available Stock)
    const availableSku = skus.find((s) => s.stock > 0) || skus[0];
    if (availableSku) {
      if (options.length > 0 && availableSku.optionValues) {
        availableSku.optionValues.forEach((ov) => {
          if (ov?.optionValue)
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValue.id;
        });
      }

      isInitialized.current = true;
      if (Object.keys(newSelectedOptions).length > 0) {
        setSelectedOptions(newSelectedOptions);
      }

      // Notify auto-selection (Case for both options > 0 and options === 0)
      if (availableSku.id !== lastNotifiedSkuId.current) {
        lastNotifiedSkuId.current = availableSku.id;
        onSkuChange?.(availableSku);
      }
    }
  }, [
    searchParams,
    skus,
    options,
    selectedSkuId,
    selectedOptions,
    onSkuChange,
  ]);

  // 3. CORE LOGIC: XỬ LÝ KHI USER CLICK CHỌN OPTION
  const handleSelect = (optionId: string, valueId: string) => {
    // Tạo object options dự kiến mới
    const nextOptions = { ...selectedOptions, [optionId]: valueId };

    // Tìm SKU khớp hoàn toàn (Perfect Match)
    let bestSku = skus.find((sku) => {
      if (!sku.optionValues || sku.optionValues.length === 0) return false;
      return sku.optionValues.every((ov) => {
        return nextOptions[ov.optionValue.optionId] === ov.optionValue.id;
      });
    });

    // Nếu không tìm thấy Perfect Match (Do kết hợp này không tồn tại)
    // -> Tìm SKU "Gần đúng nhất" (Best Fit)
    if (!bestSku) {
      // Lọc các SKU có chứa option vừa chọn
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
        // Thuật toán chấm điểm để tìm SKU tốt nhất trong đám compatible
        bestSku = compatibleSkus.reduce((best, current) => {
          const countMatches = (sku: Sku) => {
            if (!sku.optionValues) return 0;
            return sku.optionValues.reduce((cnt, ov) => {
              // Bỏ qua option đang chọn (vì cả 2 đều có rồi)
              if (ov.optionValue.optionId === optionId) return cnt;
              // +1 điểm nếu khớp với các option khác đang được chọn trước đó
              if (
                selectedOptions[ov.optionValue.optionId] === ov.optionValue.id
              )
                return cnt + 1;
              return cnt;
            }, 0);
          };

          const currentMatches = countMatches(current);
          const bestMatches = countMatches(best);

          // Ưu tiên SKU trùng nhiều option cũ nhất
          if (currentMatches > bestMatches) return current;
          // Nếu trùng bằng nhau -> Ưu tiên SKU còn hàng
          if (currentMatches === bestMatches) {
            if (current.stock > 0 && best.stock <= 0) return current;
          }
          return best;
        }, compatibleSkus[0]);
      }
    }

    // Nếu tìm được SKU phù hợp -> Cập nhật UI
    if (bestSku && bestSku.optionValues && bestSku.optionValues.length > 0) {
      const newResolvedOptions: Record<string, string> = {};

      // Fill lại toàn bộ option từ SKU tìm được (Reset các option không hợp lệ)
      bestSku.optionValues.forEach((ov) => {
        newResolvedOptions[ov.optionValue.optionId] = ov.optionValue.id;
      });

      setSelectedOptions(newResolvedOptions);

      // Đổi ảnh sản phẩm nếu SKU này có ảnh riêng
      if (bestSku.imageUrl && onImageChange) {
        onImageChange(bestSku.imageUrl);
      }

      // Notify parent immediately (No extra render cycle)
      if (bestSku.id !== lastNotifiedSkuId.current) {
        lastNotifiedSkuId.current = bestSku.id;
        onSkuChange?.(bestSku);
      }
    }
  };

  // 4. MEMOIZED SKU: Tính toán SKU hiện tại dựa trên options
  const selectedSku = useMemo(() => {
    // Chưa chọn đủ các option bắt buộc -> Chưa có SKU
    if (Object.keys(selectedOptions).length < options.length) return null;

    return skus.find((sku) => {
      if (!sku.optionValues) return false;
      return sku.optionValues.every((ov) => {
        return selectedOptions[ov.optionValue.optionId] === ov.optionValue.id;
      });
    });
  }, [selectedOptions, skus, options]);

  // Helper: Kiểm tra trạng thái của một option value (Có hàng/Hết hàng/Không khả dụng)
  const getOptionValueStatus = (optionId: string, valueId: string) => {
    // Tìm tất cả SKU có chứa value này
    const relevantSkus = skus.filter((sku) => {
      return sku.optionValues?.some((ov) => ov.optionValue.id === valueId);
    });

    if (relevantSkus.length === 0) return "unavailable"; // Không tồn tại biến thể này
    if (relevantSkus.every((s) => s.stock <= 0)) return "out_of_stock"; // Tồn tại nhưng hết hàng

    return "available";
  };

  const price = selectedSku ? selectedSku.price : skus[0]?.price;
  const isOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  return (
    <div className="space-y-4">
      {/* --- PRICE & STOCK --- */}
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

      {/* --- OPTIONS LIST (Size, Color...) --- */}
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
                      // Selected style
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        : "border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-foreground dark:text-white hover:border-primary/50 hover:text-primary",
                      // Disabled/Unavailable styles
                      status === "unavailable" &&
                        "opacity-30 cursor-not-allowed bg-transparent text-muted-foreground line-through decoration-white/20",
                      status === "out_of_stock" &&
                        "opacity-50 cursor-not-allowed border-red-500/30 text-red-400"
                    )}
                    onClick={() => {
                      // Logic chọn thông minh ở đây
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

      {/* --- ACTION BUTTONS --- */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
        <GlassButton
          id="add-to-cart-btn"
          className="flex-1 w-full"
          variant="primary"
          size="lg"
          disabled={!selectedSku || isOutOfStock || isAdding}
          onClick={onConfirm || onAddToCart}
        >
          {isAdding
            ? "Processing..."
            : isOutOfStock
            ? "Out of Stock"
            : confirmLabel || "Add to Cart"}
        </GlassButton>
        {showBuyNow && onAddToCart && (
          <GlassButton
            className="flex-1 w-full border-primary text-primary hover:bg-primary/5"
            variant="outline"
            size="lg"
            onClick={() => {
              if (onBuyNow) {
                onBuyNow();
              } else if (onAddToCart) {
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
