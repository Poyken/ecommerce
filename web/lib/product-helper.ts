import { Product } from "@/types/models";

/**
 * Safely extracts the primary image URL from a Product object.
 * Handles diverse data structures:
 * - SKUs with images
 * - Product images as string[]
 * - Product images as Object[] ({ url: string, ... })
 *
 * @param product The product object
 * @param fallbackUrl Default URL if no image found (default: /placeholder-product.png)
 */
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
