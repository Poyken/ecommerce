import { getProfileAction } from "@/features/profile/actions";
import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Cart } from "@/types/models";
import { CheckoutClient } from "./checkout-client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Luxe",
  description: "Securely complete your purchase.",
};

/**
 * =====================================================================
 * CHECKOUT PAGE - Trang thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * PAGE PROTECTION:
 * - Trang này yêu cầu bắt buộc phải có dữ liệu Cart và Profile.
 * - Nếu API trả về lỗi hoặc không có dữ liệu, Client Component sẽ xử lý (hoặc redirect).
 *
 * DATA PREPARATION:
 * - Fetch Cart để hiển thị lại lần cuối trước khi đặt hàng.
 * - Fetch Addresses (Profile) để user chọn địa chỉ giao hàng.
 * - Truyền tất cả xuống `CheckoutClient` để render form. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - High-Conversion Checkout: Tối ưu hóa luồng thanh toán một trang (One-page Checkout) để giảm thiểu tỷ lệ bỏ rơi giỏ hàng và tăng tốc độ hoành thành đơn hàng cho khách.
 * - Multi-Gateway Payment: Cung cấp nhiều lựa chọn thanh toán linh hoạt cho khách hàng, từ COD truyền thống đến chuyển khoản ngân hàng qua mã QR tự động.

 * =====================================================================
 */
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ShopEmptyState } from "@/components/shared/shop-empty-state";
import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

// ...

async function DynamicCheckout() {
  let cartRes, profileRes;
  let error = null;

  try {
    [cartRes, profileRes] = await Promise.all([
      http<ApiResponse<Cart>>("/cart", { skipRedirectOn401: true }),
      getProfileAction(),
    ]);
  } catch (e: any) {
    if (e?.status === 401) {
      redirect("/login");
    }
    error = e instanceof Error ? e.message : "Failed to load checkout data";
  }

  if (!profileRes?.data) {
    redirect("/login?callbackUrl=/checkout");
  }

  const cart = cartRes?.data || null;
  const addresses = profileRes?.data?.addresses || [];

  if (error || !cart) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <ShopEmptyState
          icon={AlertCircle}
          title={error ? "Error Loading Checkout" : "Cart is Empty"}
          description={
             error
              ? "We could not load your checkout information. Please try again."
              : "There are no items in your cart to checkout."
          }
          actionHref={error ? "/cart" : "/shop"}
          actionLabel={error ? "Back to Cart" : "Start Shopping"}
        />
      </div>
    );
  }

  return <CheckoutClient cart={cart} addresses={addresses} />;
}

import { LoadingScreen } from "@/components/shared/loading-screen";

export default async function CheckoutPage() {
  const t = await getTranslations("loading");
  return (
    <Suspense
      fallback={<LoadingScreen fullScreen={false} message={t("checkout")} />}
    >
      <DynamicCheckout />
    </Suspense>
  );
}
