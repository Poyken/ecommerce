"use client";

import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { fadeInLeft, fadeInRight } from "@/lib/animations";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PromoItem {
  tag: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl: string;
  buttonText: string;
}

interface PromoGridBlockProps {
  items?: [PromoItem, PromoItem];
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * =================================================================================================
 * PROMO GRID BLOCK - KHỐI KHUYẾN MÃI (BANNERS PHỤ)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MOTION VARIANTS (L-R ANIMATION):
 *    - Sử dụng `fadeInLeft` cho item đầu và `fadeInRight` cho item thứ hai.
 *    - `margin: "-100px"` trong `viewport`: Kích hoạt animation sớm hơn trước khi item xuất hiện hoàn toàn.
 *
 * 2. IMAGE OPTIMIZATION:
 *    - `Image` component của Next.js với thuộc tính `fill`: Phải bọc trong div cha có `relative`.
 *    - `sizes` giúp trình duyệt tải kích thước ảnh phù hợp (Responsive Images).
 *
 * 3. HOVER TRANSLATIONS:
 *    - Hiệu ứng `scale-110` kết hợp `duration-700` tạo cảm giác chuyển động mượt mà. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function PromoGridBlock({ items, styles }: PromoGridBlockProps) {
  const t = useTranslations("home");

  const defaultItems: [PromoItem, PromoItem] = [
    {
      tag: "Exclusive",
      title: t("womensCollection"),
      subtitle: t("exploreTrends"),
      link: "/shop?categoryId=living-room",
      imageUrl: "/images/home/promo-living.jpg",
      buttonText: t("shopNow"),
    },
    {
      tag: "Essentials",
      title: t("mensEssentials"),
      subtitle: t("timelessClassics"),
      link: "/shop?categoryId=dining-space",
      imageUrl: "/images/home/promo-dining.jpg",
      buttonText: t("discover"),
    },
  ];

  const promos = items || defaultItems;

  return (
    <section
      className="container mx-auto px-4 overflow-hidden py-12"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {promos.map((item, idx) => (
          <m.div
            key={idx}
            className="relative h-[45vh] min-h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={idx === 0 ? fadeInLeft : fadeInRight}
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-10 text-white z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-80">
                {item.tag}
              </span>
              <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                {item.title}
              </h3>
              <p className="text-sm mb-6 text-white/70 font-medium max-w-xs leading-relaxed">
                {item.subtitle}
              </p>
              <TypedLink
                href={item.link as AppRoute}
                className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all duration-300 shadow-xl"
              >
                {item.buttonText}
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </TypedLink>
            </div>
          </m.div>
        ))}
      </div>
    </section>
  );
}
