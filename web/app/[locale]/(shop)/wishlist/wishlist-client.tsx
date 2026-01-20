/**
 * =====================================================================
 * WISHLIST CLIENT - Giao diện danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID WISHLIST LOGIC (User & Guest):
 * - Nếu user đã đăng nhập: Dữ liệu lấy từ `wishlistItems` prop (Server Action).
 * - Nếu là khách (Guest): Dữ liệu lấy từ `localStorage` thông qua `useGuestWishlist` hook.
 * - `useEffect` xử lý việc fetch chi tiết sản phẩm cho Guest từ danh sách ID trong localStorage.
 *
 * 2. COMPONENT COMPOSITION:
 * - Sử dụng `ProductCard` để hiển thị từng sản phẩm trong danh sách yêu thích.
 * - Đảm bảo truyền đúng các props như `initialIsWishlisted={true}` để icon trái tim hiển thị đúng trạng thái.
 *
 * 3. EMPTY STATE:
 * - Hiển thị thông báo khi danh sách trống để khuyến khích người dùng khám phá cửa hàng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Client-side State Management: Đảm bảo danh sách yêu thích luôn được cập nhật tức thì trên trình duyệt mà không cần tải lại trang, ngay cả đối với người dùng chưa đăng nhập thông qua LocalStorage.
 * - Fluid Favorites Interaction: Tạo ra trải nghiệm tương tác mượt mà, giúp khách hàng dễ dàng lưu lại các sản phẩm yêu thích và quay lại mua sắm sau này, góp phần tăng tỷ lệ chuyển đổi.

 * =====================================================================
 */

"use client";

import { getGuestWishlistDetailsAction } from "@/features/wishlist/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/features/products/components/product-card";
import { useGuestWishlist } from "@/features/wishlist/hooks/use-guest-wishlist";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { m } from "@/lib/animations";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Product } from "@/types/models";

interface WishlistItem {
  id: string;
  product: Product;
}

interface WishlistClientProps {
  wishlistItems: WishlistItem[];
}

export function WishlistClient({
  wishlistItems: initialItems,
}: WishlistClientProps) {
  const t = useTranslations("wishlist");
  const { isAuthenticated } = useAuth();
  const guestWishlist = useGuestWishlist();
  const [items, setItems] = useState<WishlistItem[]>(initialItems || []);
  const [isInitializing, setIsInitializing] = useState(!isAuthenticated);

  const router = useRouter();

  useEffect(() => {
    const handleWishlistUpdate = () => {
      router.refresh();
    };

    window.addEventListener("wishlist_updated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlist_updated", handleWishlistUpdate);
    };
  }, [router]);

  useEffect(() => {
    // If authenticated, we trust server items (initialItems)
    if (isAuthenticated) {
      setItems(initialItems || []);
      setIsInitializing(false);
      return;
    }

    // If guest, we fetch from localStorage IDs
    const fetchGuestProducts = async () => {
      // Small delay to ensure localStorage hook is sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (guestWishlist.wishlistIds.length === 0) {
        setItems([]);
        setIsInitializing(false);
        return;
      }

      try {
        const res = await getGuestWishlistDetailsAction(
          guestWishlist.wishlistIds
        );
        if (res.success && res.data) {
          // Map to wishlist format { id, product: ... }
          const mappedItems = res.data.map((p: Product) => ({
            id: p.id, // Wishlist item ID (virtual)
            product: p,
          }));
          setItems(mappedItems);
        }
      } catch (e) {
        console.error("Failed to fetch guest wishlist", e);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchGuestProducts();
  }, [isAuthenticated, initialItems, guestWishlist.wishlistIds]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30 pb-24">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-cinematic pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--aurora-purple)/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-(--aurora-blue)/10 rounded-full blur-[100px] animate-float pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10 pt-32">
        <m.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="space-y-4">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Heart className="size-3 fill-accent" />
              {t("title")}
            </m.div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tighter">
              {t("title").split(" ")[0]}{" "}
              <span className="font-serif italic font-normal text-muted-foreground/60">
                {t("title").split(" ").slice(1).join(" ")}
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg font-medium">
              {t("subtitle", { count: items.length })}
            </p>
          </div>

          {!isInitializing && items.length > 0 && (
            <Link href="/shop">
               <GlassButton className="rounded-full px-8 py-6 font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                 {t("browseShop")}
               </GlassButton>
            </Link>
          )}
        </m.div>

        <div>
          {isInitializing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-3/4 w-full rounded-4xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items
                .filter((item) => item.product)
                .map((item) => {
                  const defaultSku = item.product.skus?.[0];
                  // Safeguard against missing price data
                  const price = defaultSku?.price
                    ? Number(defaultSku.price)
                    : 0;
                  const salePrice = defaultSku?.salePrice
                    ? Number(defaultSku.salePrice)
                    : undefined;

                  const reviewCount =
                    item.product._count?.reviews ||
                    item.product.reviews?.length ||
                    0;
                  const averageRating =
                    (item.product.reviews?.length ?? 0) > 0
                      ? item.product.reviews!.reduce(
                          (acc: number, r: { rating: number }) =>
                            acc + r.rating,
                          0
                        ) / item.product.reviews!.length
                      : 5;

                  return (
                    <m.div 
                      key={item.id} 
                      className="min-h-[400px] flex flex-col"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <ProductCard
                        id={item.product.id}
                        name={item.product.name}
                        price={price}
                        originalPrice={salePrice}
                        imageUrl={
                          (typeof item.product.images?.[0] === "string"
                            ? item.product.images?.[0]
                            : item.product.images?.[0]?.url) ||
                          item.product.skus?.[0]?.imageUrl ||
                          ""
                        }
                        category={item.product.category?.name}
                        skus={item.product.skus}
                        options={item.product.options}
                        rating={averageRating}
                        reviewCount={reviewCount}
                        initialIsWishlisted={true}
                      />
                    </m.div>
                  );
                })}
            </div>
          ) : (
            <m.div 
               className="flex flex-col items-center justify-center py-32 px-4 text-center space-y-8 glass-card rounded-4xl border-none shadow-2xl relative overflow-hidden group"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-10 h-10 text-muted-foreground/40 group-hover:text-accent group-hover:fill-accent transition-all animate-pulse" />
              </div>

              <div className="space-y-3 relative z-10">
                <h2 className="text-3xl font-bold tracking-tighter">{t("empty")}</h2>
                <p className="text-muted-foreground max-w-md mx-auto font-medium">
                  {t("emptyDesc")}
                </p>
              </div>

              <Link href="/shop" className="relative z-10">
                <GlassButton
                  size="lg"
                  className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs px-12 py-8 rounded-full shadow-xl hover:shadow-primary/20 transition-all"
                >
                  {t("browseShop")}
                </GlassButton>
              </Link>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
