"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { m } from "@/lib/animations";
import { useTranslations } from "next-intl";

interface BrandsClientProps {
  brands: any[];
}

const BRAND_IMAGES: Record<string, string> = {
  minotti: "/images/brands/brand1.jpg",
  "b&b italia": "/images/brands/brand2.jpg",
  "roche bobois": "/images/brands/brand3.jpg",
  poliform: "/images/brands/brand4.jpg",
  cassina: "/images/brands/cassina.jpg",
  "fendi casa": "/images/brands/brand1.jpg",
  "versace home": "/images/brands/brand2.jpg",
  "restoration hardware": "/images/brands/brand3.jpg",
  knoll: "/images/brands/brand4.jpg",
  "herman miller": "/images/brands/herman_miller.jpg",
};

function getBrandImage(brandName: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  const key = brandName.toLowerCase();
  return BRAND_IMAGES[key] || "/images/categories/default.jpg";
}

export function BrandsClient({ brands }: BrandsClientProps) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden transition-colors duration-500 font-sans">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10 pt-32 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
          <div className="space-y-6">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Sparkles className="size-3" />
              <span>{t("luxuryPartners")}</span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40"
            >
              <span className="block">{t("browseBrands").split(" ").slice(0, -1).join(" ")}</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">
                {t("browseBrands").split(" ").slice(-1)}
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground/80 font-medium max-w-xl"
            >
              {t("brandDescription") || "Discover our curated selection of world-class design houses and artisans."}
            </m.p>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {brands && brands.length > 0 ? (
            brands.map((brand, index) => (
              <m.div
                key={brand.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={`/brands/${brand.id}`}
                  className="group block"
                >
                  <div className="relative aspect-4/5 rounded-4xl overflow-hidden glass-card border-none group-hover:scale-[1.02] transition-all duration-700 shadow-2xl">
                    <Image
                      src={getBrandImage(brand.name, brand.imageUrl)}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    />
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Neo-Brutalism Content */}
                    <div className="absolute inset-x-0 bottom-0 p-8 space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-[2px] bg-accent/60 group-hover:w-12 transition-all duration-500" />
                         <span className="text-[10px] uppercase tracking-widest text-accent font-black">
                           {brand._count?.products || 0} {t("items")}
                         </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tighter line-clamp-1 group-hover:text-accent transition-colors duration-500">
                        {brand.name}
                      </h3>
                      <div className="flex items-center gap-2 text-white/40 group-hover:text-white transition-colors duration-500">
                        <span className="text-xs font-black uppercase tracking-widest">{t("browseAllProducts")}</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </m.div>
            ))
          ) : (
            <div className="col-span-full py-24 glass-card rounded-4xl text-center">
              <p className="text-muted-foreground font-medium">{t("noBrandsAvailable")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
