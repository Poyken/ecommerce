import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * CART SKELETON - Skeleton cho trang Giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPLEX LAYOUT MOCKUP:
 * - Mô phỏng chính xác bố cục 2 cột của trang giỏ hàng: Danh sách sản phẩm (trái) và Tóm tắt đơn hàng (phải).
 *
 * 2. INTERACTIVE ELEMENTS MOCK:
 * - Giả lập các thành phần như thanh tiến trình Free Shipping, checkbox chọn tất cả, và các nút điều chỉnh số lượng.
 *
 * 3. LUXE THEME CONSISTENCY:
 * - Giữ nguyên các lớp gradient nền (`primary/10`, `amber-500/10`) để đảm bảo trải nghiệm thị giác đồng nhất ngay cả khi đang loading. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans relative overflow-hidden">
      {/* Background Gradients - Luxe Theme */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Select All */}
            <div className="flex items-center px-4 py-2">
              <Skeleton className="h-5 w-5 rounded mr-3" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Cart Items */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Checkbox */}
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>

                  {/* Product Image */}
                  <Skeleton className="w-24 h-32 md:w-32 md:h-40 rounded-xl shrink-0" />

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-5 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                      {/* Quantity Control */}
                      <Skeleton className="h-10 w-28 rounded-full" />
                      {/* Price */}
                      <div className="text-right space-y-1">
                        <Skeleton className="h-6 w-28 ml-auto" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm sticky top-24">
              <Skeleton className="h-7 w-40 mb-6" />

              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-px w-full bg-white/10" />
                <div className="flex justify-between items-end">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>

              {/* Checkout Button */}
              <Skeleton className="h-14 w-full rounded-2xl mb-4" />

              {/* Trust Badges */}
              <div className="space-y-3 pt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
