/**
 * =====================================================================
 * PRODUCT DETAIL PAGE - Trang chi tiết sản phẩm (Server Component)
 * =====================================================================
 *
 * [REFACTOR P1]: Implement True Streaming
 * - Metadata and initial layout are rendered immediately.
 * - Product details and Reviews are streamed in via Suspense.
 */

import { getProfileAction } from "@/actions/profile";
import { BreadcrumbNav } from "@/components/atoms/breadcrumb-nav";
import { ProductDetailSkeleton } from "@/components/organisms/skeletons/product-detail-skeleton";
import { productService } from "@/services/product.service";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailClient } from "./product-detail-client";

export async function generateStaticParams() {
  try {
    const ids = await productService.getProductIds();
    if (ids.length === 0) return [{ id: "fallback" }];
    return ids.map((id) => ({ id }));
  } catch (error) {
    return [{ id: "fallback" }];
  }
}

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
 * [RSC] ProductLoader fetches the heavy product data.
 * This can be awaited inside Suspense to enable streaming.
 */
async function ProductDetailStreamer({ id }: { id: string }) {
  const { checkReviewEligibilityAction, getReviewsAction } = await import(
    "@/actions/review"
  );

  const [product, { data: user }, reviewsData, eligibilityData] =
    await Promise.all([
      productService.getProduct(id),
      getProfileAction(),
      getReviewsAction(id),
      checkReviewEligibilityAction(id),
    ]);

  if (!product) notFound();

  const isLoggedIn = !!user;

  // Collect all images from product and SKUs
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

  return (
    <ProductDetailClient
      product={product}
      initialImages={images}
      isLoggedIn={isLoggedIn}
      initialReviews={reviewsData.success ? reviewsData.data : []}
      initialMeta={reviewsData.success ? reviewsData.meta : null}
      initialPurchasedSkus={
        eligibilityData.success ? eligibilityData.data?.purchasedSkus : []
      }
    />
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumb renders immediately */}
        <div className="mb-6 lg:mb-8">
          <Suspense
            fallback={
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            }
          >
            <BreadcrumbStreamer id={id} />
          </Suspense>
        </div>

        {/* Heavy content streams in */}
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailStreamer id={id} />
        </Suspense>
      </div>
    </div>
  );
}

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
