"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  activeImage?: string;
}

export function ProductImageGallery({ images, productName, activeImage }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  
  // Sync external activeImage changes
  if (activeImage && activeImage !== selectedImage) {
      setSelectedImage(activeImage);
  }

  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      {/* Main Image Stage */}
      <div 
        className="relative aspect-[4/5] lg:aspect-auto lg:h-[70vh] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900/50 group backdrop-blur-sm cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className={cn(
            "object-contain p-8 transition-transform duration-700 ease-out-expo",
            isZoomed ? "scale-110" : "scale-100"
          )}
          priority
          unoptimized
        />

        {/* Floating zoom hint */}
        <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                Zoom Ready
            </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedImage(img)}
            className={cn(
              "relative aspect-square rounded-2xl overflow-hidden border transition-all duration-300",
              selectedImage === img
                ? "border-primary ring-4 ring-primary/10 scale-95 opacity-100"
                : "border-white/10 opacity-70 hover:opacity-100 hover:border-primary/50 hover:scale-105"
            )}
          >
            <Image 
                src={img} 
                alt={`${productName} view ${i + 1}`} 
                fill 
                className="object-cover" 
            />
          </button>
        ))}
      </div>
    </div>
  );
}
