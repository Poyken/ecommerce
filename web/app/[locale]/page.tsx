import { redirect } from "next/navigation";

/**
 * ROOT LOCALE PAGE - Điều hướng trang gốc
 * 
 * Khi user truy cập `/en` hoặc `/vi`, trang này sẽ redirect về Landing Page
 * hoặc Shop Home tùy theo context.
 * 
 * Note: Logic host-based routing chính nằm trong proxy.ts
 * File này chỉ là fallback nếu middleware không xử lý kịp.
 */
export default function LocaleHomePage() {
  // Redirect to landing page for marketing
  redirect("/landing");
}
