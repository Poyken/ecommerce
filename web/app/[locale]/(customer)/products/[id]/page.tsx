

// [FIX] Force dynamic rendering because this page uses cookies/headers (via profile/auth check)
// which prevents static generation (SSG).
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { ProductDetailSkeleton } from "@/features/products/components/skeletons/product-detail-skeleton";
import { ProductRecommendations } from "@/features/products/components/product-recommendations";
import { getProfileAction } from "@/features/profile/actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailClient } from "./product-detail-client";

// Generate các URL static tại thời điểm build (để SEO tốt hơn)
export async function generateStaticParams() {
  try {
    const { getProductIdsAction } = await import("@/features/products/actions");
    const ids = await getProductIdsAction();
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
  const { getProductAction } = await import("@/features/products/actions");
  const productRes = await getProductAction(id);
  const product = productRes.success ? productRes.data : null;

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

  // Kỹ thuật Parallel Fetching quan trọng - Using Server Actions
  const { getProductAction } = await import("@/features/products/actions");
  const [productRes, , reviewsData, eligibilityData] = await Promise.all([
    getProductAction(id), // Lấy thông tin sản phẩm
    getProfileAction(), // Lấy user hiện tại (có thể dùng cho review eligibility)
    getReviewsAction(id), // Lấy reviews
    checkReviewEligibilityAction(id), // Check xem user đã mua hàng chưa (để cho review)
  ]);
  const product = productRes.success ? productRes.data : null;

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
  const { getProductAction } = await import("@/features/products/actions");
  const productRes = await getProductAction(id);
  const product = productRes.success ? productRes.data : null;
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
  const { getProductAction } = await import("@/features/products/actions");
  const productRes = await getProductAction(id);
  const product = productRes.success ? productRes.data : null;
  if (!product || !product.category?.id) return null;

  return (
    <ProductRecommendations
      currentProductId={id}
      categoryId={product.category.id}
      maxItems={8}
      title="COMPLETE THE LOOK"
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
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 relative overflow-hidden transition-colors duration-500">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-full bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] bg-(--aurora-blue)/10 rounded-full blur-[120px] animate-float z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-(--aurora-orange)/5 rounded-full blur-[100px] z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 py-12 lg:py-20 z-10">
        {/* Breadcrumb: Load độc lập */}
        <div className="mb-10 lg:mb-16">
          <Suspense
            fallback={
              <div className="h-5 w-32 bg-white/5 animate-pulse rounded-full" />
            }
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
              <BreadcrumbStreamer id={id} />
            </div>
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
