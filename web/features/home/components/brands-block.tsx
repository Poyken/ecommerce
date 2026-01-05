"use client";

import { BrandsSkeleton } from "@/components/shared/skeletons/home-skeleton";
import { FeaturedBrands } from "@/features/brands/components/featured-brands";
import { Brand } from "@/types/models";
import { Suspense, use } from "react";



// Mock Data for Admin Preview
const MOCK_BRANDS: Brand[] = [
    { id: "1", name: "Modernist", imageUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop", _count: { products: 45 } } as any,
    { id: "2", name: "Luxe Living", imageUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop", _count: { products: 32 } } as any,
    { id: "3", name: "Artisan Wood", imageUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop", _count: { products: 28 } } as any,
    { id: "4", name: "Nordic Home", imageUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&auto=format&fit=crop", _count: { products: 67 } } as any,
];

interface BrandsBlockProps {
  data?: {
    brands: Promise<Brand[]>;
  };
  title?: string;
  subtitle?: string;
  opacity?: number;
  grayscale?: boolean;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

function BrandsContent({
    promise,
    title,
    subtitle,
    opacity,
    grayscale
}: {
    promise: Promise<Brand[]>,
    title?: string,
    subtitle?: string,
    opacity?: number,
    grayscale?: boolean
}) {
  const brands = use(promise);
  return <FeaturedBrands brands={brands} title={title} subtitle={subtitle} opacity={opacity} grayscale={grayscale} />;
}

export function BrandsBlock({ data, title, subtitle, opacity, grayscale, styles }: BrandsBlockProps) {
  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.brands) {
      return (
        <div 
            className="w-full"
            style={{ 
                backgroundColor: styles?.backgroundColor,
                color: styles?.textColor
            }}
        >
            <div className="pointer-events-none">
                <FeaturedBrands 
                    brands={MOCK_BRANDS} 
                    title={title} 
                    subtitle={subtitle} 
                    opacity={opacity} 
                    grayscale={grayscale} 
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
            color: styles?.textColor
        }}
    >
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<div className="container mx-auto px-4 py-12"><BrandsSkeleton /></div>}>
          <BrandsContent promise={data.brands} title={title} subtitle={subtitle} opacity={opacity} grayscale={grayscale} />
        </Suspense>
      </div>
    </div>
  );
}
