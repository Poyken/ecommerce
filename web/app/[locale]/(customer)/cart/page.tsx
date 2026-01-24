import { cartService } from "@/features/cart/services/cart.service";
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


async function DynamicCart() {
  let cart: Cart | null = null;

  const cookieStore = await cookies();
  try {
    const accessToken = cookieStore.get("accessToken");

    if (accessToken) {
      const [cartRes] = await Promise.all([
        cartService.getCart(),
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
