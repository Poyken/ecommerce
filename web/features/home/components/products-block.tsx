"use client";

import { ProductsSkeleton } from "@/components/shared/skeletons/home-skeleton";
import { NewArrivals } from "@/features/products/components/new-arrivals";
import { TrendingProducts } from "@/features/products/components/trending-products";
import { Product } from "@/types/models";
import { Suspense, use } from "react";

// Mock Data for Admin Preview
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Leather Lounge Chair",
    slug: "lounge-chair",
    price: 1299,
    compareAtPrice: 1599,
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop",
    ],
    category: { name: "Living Room" },
  } as any,
  {
    id: "2",
    name: "Minimalist Pendant Light",
    slug: "pendant-light",
    price: 249,
    images: [
      "https://images.unsplash.com/photo-1543512214-318c77a07298?q=80&w=800&auto=format&fit=crop",
    ],
    category: { name: "Lighting" },
  } as any,
  {
    id: "3",
    name: "Solid Oak Table",
    slug: "oak-table",
    price: 899,
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
    ],
    category: { name: "Dining" },
  } as any,
  {
    id: "4",
    name: "Ceramic Vase Set",
    slug: "vase-set",
    price: 89,
    images: [
      "https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=800&auto=format&fit=crop",
    ],
    category: { name: "Decor" },
  } as any,
];

interface ProductsBlockProps {
  data?: {
    products: Promise<Product[]>;
  };
  title?: string;
  type?: "trending" | "new_arrivals";
  count?: number;
  columns?: number;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

function ProductsContent({
  promise,
  type,
  title,
  count,
  columns,
}: {
  promise: Promise<Product[]>;
  type: string;
  title?: string;
  count?: number;
  columns?: number;
}) {
  const products = use(promise);
  if (type === "trending")
    return (
      <TrendingProducts
        products={products}
        title={title}
        count={count}
        columns={columns}
      />
    );
  return (
    <NewArrivals
      products={products}
      title={title}
      count={count}
      columns={columns}
    />
  );
}

/**
 * =================================================================================================
 * PRODUCTS BLOCK - KHỐI HIỂN THỊ SẢN PHẨM (TRENDING/NEW)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT STRATEGY:
 *    - Một Component (`ProductsBlock`) nhưng có thể hiển thị nhiều kiểu (Trending hoặc New Arrivals).
 *    - Giảm sự lặp lại code cho các phần chung như (Background, Title, Container).
 *
 * 2. DATA UNWRAPPING:
 *    - `ProductsContent` sử dụng hook `use()` để đợi dữ liệu từ Promise truyền từ Server.
 *    - Trong khi chờ, `Suspense` ở Level cha sẽ hiện `ProductsSkeleton`.
 *
 * 3. PREVIEW SYSTEM:
 *    - Tương tự các block khác, nếu không có `data` (đang ở Page Builder), ta hiện `MOCK_PRODUCTS`.
 * =================================================================================================
 */
export function ProductsBlock({
  data,
  title,
  type = "trending",
  count,
  columns,
  styles,
}: ProductsBlockProps) {
  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.products) {
    const MockComponent = type === "trending" ? TrendingProducts : NewArrivals;
    return (
      <div
        className="w-full"
        style={{
          backgroundColor: styles?.backgroundColor,
          color: styles?.textColor,
        }}
      >
        <div className="pointer-events-none">
          <MockComponent
            products={MOCK_PRODUCTS}
            title={title}
            count={count}
            columns={columns}
          />
        </div>
        <div className="container mx-auto px-4 pb-4 text-center">
          <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
            Preview Mode (Mock Data)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="container mx-auto px-4 mt-8">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12">
              <ProductsSkeleton count={4} />
            </div>
          }
        >
          <ProductsContent
            promise={data.products}
            type={type}
            title={title}
            count={count}
            columns={columns}
          />
        </Suspense>
      </div>
    </div>
  );
}
