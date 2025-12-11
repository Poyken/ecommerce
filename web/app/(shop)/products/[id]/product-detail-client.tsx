"use client";

import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Check, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { ProductVariantSelector } from "./product-variant-selector";

interface Sku {
  id: string;
  skuCode: string;
  price: number;
  salePrice: number | null;
  stock: number;
  imageUrl: string | null;
  optionValues: any[];
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description: string;
    skus: Sku[];
    options: any[];
    brand: { name: string };
    category: { name: string };
  };
  initialImages: string[];
  isLoggedIn: boolean;
}

export function ProductDetailClient({ product, initialImages, isLoggedIn }: ProductDetailClientProps) {
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      {/* Immersive Image Gallery (Sticky) */}
      <div className="lg:col-span-7">
        <ProductImageGallery 
            images={initialImages} 
            productName={product.name} 
            activeImage={activeImage}
        />
      </div>

      {/* Product Info (Scrollable) */}
      <div className="lg:col-span-5 flex flex-col gap-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">
              {product.brand?.name || "Premium Brand"}
            </span>
            <div className="h-px w-8 bg-primary/30"></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {product.category?.name || "Collection"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            {product.name}
          </h1>

          {/* Rating Mock */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex text-amber-400 gap-0.5">
              {"★★★★★".split("").map((star, i) => (
                <span key={i} className="text-lg">
                  {star}
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              (128 Verified Reviews)
            </span>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 border-l-2 border-white/10 pl-6">
            {product.description}
          </p>
        </div>

        {/* Selectors & Actions inside Glass Card */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <GlassCard className="p-6 md:p-8 space-y-8 backdrop-blur-xl bg-white/5 border-white/10">
            <ProductVariantSelector
              options={product.options}
              skus={product.skus}
              isLoggedIn={isLoggedIn}
              onSkuChange={(sku) => {
                  if (sku?.imageUrl) {
                      setActiveImage(sku.imageUrl);
                  }
              }}
            />

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>Free Global Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>2-Year Warranty</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>Authenticity Verified</span>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Reviews Section Title - Reviews component is rendered by parent */}
         <div className="pt-8 border-t border-white/5">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tight">Customer Reviews</h3>
                <GlassButton size="sm" variant="secondary">Write a Review</GlassButton>
            </div>
            {/* Slot for reviews if we wanted */}
            <ProductReviews productId={product.id} />
         </div>
      </div>
    </div>
  );
}
