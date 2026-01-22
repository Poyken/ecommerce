"use client";

import { useToast } from "@/components/ui/use-toast";
import { GlassButton } from "@/components/shared/glass-button";
import { addToCartAction } from "@/features/cart/actions";
import { Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * =====================================================================
 * RETRY ORDER BUTTON - Nút thử lại đơn hàng thất bại
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LOGIC RE-ADD TO CART:
 * - Khi đơn hàng thất bại, user muốn thử lại.
 * - Ta không thể "resume" đơn hàng cũ.
 * - Giải pháp: Lấy tất cả items từ đơn cũ -> Add lại vào Cart hiện tại -> Redirect về trang Cart. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

interface OrderItem {
  skuId: string;
  quantity: number;
}

interface OrderData {
  id: string;
  totalAmount: number;
  items: OrderItem[];
}

interface RetryButtonProps {
  order: OrderData;
}

export function RetryOrderButton({ order }: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRetry = async () => {
    if (!order.items || order.items.length === 0) {
      toast({
        title: "Error",
        description: "No items found in this order",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Add all items from the failed order back to cart
      for (const item of order.items) {
        await addToCartAction({ skuId: item.skuId, quantity: item.quantity });
      }

      toast({
        title: "Items added to cart",
        description: "Redirecting to your cart...",
      });

      // Redirect to cart so user can review before checkout
      router.push("/cart");
    } catch {
      toast({
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassButton
      className="w-full sm:w-auto h-14 px-8 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20"
      onClick={handleRetry}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
      ) : (
        <RefreshCcw className="mr-2 w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
      )}
      {isLoading ? "Adding to cart..." : "Try Again"}
    </GlassButton>
  );
}
