"use client";


import { CategoryCard } from "@/features/categories/components/category-card";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemScaleVariant, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Category } from "@/types/models";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeaturedCategoriesProps {
  categories: Category[];
  columns?: number;
  title?: string;
  subtitle?: string;
  layout?: "grid" | "carousel" | "masonry";
  cardStyle?: "default" | "luxury" | "minimal";
  alignment?: "left" | "center" | "right";
  animationType?: "fade" | "slide" | "zoom";
}

export function FeaturedCategories({
  categories,
  columns = 4,
  title,
  subtitle,
  layout = "grid",
  cardStyle = "default",
  alignment = "left",
  animationType = "fade",
}: FeaturedCategoriesProps) {
  const t = useTranslations("home");

  const desktopCols =
    {
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    }[columns] || "md:grid-cols-4";

  return (
    <section className="w-full">
      <m.div
        className={cn(
          "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
          alignment === "center" && "items-center text-center flex-col",
          alignment === "right" && "items-end text-right flex-col",
          alignment === "left" && "items-start text-left"
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="flex flex-col space-y-3">
          <m.span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] block">
            {t("featuredCollections")}
          </m.span>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-foreground leading-tight">
            {title || t("featuredCategories")}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm max-w-lg font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex",
            alignment === "center" ? "justify-center" : "justify-end"
          )}
        >
          <Link
            href="/categories"
            className="group text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all flex items-center gap-3"
          >
            <span className="relative">
              {t("viewAllCategories")}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </Link>
        </div>
      </m.div>

      <m.div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8",
          desktopCols
        )}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {categories.slice(0, 8).map((category, idx) => (
          <m.div
            key={category.id}
            variants={
              animationType === "zoom"
                ? itemScaleVariant
                : animationType === "slide"
                ? fadeInUp
                : { visible: { opacity: 1 }, hidden: { opacity: 0 } }
            }
          >
            <CategoryCard
              id={category.id}
              name={category.name}
              count={category.productCount || 0}
              imageUrl={category.imageUrl || undefined}
              className={cn(
                cardStyle === "luxury" && "luxury-card-class", // We can add specific classes here
                cardStyle === "minimal" && "border-none bg-transparent p-0"
              )}
            />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
