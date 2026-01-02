"use client";

import { useToast } from "@/components/shared/use-toast";
import { socialLoginAction } from "@/features/auth/actions";
import { mergeGuestCartAction } from "@/features/cart/actions";
import { mergeGuestWishlistAction } from "@/features/wishlist/actions";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * SOCIAL CALLBACK CLIENT - Xử lý sau khi Login GG/FB thành công
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOKEN HANDLING:
 * - Lấy `accessToken` và `refreshToken` từ URL (do Server trả về sau khi OAuth).
 * - Gọi `socialLoginAction` để tạo session cookie cho user.
 *
 * 2. DATA MERGING (GUEST -> USER):
 * - User có thể đã add cart/wishlist khi chưa login (Guest).
 * - Khi login thành công, ta phải merge data từ LocalStorage vào Database của User.
 * - Logic merge nằm ở actions `mergeGuestCartAction` và `mergeGuestWishlistAction`.
 * =====================================================================
 */
export function SocialCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [status, setStatus] = useState("Authenticating...");
  const { toast } = useToast();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("Syncing data...");
      socialLoginAction(accessToken, refreshToken).then(async (res) => {
        if (res.success) {
          // Guest Wishlist Merge Logic
          try {
            const guestWishlist = localStorage.getItem("guest_wishlist");
            if (guestWishlist) {
              const productIds = JSON.parse(guestWishlist);
              if (Array.isArray(productIds) && productIds.length > 0) {
                await mergeGuestWishlistAction(productIds);
              }
              localStorage.removeItem("guest_wishlist");
              window.dispatchEvent(new Event("wishlist_updated"));
            }
          } catch (e) {
            // console.error("Failed to sync wishlist", e);
          }

          // Guest Cart Merge Logic
          try {
            const guestCart = localStorage.getItem("guest_cart");
            if (guestCart) {
              const items = JSON.parse(guestCart);
              if (Array.isArray(items) && items.length > 0) {
                const mergeRes = await mergeGuestCartAction(items);

                if (
                  mergeRes.success &&
                  "results" in mergeRes &&
                  Array.isArray(mergeRes.results)
                ) {
                  const results = mergeRes.results as any[];
                  const cappedCount = results.filter(
                    (r) => r.data?.capped
                  ).length;
                  const failedCount = results.filter((r) => !r.success).length;

                  if (cappedCount > 0 || failedCount > 0) {
                    toast({
                      title: "Sync Update",
                      description: `${
                        cappedCount > 0
                          ? "Some items were adjusted to available stock. "
                          : ""
                      }${
                        failedCount > 0
                          ? `${failedCount} items failed to merge.`
                          : ""
                      }`,
                      variant: "warning",
                    });
                  }
                }
              }
              localStorage.removeItem("guest_cart");
            }
            // Dispatch event to update UI
            window.dispatchEvent(new Event("cart_updated"));
          } catch (e) {
            // console.error("Failed to sync guest cart", e);
          }

          // Redirect to home
          setStatus("Redirecting...");
          window.location.href = `/${locale}`;
        } else {
          router.push(`/${locale}/login?error=social_login_failed`);
        }
      });
    } else {
      router.push(`/${locale}/login?error=missing_tokens`);
    }
  }, [searchParams, router, locale]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
