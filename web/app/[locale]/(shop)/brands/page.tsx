import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * =====================================================================
 * BRANDS PAGE - Trang danh sách thương hiệu với hình ảnh
 * =====================================================================
 */

// Brand images mapping based on brand name
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

/**
 * =================================================================================================
 * BRANDS LISTING PAGE - DANH SÁCH THƯƠNG HIỆU ĐỐI TÁC
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. IMAGE MAPPING STRATEGY:
 *    - `BRAND_IMAGES` là giải pháp tạm thời để map các brand nổi tiếng với ảnh chất lượng cao
 *      trong thư mục `/public`. Nếu Brand nào có `imageUrl` từ CMS thì sẽ ưu tiên dùng cái đó.
 *
 * 2. PERFORMANCE:
 *    - Sử dụng `Promise.all` để fetch song song cả danh sách Brand và bản dịch (Translations).
 *    - Giảm tổng thời gian chờ đợi tại Server (Server Side Rendering).
 *
 * 3. RESPONSIVE GRID:
 *    - Grid tự thay đổi số cột từ 2 (mobile) lên tới 5 (màn hình cực lớn).
 *    - Hiệu ứng `translate-y-1` và `shadow-xl` khi hover tạo trải nghiệm tương tác mượt mà. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Brand Equity Showcase: Tôn vinh giá trị của các đối tác sản xuất bằng cách dành riêng một khu vực hiển thị logo và hình ảnh đại diện, nâng cấp sự sang trọng của toàn bộ hệ thống Storefront.
 * - Multi-vendor Visibility: Giúp khách hàng trung thành với một thương hiệu cụ thể dễ dàng tìm thấy tất cả các sản phẩm liên quan, tạo ra một trải nghiệm mua sắm theo hướng "Concept Store".

 * =================================================================================================
 */
export default async function BrandsPage() {
  const { getBrandsAction } = await import("@/features/products/actions");
  const [brandsRes, t] = await Promise.all([
    getBrandsAction(),
    getTranslations("common"),
  ]);
  const brands = brandsRes.success ? brandsRes.data : [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-cinematic pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--aurora-blue)/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-(--aurora-purple)/10 rounded-full blur-[100px] animate-float pointer-events-none" />

      <div className="container mx-auto px-4 pt-32 pb-24 relative z-10">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Sparkles className="size-3" />
            {t("luxuryPartners")}
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter"
          >
            {t("browseBrands").split(" ").slice(0, -1).join(" ")}{" "}
            <span className="font-serif italic font-normal text-muted-foreground/60">
              {t("browseBrands").split(" ").slice(-1)}
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium"
          >
            {t("brandDescription") || "Discover our curated selection of world-class design houses and artisans."}
          </m.p>
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

import { ArrowRight, Sparkles } from "lucide-react";
import { m } from "@/lib/animations";
