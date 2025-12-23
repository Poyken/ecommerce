import { notFound } from "next/navigation";

/**
 * =====================================================================
 * CATCH-ALL ROUTE - Xử lý các đường dẫn không tồn tại
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * TẠI SAO CẦN FILE NÀY?
 * - Trong Next.js, khi sử dụng dynamic segment ở cấp cao nhất (như `[locale]`),
 *   các đường dẫn không khớp (vd: /vi/abc) sẽ không tự động kích hoạt `not-found.tsx`.
 * - File này đóng vai trò "bắt" tất cả các đường dẫn còn lại và chủ động gọi `notFound()`.
 * - Điều này đảm bảo `web/app/[locale]/not-found.tsx` và `web/app/[locale]/loading.tsx`
 *   luôn được áp dụng cho mọi đường dẫn sai.
 * =====================================================================
 */

export default function CatchAllPage() {
  notFound();
}
