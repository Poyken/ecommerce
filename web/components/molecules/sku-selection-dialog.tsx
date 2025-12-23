/**
 * =====================================================================
 * SKU SELECTION DIALOG - Hộp thoại chọn biến thể nhanh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUICK VIEW / QUICK ADD:
 * - Cho phép người dùng chọn Size/Color ngay từ trang danh sách sản phẩm mà không cần vào trang chi tiết.
 * - Tăng tỷ lệ chuyển đổi bằng cách giảm bớt các bước trung gian.
 *
 * 2. COMPONENT COMPOSITION:
 * - Tái sử dụng logic hiển thị ảnh, giá và các nút bấm từ các component nhỏ hơn.
 * =====================================================================
 */

"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/atoms/dialog";
import { GlassButton } from "@/components/atoms/glass-button";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface SkuSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  skus: Sku[];
  options?: ProductOption[];
  onConfirm: (skuId: string) => void;
  isAdding?: boolean;
  category?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
}

export function SkuSelectionDialog({
  isOpen,
  onOpenChange,
  productName,
  skus,
  options = [],
  onConfirm,
  isAdding,
  category,
  brand,
  rating = 5,
  reviewCount = 0,
}: SkuSelectionDialogProps) {
  const t = useTranslations("productCard");
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Initialize selected options from the first available SKU
  useEffect(() => {
    if (isOpen && options.length > 0) {
      const availableSku = skus.find((s) => s.stock > 0) || skus[0];
      if (availableSku && availableSku.optionValues) {
        const initialOptions: Record<string, string> = {};
        availableSku.optionValues.forEach((ov) => {
          initialOptions[ov.optionValue.optionId] = ov.optionValue.id;
        });
        setSelectedOptions(initialOptions);
      }
    }
  }, [isOpen, options, skus]);

  const selectedSku = useMemo(() => {
    if (options.length > 0) {
      return skus.find((sku) => {
        if (!sku.optionValues) return false;
        return sku.optionValues.every(
          (ov) => selectedOptions[ov.optionValue.optionId] === ov.optionValue.id
        );
      });
    }
    return skus[0];
  }, [selectedOptions, skus, options]);

  const handleSelect = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const getOptionValueStatus = (optionId: string, valueId: string) => {
    const relevantSkus = skus.filter((sku) => {
      return sku.optionValues?.some((ov) => ov.optionValue.id === valueId);
    });

    if (relevantSkus.length === 0) return "unavailable";
    if (relevantSkus.every((s) => s.stock <= 0)) return "out_of_stock";

    return "available";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-white dark:bg-neutral-950 border-none shadow-2xl rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Left: Product Image Preview */}
          <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-neutral-50 dark:bg-neutral-900/50 p-8 flex items-center justify-center">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={selectedSku?.imageUrl || skus[0]?.imageUrl || ""}
                alt={productName}
                fill
                className="object-cover transition-all duration-700 ease-out hover:scale-110"
              />
            </div>
            {/* Close button for mobile if needed, but DialogContent has one */}
          </div>

          {/* Right: Selection Info */}
          <div className="flex-1 p-8 md:p-10 flex flex-col">
            <div className="flex-1">
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span className="text-primary">{brand || "LUXE"}</span>
                  <span className="text-neutral-300 dark:text-neutral-700">
                    |
                  </span>
                  <span className="text-neutral-500">
                    {category || "PORTABLE"}
                  </span>
                </div>
                <DialogTitle className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  {productName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          "w-4 h-4 fill-current",
                          i >= Math.floor(rating) &&
                            "text-neutral-200 dark:text-neutral-800"
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-neutral-500">
                    ({reviewCount} {t("reviews")})
                  </span>
                </div>
              </div>

              <div className="space-y-8 mt-8">
                {/* Price & Stock */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(
                        Number(
                          selectedSku?.salePrice || selectedSku?.price || 0
                        )
                      )}
                    </span>
                    {selectedSku?.salePrice &&
                      selectedSku.price &&
                      Number(selectedSku.price) >
                        Number(selectedSku.salePrice) && (
                        <span className="text-xl text-neutral-400 line-through">
                          {formatCurrency(Number(selectedSku.price))}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        selectedSku?.stock && selectedSku.stock > 0
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        selectedSku?.stock && selectedSku.stock > 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      {selectedSku?.stock && selectedSku.stock > 0
                        ? t("inStock")
                        : t("outOfStock")}
                    </span>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-6">
                  {options.length > 0 ? (
                    options.map((option) => (
                      <div key={option.id} className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                          {option.name}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {option.values.map((value) => {
                            const status = getOptionValueStatus(
                              option.id,
                              value.id
                            );
                            const isSelected =
                              selectedOptions[option.id] === value.id;

                            return (
                              <button
                                key={value.id}
                                onClick={() =>
                                  status !== "unavailable" &&
                                  handleSelect(option.id, value.id)
                                }
                                disabled={status === "unavailable"}
                                className={cn(
                                  "relative min-w-[80px] px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 border-2",
                                  isSelected
                                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-xl shadow-black/10 dark:shadow-white/5"
                                    : "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600",
                                  status === "out_of_stock" &&
                                    !isSelected &&
                                    "opacity-50 border-dashed",
                                  status === "unavailable" &&
                                    "opacity-20 cursor-not-allowed"
                                )}
                              >
                                {value.value}
                                {status === "out_of_stock" && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-950" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {skus.map((sku) => (
                        <button
                          key={sku.id}
                          disabled={sku.stock <= 0}
                          onClick={() => {
                            const newOptions: Record<string, string> = {};
                            sku.optionValues?.forEach((ov) => {
                              newOptions[ov.optionValue.optionId] =
                                ov.optionValue.id;
                            });
                            setSelectedOptions(newOptions);
                          }}
                          className={cn(
                            "flex justify-between items-center p-5 rounded-2xl border-2 transition-all duration-300",
                            selectedSku?.id === sku.id
                              ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-lg"
                              : "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-600",
                            sku.stock <= 0 && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <span className="font-bold">
                            {sku.optionValues
                              ?.map((ov) => ov.optionValue.value)
                              .join(" / ") || "Default"}
                          </span>
                          <span
                            className={cn(
                              "font-black",
                              selectedSku?.id === sku.id
                                ? "text-white dark:text-black"
                                : "text-primary"
                            )}
                          >
                            {formatCurrency(Number(sku.salePrice || sku.price))}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <GlassButton
                  className={cn(
                    "flex-1 h-14 rounded-2xl text-base font-bold transition-all duration-500",
                    selectedSku?.stock && selectedSku.stock > 0
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  )}
                  disabled={!selectedSku || selectedSku.stock <= 0 || isAdding}
                  onClick={() => selectedSku && onConfirm(selectedSku.id)}
                >
                  {isAdding
                    ? t("adding")
                    : selectedSku?.stock && selectedSku.stock > 0
                    ? t("addToCart")
                    : t("outOfStock")}
                </GlassButton>

                {selectedSku?.stock && selectedSku.stock > 0 && (
                  <button className="flex-1 h-14 rounded-2xl text-base font-bold border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-300">
                    {t("buyNow")}
                  </button>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-center gap-3 text-neutral-500">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("authenticityVerified")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-neutral-500">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("freeGlobalShipping")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
