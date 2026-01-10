import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * WISHLIST SKELETON - Skeleton cho trang Danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PRODUCT GRID MOCK:
 * - Hiển thị lưới sản phẩm giả lập với 5 cột trên màn hình lớn, tương ứng với giao diện thật.
 *
 * 2. CARD DETAIL MOCK:
 * - Mỗi thẻ sản phẩm giả lập bao gồm: Ảnh, Tên, Giá và nút "Add to Cart".
 *
 * 3. THEME CONSISTENCY:
 * - Sử dụng các khối gradient nền đặc trưng của trang Wishlist để tạo cảm giác liền mạch khi tải trang.
 * =====================================================================
 */

export function WishlistSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans pt-24 pb-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>

        {/* Products Grid Skeleton - Matching 5-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-h-[400px] flex flex-col space-y-4">
              {/* Product Image */}
              <Skeleton className="aspect-3/4 rounded-xl" />
              {/* Product Info */}
              <div className="space-y-2 px-1">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              {/* Add to Cart Button */}
              <Skeleton className="h-10 w-full rounded-lg mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
