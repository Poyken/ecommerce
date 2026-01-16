import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * =====================================================================
 * CATEGORIES PAGE - Trang danh sách danh mục với hình ảnh
 * =====================================================================
 */

// Category images mapping based on category name
const CATEGORY_IMAGES: Record<string, string> = {
  sofas: "/images/categories/sofa.jpg",
  chairs: "/images/categories/chair.jpg",
  tables: "/images/categories/table.jpg",
  storage: "/images/categories/storage.jpg",
  beds: "/images/categories/bed.jpg",
  outdoor: "/images/categories/outdoor.jpg",
  rugs: "/images/categories/rug.jpg",
  lighting: "/images/categories/light.jpg",
  accessories: "/images/categories/accessor.jpg",
  outlet: "/images/categories/outlet.jpg",
};

function getCategoryImage(
  categoryName: string,
  imageUrl?: string | null
): string {
  if (imageUrl) return imageUrl;
  const key = categoryName.toLowerCase();
  return CATEGORY_IMAGES[key] || "/images/categories/default.jpg";
}

/**
 * =================================================================================================
 * CATEGORIES PAGE - DANH SÁCH DANH MỤC SẢN PHẨM
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC CATEGORY ASSETS:
 *    - `getCategoryImage`: Hàm helper dùng để map giữa tên danh mục và ảnh minh họa.
 *    - Giúp giao diện sinh động hơn thay vì chỉ dùng text, đồng thời hỗ trợ fallback về ảnh mặc định.
 *
 * 2. AGGREGATE COUNTING:
 *    - `category._count.products`: Sử dụng tính năng `include` của Prisma để lấy số lượng sản phẩm.
 *    - Việc này giúp User biết mỗi danh mục có bao nhiêu item trước khi click vào.
 *
 * 3. SEO & UX:
 *    - Sử dụng `pt-24` để dành chỗ cho Header (Sticky Header) không đè lên nội dung. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Intuitive Catalog Navigation: Giúp khách hàng bao quát toàn bộ hệ thống sản phẩm theo các nhóm chức năng, dễ dàng bắt đầu hành trình mua sắm từ danh mục họ quan tâm.
 * - Visual Category Discovery: Tăng cường trải nghiệm thị giác bằng cách sử dụng hình ảnh minh họa sống động, giúp người dùng nhận diện nhóm sản phẩm nhanh hơn so với đọc văn bản thuần túy.

 * =================================================================================================
 */
export default async function CategoriesPage() {
  const { getCategoriesAction } = await import("@/features/products/actions");
  const [categoriesRes, t] = await Promise.all([
    getCategoriesAction(),
    getTranslations("common"),
  ]);
  const categories = categoriesRes.success ? categoriesRes.data : [];

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
            {t("ourCollection")}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mt-2">
            {t("browseCategories").split(" ")[0]}{" "}
            <span className="font-serif italic font-normal text-muted-foreground">
              {t("categories")}
            </span>
          </h1>
          <div className="w-24 h-1 bg-accent/40 rounded-full mx-auto mt-4" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group"
              >
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-muted border border-border/50 hover:border-accent/30 transition-all duration-500 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1">
                  <Image
                    src={getCategoryImage(category.name, category.imageUrl)}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="text-white text-lg md:text-xl font-bold tracking-tight group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-white/60 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {t("browseAllProducts")} ({category._count?.products || 0}{" "}
                      items) →
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("noCategoriesAvailable")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
