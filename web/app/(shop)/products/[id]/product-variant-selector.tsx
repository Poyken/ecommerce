"use client";
import { addToCartAction } from "@/actions/cart";
import { Badge } from "@/components/ui/badge";
import { GlassButton } from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface OptionValue {
  id: string;
  value: string;
  imageUrl: string | null;
  optionId: string;
}

interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

interface Sku {
  id: string;
  skuCode: string;
  price: number;
  salePrice: number | null;
  stock: number;
  imageUrl: string | null;
  optionValues: {
    optionValueId: string;
    optionValue: OptionValue;
  }[];
}

interface ProductVariantSelectorProps {
  options: ProductOption[];
  skus: Sku[];
  isLoggedIn: boolean;
  onSkuChange?: (sku: Sku | null) => void;
}

export function ProductVariantSelector({
  options,
  skus,
  isLoggedIn,
  onSkuChange,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Khởi tạo lựa chọn mặc định từ URL hoặc mặc định
  useEffect(() => {
    const newSelectedOptions: Record<string, string> = {};

    options.forEach((opt) => {
      const valueIdFromUrl = searchParams.get(opt.name);
      if (valueIdFromUrl) {
        const isValid = opt.values.some((v) => v.id === valueIdFromUrl);
        if (isValid) {
          newSelectedOptions[opt.id] = valueIdFromUrl;
        }
      }
    });

    const currentSelectedCount = Object.keys(newSelectedOptions).length;
    if (currentSelectedCount < options.length) {
      const compatibleSkus = skus.filter((sku) => {
        return sku.optionValues.every((ov) => {
          const selectedValueId = newSelectedOptions[ov.optionValue.optionId];
          return !selectedValueId || selectedValueId === ov.optionValueId;
        });
      });

      const availableSku =
        compatibleSkus.find((s) => s.stock > 0) || compatibleSkus[0];

      if (availableSku) {
        availableSku.optionValues.forEach((ov) => {
          if (!newSelectedOptions[ov.optionValue.optionId]) {
            newSelectedOptions[ov.optionValue.optionId] = ov.optionValueId;
          }
        });
      }
    }

    if (Object.keys(newSelectedOptions).length > 0) {
      const isDifferent = Object.entries(newSelectedOptions).some(
        ([key, value]) => selectedOptions[key] !== value
      );
      if (isDifferent || Object.keys(selectedOptions).length === 0) {
        setSelectedOptions(newSelectedOptions);
      }
    }
  }, [searchParams, options, skus]);

  const handleSelect = (optionId: string, valueId: string) => {
    const newOptions = { ...selectedOptions, [optionId]: valueId };
    setSelectedOptions(newOptions);

    const params = new URLSearchParams(searchParams.toString());
    const option = options.find((o) => o.id === optionId);
    if (option) {
      params.set(option.name, valueId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const selectedSku = useMemo(() => {
    if (Object.keys(selectedOptions).length < options.length) return null;

    return skus.find((sku) => {
      return sku.optionValues.every((ov) => {
        return selectedOptions[ov.optionValue.optionId] === ov.optionValueId;
      });
    });
  }, [selectedOptions, skus, options]);

  useEffect(() => {
    if (onSkuChange) {
      onSkuChange(selectedSku || null);
    }
  }, [selectedSku, onSkuChange]);

  const getOptionValueStatus = (optionId: string, valueId: string) => {
    const otherSelectedOptions = { ...selectedOptions };
    delete otherSelectedOptions[optionId];

    const compatibleSkus = skus.filter((sku) => {
      const hasValue = sku.optionValues.some(
        (ov) => ov.optionValueId === valueId
      );
      if (!hasValue) return false;

      return Object.entries(otherSelectedOptions).every(([optId, valId]) => {
        return sku.optionValues.some(
          (ov) =>
            ov.optionValue.optionId === optId && ov.optionValueId === valId
        );
      });
    });

    if (compatibleSkus.length === 0) return "unavailable";
    if (compatibleSkus.every((s) => s.stock <= 0)) return "out_of_stock";

    return "available";
  };

  const price = selectedSku ? selectedSku.price : skus[0]?.price;
  const isOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  const handleAddToCart = async () => {
    if (!selectedSku) return;
    setIsAdding(true);

    try {
        if (isLoggedIn) {
            await addToCartAction(selectedSku.id);
            toast({ title: "Added to cart" });
            router.refresh();
        } else {
            const guestCart = JSON.parse(
                localStorage.getItem("guest_cart") || "[]"
            );
            const existingItem = guestCart.find(
                (item: any) => item.skuId === selectedSku.id
            );

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                guestCart.push({ skuId: selectedSku.id, quantity: 1 });
            }

            localStorage.setItem("guest_cart", JSON.stringify(guestCart));
            toast({
                title: "Saved to guest cart",
                description: "Please login to complete your purchase.",
            });
            router.push("/login");
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Failed to add to cart", variant: "destructive" });
    } finally {
        setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price || 0)}
        </h2>
      </div>

      <div className="space-y-6">
        {options.map((option) => (
          <div key={option.id}>
            <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-muted-foreground/80">{option.name}</h3>
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
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-white hover:border-primary/50 hover:text-primary",
                      status === "unavailable" &&
                        "opacity-30 cursor-not-allowed bg-transparent text-muted-foreground line-through decoration-white/20",
                      status === "out_of_stock" &&
                        "opacity-50 cursor-not-allowed border-red-500/30 text-red-400"
                    )}
                    onClick={() => {
                      if (status !== "unavailable") {
                        handleSelect(option.id, value.id);
                      }
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
          className="flex-1 w-full"
          variant="primary"
          size="lg"
          disabled={!selectedSku || isOutOfStock || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </GlassButton>
        <GlassButton
          className="flex-1 w-full"
          variant="glass"
          size="lg"
            onClick={() => {
                 handleAddToCart().then(() => router.push('/cart'));
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
