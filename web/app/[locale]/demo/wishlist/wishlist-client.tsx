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
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-24 pb-24 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <m.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("subtitle", { count: items.length })}
            </p>
          </div>
        </m.div>

        <div>
          {isInitializing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-3/4 w-full rounded-2xl" />
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
                    <div key={item.id} className="min-h-[400px] flex flex-col">
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
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("empty")}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("emptyDesc")}
                </p>
              </div>
              <Link href="/shop">
                <GlassButton
                  size="lg"
                  className="bg-primary text-primary-foreground font-bold px-8"
                >
                  {t("browseShop")}
                </GlassButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
