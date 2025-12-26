/**
 * =====================================================================
 * GLOBAL LOADING PAGE - Trạng thái chờ toàn cục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STREAMING & SUSPENSE:
 * - Next.js sử dụng file `loading.tsx` để tự động tạo một Suspense Boundary cho toàn bộ route.
 * - Khi server đang fetch dữ liệu, UI này sẽ được hiển thị ngay lập tức (Streaming), giúp người dùng không phải nhìn màn hình trắng.
 *
 * 2. SKELETON UI:
 * - Thay vì dùng một vòng xoay (Spinner) đơn điệu, ta thiết kế một "bản sao" mờ của trang web bằng các `Skeleton`.
 * - Điều này giúp người dùng hình dung được bố cục trang web sắp hiện ra, tạo cảm giác tốc độ tải nhanh hơn.
 *
 * 3. LAYOUT MATCHING:
 * - Skeleton nên có cấu trúc tương đồng với trang thật (Sidebar, Grid, Hero) để tránh hiện tượng nhảy bố cục (Layout Shift) khi dữ liệu thật xuất hiện.
 * =====================================================================
 */

import { LoadingScreen } from "@/components/shared/loading-screen";

export default function Loading() {
  return <LoadingScreen />;
}
