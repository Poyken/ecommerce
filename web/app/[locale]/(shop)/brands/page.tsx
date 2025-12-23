import { Link } from "@/i18n/routing";
import { productService } from "@/services/product.service";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * =====================================================================
 * BRANDS PAGE - Trang danh sách thương hiệu với hình ảnh
 * =====================================================================
 */

// Brand images mapping based on brand name
const BRAND_IMAGES: Record<string, string> = {
  minotti:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
  "b&b italia":
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop",
  "roche bobois":
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=400&fit=crop",
  poliform:
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=400&fit=crop",
  cassina:
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop",
  "fendi casa":
    "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600&h=400&fit=crop",
  "versace home":
    "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=400&fit=crop",
  "restoration hardware":
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop",
  knoll:
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=400&fit=crop",
  "herman miller":
    "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600&h=400&fit=crop",
};

function getBrandImage(brandName: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  const key = brandName.toLowerCase();
  return (
    BRAND_IMAGES[key] ||
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&h=400&fit=crop"
  );
}

export default async function BrandsPage() {
  const [brands, t] = await Promise.all([
    productService.getBrands(),
    getTranslations("common"),
  ]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/"
          className="text-accent hover:underline mb-6 inline-flex items-center gap-2 text-sm font-medium"
        >
          ← {t("backToHome")}
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px]">
            {t("luxuryPartners")}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mt-2">
            {t("browseBrands").split(" ").slice(0, -1).join(" ")}{" "}
            <span className="font-serif italic font-normal text-muted-foreground">
              {t("browseBrands").split(" ").slice(-1)}
            </span>
          </h1>
          <div className="w-24 h-1 bg-accent/40 rounded-full mx-auto mt-4" />
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {brands && brands.length > 0 ? (
            brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group"
              >
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-muted border border-border/50 hover:border-accent/30 transition-all duration-500 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1">
                  <Image
                    src={getBrandImage(brand.name, brand.imageUrl)}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="text-white text-lg md:text-xl font-bold tracking-tight group-hover:text-accent transition-colors">
                      {brand.name}
                    </h3>
                    <p className="text-white/60 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {t("browseAllProducts")} →
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("noBrandsAvailable")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
