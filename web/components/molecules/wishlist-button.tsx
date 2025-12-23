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
 * - Giúp React ưu tiên các update UI khác quan trọng hơn trong khi chờ action hoàn tất.
 * =====================================================================
 */
import { toggleWishlistAction } from "@/actions/wishlist";
import { MotionButton } from "@/components/atoms/motion-button";
import { useGuestWishlist } from "@/hooks/use-guest-wishlist";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isPending, startTransition] = useTransition();
  const { toast, dismiss } = useToast();
  const router = useRouter();
  const { hasItem, addToWishlist, removeFromWishlist } = useGuestWishlist();
  const { isAuthenticated } = useAuth();

  // Sync with guest wishlist state
  useEffect(() => {
    // For guest users, strictly sync with the guest wishlist storage
    if (!isAuthenticated) {
      setIsWishlisted(hasItem(productId));
    }
  }, [hasItem, productId, isAuthenticated]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click

    // Optimistic Update
    const previousState = isWishlisted;
    setIsWishlisted(!isWishlisted);

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

    startTransition(async () => {
      const res = await toggleWishlistAction(productId);

      if (!res.success) {
        if ("requiresAuth" in res && res.requiresAuth) {
          // Fallback to Guest Wishlist
          if (previousState) {
            removeFromWishlist(productId);
          } else {
            addToWishlist(productId);
          }
          // Keep the optimistic update (which is now correct for guest)
          toast({
            title: !previousState ? t("added") : t("removed"), // !previousState is the NEW desired state
            description: t("savedToGuestCartDesc"),
            variant: "success",
          });
          return;
        }

        setIsWishlisted(previousState); // Revert
        toast({
          title: tToast("error"),
          description: res.error,
          variant: "destructive",
        });
      } else {
        dismiss(); // Dismiss previous toasts
        toast({
          title: res.isWishlisted ? t("added") : t("removed"),
          variant: res.isWishlisted ? "success" : "info",
        });
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
        "p-2.5 rounded-2xl transition-all duration-300 h-auto w-auto shadow-lg",
        isWishlisted
          ? "bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 shadow-red-500/20"
          : "bg-white/10 dark:bg-black/20 text-white hover:bg-white/20 dark:hover:bg-black/30 backdrop-blur-xl border border-white/10",
        className
      )}
      disabled={isPending}
      title={t("addToWishlist")}
    >
      <Heart className={cn("w-6 h-6", isWishlisted ? "fill-current" : "")} />
    </MotionButton>
  );
}
