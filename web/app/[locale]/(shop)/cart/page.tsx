import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { CartClient } from "./cart-client";

import { Cart } from "@/types/models";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Luxe",
  description: "Review your selected items and proceed to checkout.",
};

/**
 * =====================================================================
 * CART PAGE - Trang giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SERVER VS CLIENT COMPONENT:
 * - `CartPage` (Server Component):
 *    - Chịu trách nhiệm fetch dữ liệu ban đầu (Cart, Profile).
 *    - Kiểm tra login qua cookies.
 *    - Truyền dữ liệu xuống cho `CartClient`.
 * - `CartClient` (Client Component):
 *    - Chịu trách nhiệm xử lý tương tác (tăng/giảm số lượng, xóa item).
 *    - Quản lý state (guest cart, optimistic updates).
 *
 * DATA FETCHING PATTERN:
 * - Sử dụng `Promise.all` để fetch song song Cart và Profile.
 * - Giảm thời gian chờ đợi (Waterfall problem).
 * - `force-dynamic`: Trang này luôn cần dữ liệu mới nhất, không cache tĩnh.
 * =====================================================================
 */
async function DynamicCart() {
  let cart: Cart | null = null;

  const cookieStore = await cookies();
  try {
    const accessToken = cookieStore.get("accessToken");

    if (accessToken) {
      const [cartRes] = await Promise.all([
        http<ApiResponse<Cart>>("/cart", { skipRedirectOn401: true }),
      ]);
      cart = cartRes.data;
    }
  } catch (e: any) {
    // If token is invalid (401), allow CartClient to handle guest cart or redirect
    if (e?.status === 401) {
       // Optional: Could redirect, or just let it render empty cart
    }
  }

  return <CartClient cart={cart} />;
}

import { LoadingScreen } from "@/components/shared/loading-screen";

export default async function CartPage() {
  const t = await getTranslations("loading");
  return (
    <Suspense
      fallback={<LoadingScreen fullScreen={false} message={t("cart")} />}
    >
      <DynamicCart />
    </Suspense>
  );
}
