/**
 * CART INITIALIZER - Synchronizes cart across tabs and devices.
 */

"use client";

import { getCartCountAction } from "@/features/cart/actions";
import { useCartStore } from "@/features/cart/store/cart.store";
import { User } from "@/types/models";
import { useCallback, useEffect, useRef } from "react";

interface CartInitializerProps {
  initialUser?: User | null;
  initialCount?: number;
}

export function CartInitializer({
  initialUser,
  initialCount,
}: CartInitializerProps) {
  const { updateCount, setFetching } = useCartStore();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (typeof initialCount === "number") {
      updateCount(initialCount);
    }
  }, [initialCount, updateCount]);

  const fetchCount = useCallback(async () => {
    if (isFetchingRef.current) return;

    if (initialUser) {
      try {
        isFetchingRef.current = true;
        setFetching(true);
        const result = await getCartCountAction();
        if (
          result.success &&
          result.data &&
          typeof result.data.totalItems === "number"
        ) {
          updateCount(result.data.totalItems);
        } else {
          updateCount(0);
        }
      } catch {
        updateCount(0);
      } finally {
        isFetchingRef.current = false;
        setFetching(false);
      }
      return;
    }

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
        updateCount(totalQuantity);
      } else {
        updateCount(0);
      }
    } catch {
      updateCount(0);
    }
  }, [initialUser, updateCount, setFetching]);

  useEffect(() => {
    if (initialCount === undefined) {
      fetchCount();
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_cart") fetchCount();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchCount, initialCount]);

  return null;
}
