/**
 * =====================================================================
 * GALLERY BLOCK - BỘ SƯU TẬP ẢNH LUXURY
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Hiển thị hình ảnh theo dạng lưới (Grid) với nhiều kích thước khác nhau.
 * Khi click vào ảnh sẽ có hiệu ứng Dialog phóng to (Lightbox). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
  category?: string;
  span?: "normal" | "wide" | "tall" | "large";
}

interface GalleryBlockProps {
  title?: string;
  subtitle?: string;
  images?: GalleryImage[];
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

const spanClasses = {
  normal: "row-span-1 col-span-1",
  wide: "row-span-1 col-span-2",
  tall: "row-span-2 col-span-1",
  large: "row-span-2 col-span-2",
};

export function GalleryBlock({
  title = "Our Masterpieces",
  subtitle = "A curated selection of our finest arrangements and designs",
  images = [
    {
      src: "/images/home/hero-luxury.jpg",
      alt: "Living Room",
      title: "Velvet Elegance",
      category: "Interior",
      span: "large",
    },
    {
      src: "/images/home/promo-furniture.jpg",
      alt: "Dining Room",
      title: "Modernist Table",
      category: "Furniture",
      span: "tall",
    },
    {
      src: "/images/home/promo-living.jpg",
      alt: "Bedroom",
      title: "Soft Serenity",
      category: "Bedroom",
      span: "normal",
    },
    {
      src: "/images/home/hero-luxury.jpg",
      alt: "Detail",
      title: "Craftsmanship",
      category: "Detail",
      span: "normal",
    },
    {
      src: "/images/home/promo-furniture.jpg",
      alt: "Office",
      title: "Productive Focus",
      category: "Office",
      span: "wide",
    },
  ],
  styles,
}: GalleryBlockProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <section
      className="py-24 px-4 overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif font-medium mb-4"
          >
            {title}
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto italic font-serif"
          >
            {subtitle}
          </m.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4 h-[1000px] md:h-[800px]">
          {images.map((img, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative rounded-4xl overflow-hidden cursor-pointer group",
                spanClasses[img.span || "normal"]
              )}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
                  {img.category}
                </span>
                <h3 className="text-white text-2xl font-serif">{img.title}</h3>
              </div>
            </m.div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none">
          {selectedImage && (
            <div className="relative aspect-video w-full h-full">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
