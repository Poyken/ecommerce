"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";

export async function addToCartAction(skuId: string, quantity: number = 1) {
  try {
    await http("/cart", {
      method: "POST",
      body: JSON.stringify({ skuId, quantity }),
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error: any) {
    console.error("Thêm vào giỏ hàng thất bại:", error);
    return { error: error.message || "Failed to add to cart" };
  }
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  try {
    await http(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    revalidatePath("/cart");
  } catch (error) {
    console.error("Cập nhật mục giỏ hàng thất bại", error);
  }
}

export async function removeFromCartAction(itemId: string) {
  try {
    await http(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
    revalidatePath("/cart");
  } catch (error) {
    console.error("Xóa mục giỏ hàng thất bại", error);
  }
}

import { getProfileAction } from "./profile";

export async function checkoutAction() {
  try {
    // 1. Lấy thông tin user và địa chỉ
    const profileRes = await getProfileAction();
    if (profileRes.error || !profileRes.data) {
      throw new Error("Failed to fetch user profile");
    }

    const addresses = profileRes.data.addresses || [];
    if (addresses.length === 0) {
      throw new Error("Please add a shipping address first");
    }

    // 2. Chọn địa chỉ (Mặc định hoặc cái đầu tiên)
    const address = addresses.find((a: any) => a.isDefault) || addresses[0];

    // 3. Tạo đơn hàng với thông tin từ địa chỉ
    await http("/orders", {
      method: "POST",
      body: JSON.stringify({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        shippingAddress: `${address.street}, ${address.ward || ""}, ${
          address.district
        }, ${address.city}`,
        paymentMethod: "COD", // Mặc định COD cho flow này
      }),
    });

    revalidatePath("/cart");
    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Checkout failed" };
  }
}
