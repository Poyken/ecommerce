
"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createReviewAction(data: {
  productId: string;
  skuId?: string;
  rating: number;
  content: string;
}) {
  try {
    await http("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath(`/products/${data.productId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to submit review",
    };
  }
}

export async function updateReviewAction(
  reviewId: string,
  data: {
    rating: number;
    content: string;
  }
) {
  try {
    await http(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    // We might need to revalidate the product page to show updated reviews
    // But since we pass productId to revalidatePath in create, we might need it here too or just rely on client refresh
    // For now, let's assume we can't easily revalidate by path without productId.
    // However, the component will likely refetch data on success.
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update review",
    };
  }
}

export async function checkReviewEligibilityAction(productId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return { success: true, data: { canReview: false, purchasedSkus: [] } };
    }

    const url = `/reviews/check-eligibility?productId=${productId}`;
    
    const res = await http<{
      data: {
        canReview: boolean;
        purchasedSkus: any[];
      }
    }>(url, {
      cache: "no-store",
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    let payloadStr = "";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        payloadStr = JSON.stringify(payload);
      } catch (e) {
        payloadStr = "Decode failed";
      }
    }

    console.error("checkReviewEligibilityAction error:", error);
    return { success: false, error: `${error.message || "Failed"} (Token: ${token ? "Present" : "Missing"}) (Payload: ${payloadStr})` };
  }
}

export async function getReviewsAction(productId: string, page = 1) {
  try {
    const res = await http<{ data: any[]; meta: any }>(
      `/reviews/product/${productId}?page=${page}`
    );
    return { success: true, data: res };
  } catch (error) {
    return { success: false, error: "Failed to fetch reviews" };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    await http(`/reviews/mine/${reviewId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to delete review",
    };
  }
}
