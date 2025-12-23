"use client";

import { getCartCountAction } from "@/actions/cart";
import { User } from "@/types/models";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * 1. GLOBAL CART COUNT:
 * - Lưu trữ số lượng sản phẩm trong giỏ hàng để hiển thị trên Badge của Header.
 * - Giúp người dùng biết được trạng thái giỏ hàng ở bất kỳ trang nào.
 *
 * 2. AUTH-AWARE FETCHING:
 * - Nếu user đã login: Fetch số lượng từ API Backend thông qua Server Action.
 * - Nếu là khách (Guest): Tính toán số lượng từ `localStorage` (`guest_cart`).
 *
 * 3. EVENT-DRIVEN UPDATES:
 * - Lắng nghe các event `storage`, `guest_cart_updated`, và `cart_updated`.
 * - Khi giỏ hàng thay đổi ở một nơi (vd: trang chi tiết sản phẩm), Provider sẽ tự động cập nhật lại số lượng.
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
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_cart") fetchCount();
    };

    // Custom events for cart updates
    const handleGuestUpdate = () => fetchCount();
    const handleCartUpdate = () => fetchCount(); // For logged-in users

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("guest_cart_updated", handleGuestUpdate); // Guest users
    window.addEventListener("cart_updated", handleCartUpdate); // Logged-in users

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("guest_cart_updated", handleGuestUpdate);
      window.removeEventListener("cart_updated", handleCartUpdate);
    };
  }, [initialUser, fetchCount]);

  const refreshCart = async () => {
    await fetchCount();
  };

  const updateCount = (newCount: number) => {
    setCount(newCount);
  };

  const increment = (amount = 1) => {
    setCount((prev) => prev + amount);
  };

  const decrement = (amount = 1) => {
    setCount((prev) => Math.max(0, prev - amount));
  };

  return (
    <CartContext.Provider
      value={{ count, refreshCart, updateCount, increment, decrement }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
