"use client";

import { CategoriesSkeleton } from "@/components/shared/skeletons/home-skeleton";
import { FeaturedCategories } from "@/features/categories/components/featured-categories";
import { Category } from "@/types/models";
import { Suspense, use } from "react";



// Mock Data for Admin Preview
const MOCK_CATEGORIES: Category[] = [
    { id: "1", name: "Modern Lighting", slug: "lighting", productCount: 156, imageUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=800&auto=format&fit=crop" } as any,
    { id: "2", name: "Ergonomic Chairs", slug: "chairs", productCount: 84, imageUrl: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop" } as any,
    { id: "3", name: "Wooden Tables", slug: "tables", productCount: 62, imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" } as any,
    { id: "4", name: "Minimalist Sofas", slug: "sofas", productCount: 95, imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop" } as any,
    { id: "5", name: "Decor Items", slug: "decor", productCount: 230, imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop" } as any,
];

interface CategoriesBlockProps {
  data?: {
    categories: Promise<Category[]>;
  };
  title?: string;
  columns?: number;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

function CategoriesContent({ promise, title, columns }: { promise: Promise<Category[]>, title?: string, columns?: number }) {
  const categories = use(promise);
  return <FeaturedCategories categories={categories} title={title} columns={columns} />;
}

export function CategoriesBlock({ data, title, columns, styles }: CategoriesBlockProps) {
  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.categories) {
      return (
        <div 
            className="w-full"
            style={{ 
                backgroundColor: styles?.backgroundColor,
                color: styles?.textColor
            }}
        >
            <div className="pointer-events-none">
                <FeaturedCategories 
                    categories={MOCK_CATEGORIES} 
                    title={title} 
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
            color: styles?.textColor
        }}
    >
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<div className="container mx-auto px-4 py-12"><CategoriesSkeleton /></div>}>
          <CategoriesContent promise={data.categories} title={title} columns={columns} />
        </Suspense>
      </div>
    </div>
  );
}
