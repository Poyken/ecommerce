"use client";

/**
 * =====================================================================
 * WISHLIST BUTTON - Nút thêm vào yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OPTIMISTIC UI:
 * - Cập nhật state `isWishlisted` ngay lập tức khi user click (`setIsWishlisted(!isWishlisted)`).
 * - Giúp giao diện phản hồi tức thì, không cần chờ server trả về kết quả.
 * - Nếu server trả về lỗi, revert lại state cũ (`setIsWishlisted(previousState)`).
 *
 * 2. HYBRID STATE MANAGEMENT:
 * - Hỗ trợ cả User đã đăng nhập (Server Action) và Khách (LocalStorage).
 * - `useGuestWishlist`: Hook quản lý wishlist cho khách.
 * - `toggleWishlistAction`: Server Action gọi API backend.
 *
 * 3. USE TRANSITION:
 * - `useTransition`: Đánh dấu việc gọi Server Action là "non-blocking transition".
 * - Giúp React ưu tiên các update UI khác quan trọng hơn trong khi chờ action hoàn tất. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
import { MotionButton } from "@/components/shared/motion-button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { useGuestWishlist } from "@/features/wishlist/hooks/use-guest-wishlist";
import { useWishlistStore } from "@/features/wishlist/store/wishlist.store";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export interface WishlistButtonProps {
  productId: string;
  initialIsWishlisted?: boolean;
  className?: string;
  variant?: "icon" | "full";
}

export function WishlistButton({
  productId,
  initialIsWishlisted = false,
  className,
  variant = "icon",
}: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const tToast = useTranslations("common.toast");
  const [localIsWishlisted, setLocalIsWishlisted] =
    useState(initialIsWishlisted);
  const [isPending, startTransition] = useTransition();
  const { toast, dismiss } = useToast();
  // const router = useRouter(); // Unused
  const { hasItem, addToWishlist, removeFromWishlist } = useGuestWishlist();
  const { isAuthenticated } = useAuth();

  const isGuestWishlisted = hasItem(productId);
  const isWishlisted = isAuthenticated ? localIsWishlisted : isGuestWishlisted;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click

    const previousState = isWishlisted;

    if (!isAuthenticated) {
      if (!previousState) {
        addToWishlist(productId);
        toast({
          title: t("added"),
          description: t("savedToGuestCartDesc"),
          variant: "success",
        });
      } else {
        removeFromWishlist(productId);
        toast({
          title: t("removed"),
          variant: "info",
        });
      }
      return;
    }

    // Optimistic Update for Authenticated User
    setLocalIsWishlisted(!previousState);

    startTransition(async () => {
      const res = await toggleWishlistAction(productId);

      if (!res.success) {
        if ("requiresAuth" in res && res.requiresAuth) {
          if (previousState) {
            removeFromWishlist(productId);
          } else {
            addToWishlist(productId);
          }

          toast({
            title: !previousState ? t("added") : t("removed"),
            description: t("savedToGuestCartDesc"),
            variant: "success",
          });
          return;
        }

        setLocalIsWishlisted(previousState); // Revert
        toast({
          title: tToast("error"),
          description: res.error,
          variant: "destructive",
        });
      } else {
        dismiss(); // Dismiss previous toasts
        // res.data is expected to be { isWishlisted: boolean } on success
        let isWishlistedResult = false;
        if ("data" in res && res.data) {
          const data = res.data as { isWishlisted: boolean };
          isWishlistedResult = data.isWishlisted;
        }

        toast({
          title: isWishlistedResult ? t("added") : t("removed"),
          variant: isWishlistedResult ? "success" : "info",
        });

        // Update Global Store directly (faster than waiting for window event)
        const { refreshWishlist } = useWishlistStore.getState();
        refreshWishlist();

        // Keep window event for other listeners if any (e.g. multi-tab)
        window.dispatchEvent(new Event("wishlist_updated"));
      }
    });
  };

  if (variant === "full") {
    return (
      <MotionButton
        variant="outline"
        size="lg"
        animation="scale"
        className={cn("w-full gap-3 font-bold", className)}
        onClick={handleToggle}
        disabled={isPending}
      >
        <Heart
          className={cn(
            "w-6 h-6",
            isWishlisted ? "fill-red-500 text-red-500" : ""
          )}
        />
        {isWishlisted ? t("saved") : t("saveForLater")}
      </MotionButton>
    );
  }

  return (
    <MotionButton
      onClick={handleToggle}
      animation="scale"
      className={cn(
        "p-2.5 rounded-2xl transition-all duration-300 h-auto w-auto shadow-sm border",
        isWishlisted
          ? "bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200 dark:border-red-900"
          : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
        className
      )}
      disabled={isPending}
      title={t("addToWishlist")}
    >
      <Heart className={cn("w-6 h-6", isWishlisted ? "fill-current" : "")} />
    </MotionButton>
  );
}
