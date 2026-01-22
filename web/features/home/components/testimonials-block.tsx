"use client";

import { TestimonialsCarousel } from "@/features/marketing/components/testimonials-carousel";
import { fadeInUp } from "@/lib/animations";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";

// Mock Data for Admin Review
const MOCK_TESTIMONIALS = [
  {
    text: "Absolutely love the quality of these furniture pieces. They transformed my living room completely!",
    author: "Sarah Jenkins",
    role: "Interior Designer",
    rating: 5,
  },
  {
    text: "Fast shipping and excellent customer service. The product looks exactly as described.",
    author: "Michael Chen",
    role: "Homeowner",
    rating: 5,
  },
  {
    text: "Minimalist design at its finest. Highly recommend for anyone looking to upgrade their space.",
    author: "Emma Watson",
    role: "Architect",
    rating: 4,
  },
];

interface TestimonialsBlockProps {
  title?: string;
  subtitle?: string;
  items?: Array<{
    text: string;
    author: string;
    role: string;
    rating?: number;
    avatar?: string;
  }>;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}


export function TestimonialsBlock({
  title,
  subtitle,
  items,
  styles,
}: TestimonialsBlockProps) {
  const t = useTranslations("home");

  // Use props items or mock items if in admin/empty state
  const displayItems = items && items.length > 0 ? items : MOCK_TESTIMONIALS;
  const isMock = !items || items.length === 0;

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <section className="bg-foreground/2 py-24 border-y border-foreground/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <m.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
              {subtitle || t("testimonials.subtitle")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
              {title || t("testimonials.title")}
            </h2>
          </m.div>
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={isMock ? "opacity-90 pointer-events-none" : ""}
          >
            <TestimonialsCarousel items={displayItems} />
            {isMock && (
              <div className="mt-8 text-center">
                <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                  Preview Mode
                </span>
              </div>
            )}
          </m.div>
        </div>
      </section>
    </div>
  );
}
