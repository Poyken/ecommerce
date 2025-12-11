"use client";
import { addToCartAction } from "@/actions/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";

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
}

export function ProductVariantSelector({
  options,
  skus,
  isLoggedIn,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Khởi tạo lựa chọn mặc định từ URL hoặc mặc định
  useEffect(() => {
    const newSelectedOptions: Record<string, string> = {};

    // 1. Ưu tiên lấy từ URL
    options.forEach((opt) => {
      const valueIdFromUrl = searchParams.get(opt.name);
      if (valueIdFromUrl) {
        // Validate xem valueId có thuộc option này không
        const isValid = opt.values.some((v) => v.id === valueIdFromUrl);
        if (isValid) {
          newSelectedOptions[opt.id] = valueIdFromUrl;
        }
      }
    });

    // 2. Nếu chưa đủ, tìm SKU mặc định hoặc SKU đầu tiên còn hàng
    const currentSelectedCount = Object.keys(newSelectedOptions).length;
    if (currentSelectedCount < options.length) {
      // Tìm SKU phù hợp nhất với các lựa chọn hiện tại
      const compatibleSkus = skus.filter((sku) => {
        return sku.optionValues.every((ov) => {
          const selectedValueId = newSelectedOptions[ov.optionValue.optionId];
          return !selectedValueId || selectedValueId === ov.optionValueId;
        });
      });

      // Ưu tiên SKU còn hàng
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

    // Chỉ update state nếu có sự thay đổi để tránh loop
    if (Object.keys(newSelectedOptions).length > 0) {
      // Check if different from current state
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

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    // Find option name
    const option = options.find((o) => o.id === optionId);
    if (option) {
      params.set(option.name, valueId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  // Xác định SKU được chọn dựa trên selectedOptions
  const selectedSku = useMemo(() => {
    if (Object.keys(selectedOptions).length < options.length) return null;

    return skus.find((sku) => {
      return sku.optionValues.every((ov) => {
        return selectedOptions[ov.optionValue.optionId] === ov.optionValueId;
      });
    });
  }, [selectedOptions, skus, options]);

  // Tính toán trạng thái của từng giá trị (có thể chọn được không)
  const getOptionValueStatus = (optionId: string, valueId: string) => {
    // Giả sử người dùng chọn giá trị này, giữ nguyên các lựa chọn khác
    const potentialOptions = { ...selectedOptions, [optionId]: valueId };

    // Tìm xem có SKU nào khớp với potentialOptions không
    // Lưu ý: Chỉ cần khớp với các option đã chọn (trừ option hiện tại đang xét)
    // Tuy nhiên logic đơn giản nhất là:
    // Với option hiện tại, nếu chọn value này, có SKU nào tồn tại không?
    // Phức tạp hơn: Kết hợp với các option KHÁC đã chọn.

    // Logic:
    // 1. Tạo bản sao các lựa chọn hiện tại.
    // 2. Thay thế lựa chọn của option hiện tại bằng valueId.
    // 3. Kiểm tra xem có SKU nào khớp với tập lựa chọn này không.
    //    (Lưu ý: Nếu chưa chọn đủ các option khác, thì tìm xem có SKU nào chứa tập con này không)

    const otherSelectedOptions = { ...selectedOptions };
    delete otherSelectedOptions[optionId];

    const compatibleSkus = skus.filter((sku) => {
      // SKU phải chứa valueId đang xét
      const hasValue = sku.optionValues.some(
        (ov) => ov.optionValueId === valueId
      );
      if (!hasValue) return false;

      // SKU phải khớp với các lựa chọn khác đã chọn
      return Object.entries(otherSelectedOptions).every(([optId, valId]) => {
        return sku.optionValues.some(
          (ov) =>
            ov.optionValue.optionId === optId && ov.optionValueId === valId
        );
      });
    });

    if (compatibleSkus.length === 0) return "unavailable"; // Không có SKU nào
    if (compatibleSkus.every((s) => s.stock <= 0)) return "out_of_stock"; // Có SKU nhưng hết hàng

    return "available";
  };

  const price = selectedSku ? selectedSku.price : skus[0]?.price;
  const isOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price || 0)}
        </h2>
      </div>

      <div className="space-y-4">
        {options.map((option) => (
          <div key={option.id}>
            <h3 className="font-medium mb-2">{option.name}</h3>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const status = getOptionValueStatus(option.id, value.id);
                const isSelected = selectedOptions[option.id] === value.id;

                return (
                  <Badge
                    key={value.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1 text-sm border-2",
                      isSelected
                        ? "border-primary"
                        : "border-transparent bg-secondary hover:bg-secondary/80",
                      status === "unavailable" &&
                        "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 decoration-slice line-through",
                      status === "out_of_stock" &&
                        "opacity-70 cursor-not-allowed bg-red-50 text-red-400"
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

      <div className="flex gap-4">
        <AddToCartButton
          skuId={selectedSku?.id || ""}
          disabled={!selectedSku || isOutOfStock}
          isLoggedIn={isLoggedIn}
        />
        <Button
          className="w-full md:w-auto"
          variant="secondary"
          size="lg"
          disabled={!selectedSku || isOutOfStock}
          onClick={async () => {
            if (!selectedSku) return;

            if (isLoggedIn) {
              await addToCartAction(selectedSku.id);
              router.push("/cart");
            } else {
              // Guest Logic
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
          }}
        >
          Buy Now
        </Button>
      </div>

      {selectedSku && isOutOfStock && (
        <p className="text-destructive text-sm">Hết hàng</p>
      )}
    </div>
  );
}
