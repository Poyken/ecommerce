"use client";

import { usePathname } from "@/i18n/routing";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface LayoutVisibilityContextType {
  hideHeader: boolean;
  hideFooter: boolean;
  setHideHeader: (hide: boolean) => void;
  setHideFooter: (hide: boolean) => void;
}

const LayoutVisibilityContext = createContext<
  LayoutVisibilityContextType | undefined
>(undefined);

/**
 * =================================================================================================
 * LAYOUT VISIBILITY PROVIDER - QUẢN LÝ HIỂN THỊ GIAO DIỆN CHUNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL UI STATE:
 *    - Sử dụng React Context để điều khiển việc ẩn/hiện Header và Footer từ bất kỳ đâu.
 *    - Ví dụ: Trong trang Checkout hoặc Landing Page đặc biệt, ta có thể gọi `setHideHeader(true)`.
 *
 * 2. AUTOMATIC RESET:
 *    - `useEffect` lắng nghe sự thay đổi của `pathname`.
 *    - Khi User chuyển trang, Header/Footer sẽ tự động hiện lại (Reset về false).
 *    - Điều này tránh tình trạng trang trước ẩn Header làm trang sau cũng bị ẩn theo.
 * =================================================================================================
 */
export function LayoutVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hideHeader, setHideHeader] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const pathname = usePathname();

  // Reset visibility when navigating to a new page
  useEffect(() => {
    setHideHeader(false);
    setHideFooter(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <LayoutVisibilityContext.Provider
      value={{ hideHeader, hideFooter, setHideHeader, setHideFooter }}
    >
      {children}
    </LayoutVisibilityContext.Provider>
  );
}

export function useLayoutVisibility() {
  const context = useContext(LayoutVisibilityContext);
  if (!context) {
    throw new Error(
      "useLayoutVisibility must be used within a LayoutVisibilityProvider"
    );
  }
  return context;
}
