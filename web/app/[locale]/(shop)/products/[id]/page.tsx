/**
 * =====================================================================
 * PRODUCT DETAIL PAGE - Trang chi tiết sản phẩm (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SUSPENSE STREAMING (Kỹ thuật Streaming):
 * - Trang chi tiết rất nặng (Product info, Review, Related items...).
 * - Nếu chờ load xong tất cả mới hiện -> User phải đợi lâu màn hình trắng.
 * - Giải pháp: Bọc phần nặng (`ProductDetailStreamer`) vào `<Suspense>`.
 * -> Next.js trả về khung trang (Shell) ngay lập tức, rồi "stream" nội dung nặng về sau.
 *
 * 2. PARALLEL FETCHING (Waterfall vs Parallel):
 * - SAI: `await getProduct(); await getReviews();` (Mất A + B giây).
 * - ĐÚNG: `Promise.all([getProduct(), getReviews()])` (Chỉ mất max(A, B) giây).
 * -> Tối ưu thời gian phản hồi máy chủ (TTFB).
 *
 * 3. SEO METADATA (`generateMetadata`):
 * - Vì là Server Component, ta có thể fetch data sản phẩm để điền Title, Description, OpenGraph Image chuẩn SEO dynamic. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

// [FIX] Force dynamic rendering because this page uses cookies/headers (via profile/auth check)
// which prevents static generation (SSG).
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { ProductDetailSkeleton } from "@/features/products/components/skeletons/product-detail-skeleton";
import { ProductRecommendations } from "@/features/products/components/product-recommendations";
import { getProfileAction } from "@/features/profile/actions";
import { productService } from "@/features/products/services/product.service";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailClient } from "./product-detail-client";

// Generate các URL static tại thời điểm build (để SEO tốt hơn)
export async function generateStaticParams() {
  try {
    const ids = await productService.getProductIds();
    if (ids.length === 0) return [{ id: "fallback" }];
    return ids.map((id) => ({ id }));
  } catch {
    return [{ id: "fallback" }];
  }
}

// Generate Metadata động cho SEO (Title, Description, OpenGraph Image)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await productService.getProduct(id);

  if (!product) return { title: "Product Not Found" };

  const images = product.images || [];
  const firstImage = images.length > 0 ? images[0] : null;
  const imageUrl = firstImage
    ? typeof firstImage === "string"
      ? firstImage
      : firstImage.url
    : `https://picsum.photos/seed/${product.id}/600/800`;

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: imageUrl }],
    },
  };
}

/**
 * [RSC] Streamer Component
 * Component này chịu trách nhiệm fetch dữ liệu nặng và render phần client.
 * Được bọc trong Suspense để không block UI chính.
 */
async function ProductDetailStreamer({ id }: { id: string }) {
  // Dynamic import actions để tránh bundle code server vào client bundle (nếu có leak)
  const { checkReviewEligibilityAction, getReviewsAction } = await import(
    "@/features/reviews/actions"
  );

  // Kỹ thuật Parallel Fetching quan trọng
  const [product, , reviewsData, eligibilityData] = await Promise.all([
    productService.getProduct(id), // Lấy thông tin sản phẩm
    getProfileAction(), // Lấy user hiện tại (có thể dùng cho review eligibility)
    getReviewsAction(id), // Lấy reviews
    checkReviewEligibilityAction(id), // Check xem user đã mua hàng chưa (để cho review)
  ]);

  if (!product) notFound();

  // Tổng hợp ảnh từ Product và Variant SKUs
  const productImages = (product.images || []).map((img) =>
    typeof img === "string" ? img : img.url
  );
  const skuImages =
    product.skus
      ?.map((sku) => sku.imageUrl)
      .filter((url): url is string => !!url) || [];

  const images = Array.from(new Set([...productImages, ...skuImages]));
  if (images.length === 0) {
    images.push(`https://picsum.photos/seed/${product.id}/600/800`);
  }

  // Truyền data đã fetch xuống Client Component để render tương tác
  return (
    <ProductDetailClient
      product={product}
      initialImages={images}
      initialReviews={reviewsData.success ? reviewsData.data : []}
      initialMeta={reviewsData.success ? reviewsData.meta : null}
      initialPurchasedSkus={
        eligibilityData.success ? eligibilityData.data?.purchasedSkus : []
      }
    />
  );
}

// Breadcrumb cũng cần fetch data, tách riêng để Suspense cục bộ
async function BreadcrumbStreamer({ id }: { id: string }) {
  const product = await productService.getProduct(id);
  if (!product) return null;

  return (
    <BreadcrumbNav
      items={[
        { label: "Shop", href: "/shop" },
        ...(product.category?.name
          ? [
              {
                label: product.category.name,
                href: `/shop?categoryId=${product.category.id}`,
              },
            ]
          : []),
        { label: product.name },
      ]}
      className="text-sm"
    />
  );
}

// Recommendations cũng cần fetch product để lấy categoryId
async function RecommendationsStreamer({ id }: { id: string }) {
  const product = await productService.getProduct(id);
  if (!product || !product.category?.id) return null;

  return (
    <ProductRecommendations
      currentProductId={id}
      categoryId={product.category.id}
      maxItems={8}
      title="Có thể bạn cũng thích"
    />
  );
}

/**
 * MAIN PAGE COMPONENT
 * Cấu trúc trang sử dụng Streaming SSR.
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumb: Load độc lập */}
        <div className="mb-6 lg:mb-8">
          <Suspense
            fallback={
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            }
          >
            <BreadcrumbStreamer id={id} />
          </Suspense>
        </div>

        {/* Main Content: Load độc lập với Skeleton riêng */}
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailStreamer id={id} />
        </Suspense>

        {/* Product Recommendations - Fetched server-side */}
        <Suspense fallback={null}>
          <RecommendationsStreamer id={id} />
        </Suspense>
      </div>
    </div>
  );
}
