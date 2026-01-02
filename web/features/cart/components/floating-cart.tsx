"use client";

import { Link } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * =====================================================================
 * FLOATING CART - Minimalist Shopping Bag with Micro-interactions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL STATE LISTENER:
 * - Component này lắng nghe sự kiện `window.dispatchEvent(new Event("cart_updated"))`.
 * - Đây là cách đơn giản để đồng bộ state giữa các component xa nhau mà không cần Context quá phức tạp
 *   (Pub/Sub pattern đơn giản bằng DOM Events).
 *
 * 2. ANIMATE PRESENCE:
 * - Badge số lượng item có hiệu ứng pop-in/pop-out khi số lượng thay đổi.
 * =====================================================================
 */

interface FloatingCartProps {
  className?: string;
}

export function FloatingCart({ className }: FloatingCartProps) {
  const [itemCount, setItemCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Listen for cart updates
  const updateCartCount = useCallback(() => {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        const count = cart.items?.reduce(
          (acc: number, item: { quantity: number }) => acc + (item.quantity || 0),
          0
        ) || 0;
        
        if (count !== itemCount) {
          setItemCount(count);
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 600);
        }
      } catch {
        setItemCount(0);
      }
    }
  }, [itemCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    
    // Show cart after initial load
    const timer = setTimeout(() => setIsVisible(true), 1000);
    
    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
      clearTimeout(timer);
    };
  }, [updateCartCount]);

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          data-fixed-element
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "lg:bottom-8 lg:right-8",
            className
          )}
        >
          <Link href="/cart">
            <m.div
              animate={isAnimating ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative flex items-center justify-center",
                "w-14 h-14 lg:w-16 lg:h-16 rounded-full",
                "glass-luxury cursor-pointer",
                "transition-all duration-500 ease-[0.16,1,0.3,1]",
                "hover:scale-110 hover:shadow-2xl hover:shadow-accent/20",
                "group"
              )}
            >
              <ShoppingBag
                className={cn(
                  "w-5 h-5 lg:w-6 lg:h-6 text-foreground",
                  "transition-transform duration-300",
                  "group-hover:scale-110"
                )}
              />
              
              {/* Item Count Badge */}
              <AnimatePresence>
                {itemCount > 0 && (
                  <m.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "absolute -top-1 -right-1",
                      "min-w-[20px] h-5 px-1.5",
                      "flex items-center justify-center",
                      "bg-primary text-primary-foreground",
                      "text-[10px] font-bold rounded-full",
                      "shadow-lg shadow-primary/30"
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </m.div>
                )}
              </AnimatePresence>

              {/* Subtle Ring Animation on Hover */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full",
                  "border border-accent/0 transition-all duration-500",
                  "group-hover:border-accent/40 group-hover:scale-110"
                )}
              />
            </m.div>
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingCart;
