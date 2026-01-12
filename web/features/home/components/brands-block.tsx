/**
 * =====================================================================
 * BRANDS BLOCK - HIỂN THỊ THƯƠNG HIỆU ĐỐI TÁC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Một Block trên trang chủ dùng để list danh sách logo các thương hiệu.
 * - Hỗ trợ Mock Data khi ở chế độ Preview trong Admin.
 * - Sử dụng Suspense để loading data từ API mượt mà. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { BrandsSkeleton } from "@/features/home/components/skeletons/home-skeleton";
import { FeaturedBrands } from "@/features/brands/components/featured-brands";
import { Brand } from "@/types/models";
import { Suspense, use } from "react";

// Mock Data for Admin Preview
const MOCK_BRANDS: Brand[] = [
  {
    id: "1",
    name: "Modernist",
    imageUrl:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop",
    _count: { products: 45 },
  } as any,
  {
    id: "2",
    name: "Luxe Living",
    imageUrl:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop",
    _count: { products: 32 },
  } as any,
  {
    id: "3",
    name: "Artisan Wood",
    imageUrl:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop",
    _count: { products: 28 },
  } as any,
  {
    id: "4",
    name: "Nordic Home",
    imageUrl:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop",
    _count: { products: 67 },
  } as any,
];

interface BrandsBlockProps {
  data?: {
    brands: Promise<Brand[]>;
  };
  title?: string;
  subtitle?: string;
  opacity?: number;
  grayscale?: boolean;
  layout?: "grid" | "carousel";
  logoSize?: "sm" | "md" | "lg";
  hoverEffect?: "scale" | "lift" | "glow";
  alignment?: "left" | "center";
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

function BrandsContent({
  promise,
  ...props
}: {
  promise: Promise<Brand[]>;
} & Omit<BrandsBlockProps, "data">) {
  const brands = use(promise);
  return <FeaturedBrands brands={brands} {...props} />;
}

export function BrandsBlock({
  data,
  title,
  subtitle,
  opacity,
  grayscale,
  layout,
  logoSize,
  hoverEffect,
  alignment,
  styles,
}: BrandsBlockProps) {
  const containerStyle = {
    backgroundColor: styles?.backgroundColor,
    color: styles?.textColor,
    paddingTop: styles?.paddingTop,
    paddingBottom: styles?.paddingBottom,
  };

  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.brands) {
    return (
      <div className="w-full" style={containerStyle}>
        <div className="container mx-auto px-4 py-12">
          <div className="pointer-events-none">
            <FeaturedBrands
              brands={MOCK_BRANDS}
              title={title}
              subtitle={subtitle}
              opacity={opacity}
              grayscale={grayscale}
              layout={layout}
              logoSize={logoSize}
              hoverEffect={hoverEffect}
              alignment={alignment}
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
              <BrandsSkeleton />
            </div>
          }
        >
          <BrandsContent
            promise={data.brands}
            title={title}
            subtitle={subtitle}
            opacity={opacity}
            grayscale={grayscale}
            layout={layout}
            logoSize={logoSize}
            hoverEffect={hoverEffect}
            alignment={alignment}
          />
        </Suspense>
      </div>
    </div>
  );
}
