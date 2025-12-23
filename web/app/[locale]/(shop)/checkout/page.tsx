import { getProfileAction } from "@/actions/profile";
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
 * - Truyền tất cả xuống `CheckoutClient` để render form.
 * =====================================================================
 */
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

async function DynamicCheckout() {
  const [cartRes, profileRes] = await Promise.all([
    http<ApiResponse<Cart>>("/cart"),
    getProfileAction(),
  ]);

  const cart = cartRes?.data || null;
  const addresses = profileRes?.data?.addresses || [];

  return <CheckoutClient cart={cart} addresses={addresses} />;
}

import { LoadingScreen } from "@/components/atoms/loading-screen";

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
