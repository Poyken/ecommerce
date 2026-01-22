

"use client";

import { CategoriesSkeleton } from "@/features/home/components/skeletons/home-skeleton";
import { FeaturedCategories } from "@/features/categories/components/featured-categories";
import { Category } from "@/types/models";
import { Suspense, use } from "react";

// Mock Data for Admin Preview
const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Modern Lighting",
    slug: "lighting",
    productCount: 156,
    imageUrl:
      "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Ergonomic Chairs",
    slug: "chairs",
    productCount: 84,
    imageUrl:
      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Wooden Tables",
    slug: "tables",
    productCount: 62,
    imageUrl:
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Minimalist Sofas",
    slug: "sofas",
    productCount: 95,
    imageUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Decor Items",
    slug: "decor",
    productCount: 230,
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface CategoriesBlockProps {
  data?: {
    categories: Promise<Category[]>;
  };
  title?: string;
  subtitle?: string;
  columns?: number;
  layout?: "grid" | "carousel" | "masonry";
  cardStyle?: "default" | "luxury" | "minimal";
  alignment?: "left" | "center" | "right";
  animationType?: "fade" | "slide" | "zoom";
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

function CategoriesContent({
  promise,
  ...props
}: {
  promise: Promise<Category[]>;
} & Omit<CategoriesBlockProps, "data">) {
  const categories = use(promise);
  return <FeaturedCategories categories={categories} {...props} />;
}

export function CategoriesBlock({
  data,
  title,
  subtitle,
  columns,
  layout,
  cardStyle,
  alignment,
  animationType,
  styles,
}: CategoriesBlockProps) {
  const containerStyle = {
    backgroundColor: styles?.backgroundColor,
    color: styles?.textColor,
    paddingTop: styles?.paddingTop,
    paddingBottom: styles?.paddingBottom,
  };

  // Admin Preview Mode: If no data context, show Mock Data instead of Skeleton
  if (!data?.categories) {
    return (
      <div className="w-full" style={containerStyle}>
        <div className="container mx-auto px-4 py-12">
          <div className="pointer-events-none">
            <FeaturedCategories
              categories={MOCK_CATEGORIES}
              title={title}
              subtitle={subtitle}
              columns={columns}
              layout={layout}
              cardStyle={cardStyle}
              alignment={alignment}
              animationType={animationType}
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
              <CategoriesSkeleton />
            </div>
          }
        >
          <CategoriesContent
            promise={data.categories}
            title={title}
            subtitle={subtitle}
            columns={columns}
            layout={layout}
            cardStyle={cardStyle}
            alignment={alignment}
            animationType={animationType}
          />
        </Suspense>
      </div>
    </div>
  );
}
