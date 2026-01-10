import { Skeleton } from "@/components/ui/skeleton";

/**
 * =====================================================================
 * CONTACT SKELETON - Skeleton cho trang Liên hệ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM & INFO MOCKUP:
 * - Giả lập các thẻ thông tin liên hệ (Email, Phone, Address) và form nhập liệu lớn ở bên phải.
 *
 * 2. FAQ SECTION MOCK:
 * - Hiển thị 4 khối skeleton cho phần Câu hỏi thường gặp ở bên dưới.
 *
 * 3. RESPONSIVE LAYOUT:
 * - Sử dụng grid tương tự như trang thật để đảm bảo skeleton hiển thị đúng trên cả mobile và desktop.
 * =====================================================================
 */

export function ContactSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Skeleton */}
        <div className="text-center mb-12 flex flex-col items-center">
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-6 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards Skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form Skeleton */}
          <div className="lg:col-span-2 p-8 rounded-2xl border border-white/10">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className="mt-20">
          <div className="text-center mb-10 flex flex-col items-center">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-6 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
