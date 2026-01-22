"use client";



import { useCallback, useEffect, useState } from "react";

export function useGuestWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("guest_wishlist");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    // Listen for updates
    const handleUpdate = () => {
      const stored = localStorage.getItem("guest_wishlist");
      if (stored) {
        try {
          setWishlistIds(JSON.parse(stored));
        } catch {
          setWishlistIds([]);
        }
      } else {
        setWishlistIds([]);
      }
    };

    window.addEventListener("guest_wishlist_updated", handleUpdate);
    return () =>
      window.removeEventListener("guest_wishlist_updated", handleUpdate);
  }, []);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistIds((current) => {
      if (current.includes(productId)) return current;
      const updated = [...current, productId];
      localStorage.setItem("guest_wishlist", JSON.stringify(updated));
      // Dispatch events after state update
      setTimeout(() => {
        window.dispatchEvent(new Event("guest_wishlist_updated"));
        window.dispatchEvent(new Event("wishlist_updated"));
      }, 0);
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistIds((current) => {
      const updated = current.filter((id) => id !== productId);
      localStorage.setItem("guest_wishlist", JSON.stringify(updated));
      // Dispatch events after state update
      setTimeout(() => {
        window.dispatchEvent(new Event("guest_wishlist_updated"));
        window.dispatchEvent(new Event("wishlist_updated"));
      }, 0);
      return updated;
    });
  }, []);

  const hasItem = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  return { wishlistIds, addToWishlist, removeFromWishlist, hasItem };
}
