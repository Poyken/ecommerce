"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/**
 * =====================================================================
 * EXPLORE COLLECTIONS - Section khám phá Danh mục & Thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TABS INTERACTION:
 * - Sử dụng `Tabs` component từ Radix UI.
 * - `activeTab` state giúp xác định link "View All" sẽ dẫn đến đâu (Category hay Brand).
 *
 * 2. DYNAMIC IMAGES:
 * - Sử dụng Unsplash API với các từ khóa tìm kiếm dựa trên tên danh mục.
 * - `group-hover:scale-110`: Hiệu ứng zoom nhẹ khi di chuột vào card.
 *
 * 3. RESPONSIVE GRID:
 * - `grid-cols-2 md:grid-cols-4`: Hiển thị 2 cột trên mobile và 4 cột trên desktop.
 * =====================================================================
 */

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ExploreCollectionsProps {
  categories: Category[];
  brands: Brand[];
}

export function ExploreCollections({
  categories,
  brands,
}: ExploreCollectionsProps) {
  const [activeTab, setActiveTab] = useState("categories");
  const t = useTranslations("home.explore");

  return (
    <section>
      <Tabs
        defaultValue="categories"
        onValueChange={setActiveTab}
        className="w-full gap-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <TabsList className="flex items-center gap-2 bg-foreground/2 dark:bg-white/2 p-1.5 rounded-full border border-foreground/5 h-auto">
            <TabsTrigger
              value="categories"
              className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 font-bold uppercase text-xs tracking-widest"
            >
              {t("categories")}
            </TabsTrigger>
            <TabsTrigger
              value="brands"
              className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 font-bold uppercase text-xs tracking-widest"
            >
              {t("brands")}
            </TabsTrigger>
          </TabsList>

          <Link
            href={activeTab === "categories" ? "/categories" : "/brands"}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors duration-300"
          >
            {t("viewAll", {
              type: activeTab === "categories" ? t("categories") : t("brands"),
            })}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </Link>
        </div>

        <TabsContent value="categories">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="group relative aspect-4/3 overflow-hidden rounded-4xl bg-neutral-900 border border-foreground/5 shadow-xl hover:shadow-2xl transition-shadow duration-500"
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent z-10" />
                <Image
                  src={
                    cat.name.toLowerCase().includes("sofa")
                      ? "/images/categories/sofa.jpg"
                      : cat.name.toLowerCase().includes("chair")
                      ? "/images/categories/chair.jpg"
                      : cat.name.toLowerCase().includes("table")
                      ? "/images/categories/table.jpg"
                      : cat.name.toLowerCase().includes("bed")
                      ? "/images/categories/bed.jpg"
                      : cat.name.toLowerCase().includes("storage")
                      ? "/images/categories/storage.jpg"
                      : cat.name.toLowerCase().includes("outdoor")
                      ? "/images/categories/outdoor.jpg"
                      : cat.name.toLowerCase().includes("rug")
                      ? "/images/categories/rug.jpg"
                      : cat.name.toLowerCase().includes("light")
                      ? "/images/categories/light.jpg"
                      : cat.name.toLowerCase().includes("accessor")
                      ? "/images/categories/accessor.jpg"
                      : "/images/categories/default.jpg"
                  }
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
                <div className="absolute bottom-5 left-5 z-20">
                  <h3 className="text-white font-black text-xl group-hover:text-primary transition-colors duration-300 tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">
                    {t("exploreCollection")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brands">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {brands.slice(0, 4).map((brand, index) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group relative aspect-4/3 overflow-hidden rounded-4xl bg-neutral-900 border border-foreground/5 shadow-xl hover:shadow-2xl hover:shadow-accent/10 transition-shadow duration-500"
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent z-10" />
                <Image
                  src={
                    [
                      "/images/brands/brand1.jpg",
                      "/images/brands/brand2.jpg",
                      "/images/brands/brand3.jpg",
                      "/images/brands/brand4.jpg",
                    ][index % 4]
                  }
                  alt={brand.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out opacity-80"
                />
                <div className="absolute bottom-5 left-5 z-20">
                  <h3 className="text-white font-black text-xl group-hover:text-accent transition-colors duration-300 tracking-tight">
                    {brand.name}
                  </h3>
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-1">
                    {t("viewProducts")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
