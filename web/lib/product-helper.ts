/**
 * =====================================================================
 * PRODUCT HELPER - Công cụ xử lý dữ liệu sản phẩm ở Frontend
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Helper này giúp giải quyết vấn đề "Dữ liệu không đồng nhất" từ API.
 *
 * 1. CHIẾN LƯỢC TRÍCH XUẤT ẢNH:
 *    - Ưu tiên 1: Lấy ảnh của SKU đầu tiên (Ảnh biến thể).
 *    - Ưu tiên 2: Lấy ảnh trong mảng `images` của Product.
 *    - Ưu tiên 3: Dùng ảnh "Placeholder" nếu không tìm thấy gì.
 *
 * 2. TẠI SAO CẦN HELPER NÀY?
 *    - Khi dùng Prisma `select`, đôi khi structure trả về bị lồng nhìu lớp.
 *    - Tránh việc check `if (product && product.skus && ...)` lặp đi lặp lại ở React Component.
 *    - Giữ cho UI sạch sẽ, chỉ cần gọi `getProductImage(product)`.
 * =====================================================================
 */

import { Product } from "@/types/models";
export function getProductImage(
  product: Product | undefined | null,
  fallbackUrl = "/placeholder-product.png"
): string {
  if (!product) return fallbackUrl;

  // 1. Try SKU image from the first SKU (often the main variant)
  if (product.skus && product.skus.length > 0 && product.skus[0].imageUrl) {
    return product.skus[0].imageUrl;
  }

  // 2. Try Product images
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];

    // Case A: Image is a simple string URL
    if (typeof firstImage === "string") {
      return firstImage;
    }

    // Case B: Image is an object (ProductImage or { url: string })
    if (firstImage && typeof firstImage === "object" && "url" in firstImage) {
      return (firstImage as any).url || fallbackUrl;
    }
  }

  return fallbackUrl;
}
