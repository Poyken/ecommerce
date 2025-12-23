/**
 * =====================================================================
 * PRODUCT DETAIL PAGE - Trang chi tiết sản phẩm (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC RENDERING & SEO:
 * - Sử dụng `generateMetadata` để tạo tiêu đề và mô tả động cho từng sản phẩm, giúp tối ưu SEO.
 * - `generateStaticParams`: Cho phép Next.js pre-render các trang sản phẩm phổ biến tại thời điểm build (SSG).
 *
 * 2. DATA FETCHING:
 * - Fetch dữ liệu sản phẩm từ `productService`.
 * - Tổng hợp tất cả hình ảnh từ sản phẩm chính và các SKU (biến thể) để hiển thị trong gallery.
 *
 * 3. STRUCTURED DATA (JSON-LD):
 * - Tự động tạo script `application/ld+json` để Google Search hiểu rõ hơn về sản phẩm (giá, thương hiệu, tình trạng kho hàng).
 * =====================================================================
 */

import { getProfileAction } from "@/actions/profile";
import { productService } from "@/services/product.service";
import { Product } from "@/types/models";
import { Suspense } from "react";
import { ProductDetailClient } from "./product-detail-client";

export async function generateStaticParams() {
  try {
    const ids = await productService.getProductIds();
    // Next.js 16 with cacheComponents requires at least one result
    if (ids.length === 0) {
      return [{ id: "fallback" }];
    }
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("Failed to generate static params (API likely down):", error);
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

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

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
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
  };
}

async function DynamicProductDetail({
  product,
  images,
}: {
  product: Product;
  images: string[];
}) {
  const { data: user } = await getProfileAction();
  const isLoggedIn = !!user;

  // Adapt Product to the props expected by Client if needed,
  // or update Client to accept strict Product.
  // The client expects 'price' on product. We might need to extend it.
  // But for now, let's cast or better yet, assume Client handles it?
  // Checking client... Client likely needs refactoring too if it expects product.price.
  // For now let's pass it simply.

  return (
    <ProductDetailClient
      product={product}
      initialImages={images}
      isLoggedIn={isLoggedIn}
    />
  );
}

import { ProductDetailSkeleton } from "@/components/organisms/skeletons/product-detail-skeleton";

import { BreadcrumbNav } from "@/components/atoms/breadcrumb-nav";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch product data - this part can be cached
  const productData = await productService.getProduct(id);

  if (!productData) {
    notFound();
  }

  const product = productData;

  // Collect all images from product and SKUs
  const productImages = (product.images || []).map((img) =>
    typeof img === "string" ? img : img.url
  );
  const skuImages =
    product.skus
      ?.map((sku) => sku.imageUrl)
      .filter((url): url is string => !!url) || [];

  // Combine and remove duplicates
  const allImages = Array.from(new Set([...productImages, ...skuImages]));

  // Fallback if no images found
  const images: string[] =
    allImages.length > 0
      ? allImages
      : [`https://picsum.photos/seed/${product.id}/600/800`];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <div className="container mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 lg:mb-8">
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
        </div>

        <Suspense fallback={<ProductDetailSkeleton />}>
          <DynamicProductDetail product={product} images={images} />
        </Suspense>
      </div>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: images,
            description: product.description,
            brand: {
              "@type": "Brand",
              name: product.brand?.name || "Luxe",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "VND",
              lowPrice:
                (product.skus?.length ?? 0) > 0
                  ? Math.min(
                      ...(product.skus || []).map((s) =>
                        Number(s.salePrice || s.price || 0)
                      )
                    )
                  : 0,
              highPrice:
                (product.skus?.length ?? 0) > 0
                  ? Math.max(
                      ...(product.skus || []).map((s) =>
                        Number(s.salePrice || s.price || 0)
                      )
                    )
                  : 0,
              offerCount: product.skus?.length || 0,
              availability: (product.skus || []).some((s) => s.stock > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </div>
  );
}
