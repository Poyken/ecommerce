/**
 * =====================================================================
 * PRODUCTS BLOCK - HIỂN THỊ DANH SÁCH SẢN PHẨM CMS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Block quan trọng nhất để bán hàng trên Landing Page.
 * - Type "trending": Lấy các sản phẩm bán chạy.
 * - Type "new_arrivals": Lấy sản phẩm mới nhất.
 * - CardStyle: Hỗ trợ nhiều phong cách hiển thị sản phẩm khác nhau. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { ProductsSkeleton } from "@/features/home/components/skeletons/home-skeleton";
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
  subtitle?: string;
  type?: "trending" | "new_arrivals";
  count?: number;
  columns?: number;
  layout?: "grid" | "carousel";
  alignment?: "left" | "center";
  cardStyle?: "default" | "luxury" | "minimal";
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

function ProductsContent({
  promise,
  type,
  ...props
}: {
  promise: Promise<Product[]>;
} & Omit<ProductsBlockProps, "data">) {
  const products = use(promise);
  if (type === "trending")
    return <TrendingProducts products={products} {...props} />;
  return <NewArrivals products={products} {...props} />;
}

export function ProductsBlock({
  data,
  title,
  subtitle,
  type = "trending",
  count,
  columns,
  layout,
  alignment,
  cardStyle,
  styles,
}: ProductsBlockProps) {
  const containerStyle = {
    backgroundColor: styles?.backgroundColor,
    color: styles?.textColor,
    paddingTop: styles?.paddingTop,
    paddingBottom: styles?.paddingBottom,
  };

  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.products) {
    const MockComponent = type === "trending" ? TrendingProducts : NewArrivals;
    return (
      <div className="w-full" style={containerStyle}>
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="pointer-events-none">
            <MockComponent
              products={MOCK_PRODUCTS}
              title={title}
              subtitle={subtitle}
              count={count}
              columns={columns}
              layout={layout}
              alignment={alignment}
              cardStyle={cardStyle}
            />
          </div>
          <div className="mt-8 text-center">
            <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold bg-secondary/50 text-muted-foreground rounded-full border border-border">
              Preview Mode (Mock Data)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={containerStyle}>
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28">
        <Suspense
          fallback={
            <div className="container mx-auto">
              <ProductsSkeleton count={count || 4} />
            </div>
          }
        >
          <ProductsContent
            promise={data.products}
            type={type}
            title={title}
            subtitle={subtitle}
            count={count}
            columns={columns}
            layout={layout}
            alignment={alignment}
            cardStyle={cardStyle}
          />
        </Suspense>
      </div>
    </div>
  );
}
