import { Link } from "@/i18n/routing";
import { productService } from "@/features/products/services/product.service";
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
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
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
                      {t("browseAllProducts")} ({brand._count?.products || 0}{" "}
                      items) →
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
