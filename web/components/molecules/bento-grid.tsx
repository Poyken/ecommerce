"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

/**
 * =====================================================================
 * BENTO GRID - Trending Asymmetric Layout for Product Discovery
 * =====================================================================
 *
 * 📚 DESIGN CONCEPT:
 *
 * 1. BENTO GRID LAYOUT:
 * - Inspired by Japanese Bento box design - asymmetric, balanced, visually striking
 * - Featured cell spans 2 rows for hero product placement
 * - Other cells provide secondary product highlights
 *
 * 2. QUIET LUXURY AESTHETIC:
 * - Subtle borders with champagne glow on hover
 * - Editorial typography with serif headings
 * - Minimal text overlay for clean, airy feel
 * =====================================================================
 */

interface BentoItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  href: string;
  featured?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export function BentoGrid({ items, className }: BentoGridProps) {
  if (items.length === 0) return null;

  const featuredItem = items.find((item) => item.featured) || items[0];
  const regularItems = items.filter((item) => item.id !== featuredItem.id).slice(0, 3);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
        className
      )}
    >
      {/* Featured Cell - Spans 2 rows on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="md:col-span-1 lg:row-span-2"
      >
        <BentoCell item={featuredItem} featured />
      </motion.div>

      {/* Regular Cells */}
      {regularItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 * (index + 1), ease: [0.16, 1, 0.3, 1] }}
        >
          <BentoCell item={item} />
        </motion.div>
      ))}
    </div>
  );
}

function BentoCell({ item, featured = false }: { item: BentoItem; featured?: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl lg:rounded-3xl",
        "bg-card border border-border",
        "transition-all duration-700 ease-[0.16,1,0.3,1]",
        "hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10",
        featured ? "h-[400px] md:h-[500px] lg:h-full min-h-[500px]" : "h-[240px] md:h-[280px]"
      )}
    >
      {/* Image */}
      <div className="absolute inset-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-105"
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t transition-opacity duration-500",
          featured
            ? "from-black/70 via-black/20 to-transparent"
            : "from-black/60 via-transparent to-transparent"
        )}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white z-10">
        {item.subtitle && (
          <span
            className={cn(
              "font-medium uppercase tracking-[0.15em] mb-2 opacity-70",
              featured ? "text-xs" : "text-[10px]"
            )}
          >
            {item.subtitle}
          </span>
        )}
        <h3
          className={cn(
            "font-serif font-medium leading-tight mb-4 tracking-tight",
            featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
          )}
        >
          {item.title}
        </h3>
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            "transition-all duration-500 opacity-0 translate-y-2",
            "group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          <span className="uppercase tracking-wider text-xs">Discover</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* Champagne Border Glow on Hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl lg:rounded-3xl pointer-events-none",
          "border border-transparent transition-all duration-500",
          "group-hover:border-accent/30 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        )}
      />
    </Link>
  );
}

export default BentoGrid;
