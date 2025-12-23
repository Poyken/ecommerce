import { Link } from "@/i18n/routing";
import { productService } from "@/services/product.service";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * =====================================================================
 * CATEGORIES PAGE - Trang danh sách danh mục với hình ảnh
 * =====================================================================
 */

// Category images mapping based on category name
const CATEGORY_IMAGES: Record<string, string> = {
  sofas:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
  chairs:
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=400&fit=crop",
  tables:
    "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600&h=400&fit=crop",
  storage:
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&h=400&fit=crop",
  beds: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop",
  outdoor:
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop",
  rugs: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&h=400&fit=crop",
  lighting:
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=400&fit=crop",
  accessories:
    "https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=600&h=400&fit=crop",
  outlet:
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=400&fit=crop",
};

function getCategoryImage(
  categoryName: string,
  imageUrl?: string | null
): string {
  if (imageUrl) return imageUrl;
  const key = categoryName.toLowerCase();
  return (
    CATEGORY_IMAGES[key] ||
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&h=400&fit=crop"
  );
}

export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([
    productService.getCategories(),
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
                      {t("browseAllProducts")} →
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
