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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-cinematic pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--aurora-orange)/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-(--aurora-blue)/10 rounded-full blur-[100px] animate-float pointer-events-none" />

      <div className="container mx-auto px-4 pt-32 pb-24 relative z-10">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Sparkles className="size-3" />
            {t("ourCollection")}
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter"
          >
            {t("browseCategories").split(" ")[0]}{" "}
            <span className="font-serif italic font-normal text-muted-foreground/60">
              {t("categories")}
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium"
          >
            {t("categoryDescription") || "Browse through our expertly crafted categories designed to elevate your living spaces."}
          </m.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {categories && categories.length > 0 ? (
            categories.map((category, index) => (
              <m.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={`/categories/${category.id}`}
                  className="group block"
                >
                  <div className="relative aspect-4/5 rounded-4xl overflow-hidden glass-card border-none group-hover:scale-[1.02] transition-all duration-700 shadow-2xl">
                    <Image
                      src={getCategoryImage(category.name, category.imageUrl)}
                      alt={category.name}
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
                           {category._count?.products || 0} {t("items")}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tighter line-clamp-1 group-hover:text-accent transition-colors duration-500">
                        {category.name}
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
              <p className="text-muted-foreground font-medium">{t("noCategoriesAvailable")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { ArrowRight, Sparkles } from "lucide-react";
import { m } from "@/lib/animations";
