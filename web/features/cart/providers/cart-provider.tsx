"use client";

import { getCartCountAction } from "@/features/cart/actions";
import { User } from "@/types/models";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * =====================================================================
 * CART PROVIDER - Quản lý số lượng giỏ hàng toàn ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL STATE MANAGER:
 * - Thay vì mỗi trang tự gọi API lấy số lượng giỏ hàng, ta quản lý tập trung ở đây.
 * - Bất kỳ component nào (Header, ProductPage) cũng có thể lấy data qua `useCartContext()`.
 *
 * 2. HYBRID STRATEGY (Guest vs User):
 * - User đã login: Gọi Server Action `getCartCountAction` (Database).
 * - User chưa login (Guest): Lấy từ `localStorage` (Trình duyệt).
 * -> Đảm bảo trải nghiệm liền mạch kể cả khi chưa đăng nhập.
 *
 * 3. EVENT-DRIVEN UPDATES (Cập nhật theo sự kiện):
 * - Làm sao để Header biết khi ProductPage thêm hàng vào giỏ?
 * - Ta dùng `window.dispatchEvent(new Event('cart_updated'))`.
 * - Provider lắng nghe sự kiện này và tự động fetch lại data mới nhất.
 *
 * 4. PERFORMANCE (Hiệu năng):
 * - `useMemo` cho contextValue: Giúp tránh render lại các component con không cần thiết.
 * - `useRef` cho `isFetching`: Ngăn chặn việc gọi API 2 lần liên tiếp (Race condition).
 * =====================================================================
 */

interface CartContextType {
  count: number;
  refreshCart: () => Promise<void>;
  updateCount: (newCount: number) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  initialCount?: number;
  initialUser?: User | null;
}

export function CartProvider({
  children,
  initialCount = 0,
  initialUser,
}: CartProviderProps) {
  const [count, setCount] = useState(initialCount);
  const isFetching = useRef(false);

  const fetchCount = useCallback(async () => {
    if (isFetching.current) return;

    // 1. Logged in user -> API
    if (initialUser) {
      try {
        isFetching.current = true;
        const result = await getCartCountAction();
        if (result.success && typeof result.count === "number") {
          setCount(result.count);
        } else {
          setCount(0);
        }
      } catch {
        // console.error("Failed to fetch cart count", error);
        setCount(0);
      } finally {
        isFetching.current = false;
      }
      return;
    }

    // 2. Guest user -> LocalStorage
    try {
      const guestCart = localStorage.getItem("guest_cart");
      if (guestCart) {
        const items = JSON.parse(guestCart);
        const totalQuantity = Array.isArray(items)
          ? items.reduce(
              (sum: number, item: { quantity?: number }) =>
                sum + (item.quantity || 0),
              0
            )
          : 0;
        setCount(totalQuantity);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    }
  }, [initialUser]);

  // Listen for cart updates
  useEffect(() => {
    // For guest users, fetch initial count on mount since server-side doesn't have it
    if (!initialUser) {
      fetchCount();
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_cart") fetchCount();
    };

    // Custom events for cart updates
    const handleGuestUpdate = () => fetchCount();
    const handleCartUpdate = () => fetchCount(); // For logged-in users
    const handleCartClear = () => setCount(0); // Immediate reset when cart is cleared

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("guest_cart_updated", handleGuestUpdate); // Guest users
    window.addEventListener("cart_updated", handleCartUpdate); // Logged-in users
    window.addEventListener("cart_clear", handleCartClear); // Clear cart event

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("guest_cart_updated", handleGuestUpdate);
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("cart_clear", handleCartClear);
    };
  }, [initialUser, fetchCount]);

  const refreshCart = useCallback(async () => {
    await fetchCount();
  }, [fetchCount]);

  const updateCount = useCallback((newCount: number) => {
    setCount(newCount);
  }, []);

  const increment = useCallback((amount = 1) => {
    setCount((prev) => prev + amount);
  }, []);

  const decrement = useCallback((amount = 1) => {
    setCount((prev) => Math.max(0, prev - amount));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ count, refreshCart, updateCount, increment, decrement }),
    [count, refreshCart, updateCount, increment, decrement]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
