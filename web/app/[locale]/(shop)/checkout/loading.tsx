import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Checkout
 * =====================================================================
 *
 * UPDATE: Sử dụng LoadingScreen để đồng bộ trải nghiệm loading với Admin/Auth.
 * =====================================================================
 */

export default function Loading() {
  return <LoadingScreen fullScreen={false} className="min-h-screen" />;
}
