"use client";

/**
 * =====================================================================
 * CONDITIONAL HEADER - HIỂN THỊ HEADER CÓ ĐIỀU KIỆN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này quyết định có hiển thị Header hay không dựa vào context.
 *
 * 1. MỤC ĐÍCH:
 *    - Một số trang (VD: Page Builder preview, Landing page custom) cần ẩn Header mặc định
 *    - Component này kiểm tra `hideHeader` từ LayoutVisibilityProvider
 *    - Nếu hideHeader = true -> return null (không render gì)
 *
 * 2. CÁCH SỬ DỤNG:
 *    - Wrap trong LayoutVisibilityProvider
 *    - Gọi setHideHeader(true) từ component con để ẩn Header
 *
 * 3. PROPS:
 *    - initialUser: Thông tin user đã đăng nhập (hoặc undefined)
 *    - permissions: Danh sách quyền của user
 *    - initialCartCount: Số lượng item trong giỏ hàng
 *    - initialWishlistCount: Số lượng item trong wishlist
 * =====================================================================
 */

import { useLayoutVisibility } from "@/features/layout/providers/layout-visibility-provider";
import { Header } from "./header";

interface ConditionalHeaderProps {
  initialUser?: any;
  permissions?: string[];
  initialCartCount?: number;
  initialWishlistCount?: number;
}

export function ConditionalHeader(props: ConditionalHeaderProps) {
  const { hideHeader } = useLayoutVisibility();

  if (hideHeader) return null;
  
  return <Header {...props} />;
}
