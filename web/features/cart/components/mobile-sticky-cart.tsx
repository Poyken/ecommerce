"use client";

import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { m } from "@/lib/animations";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";



interface MobileStickyCartProps {
  productName: string;
  price: number;
  salePrice?: number | null;
  onAddToCart: () => void;
  isOutOfStock?: boolean;
  isAdding?: boolean;
}

export function MobileStickyCart({
  productName,
  price,
  salePrice,
  onAddToCart,
  isOutOfStock,
  isAdding = false,
}: MobileStickyCartProps) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // Show only after scrolling past the main hero image (approx 500px)
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  const displayPrice = salePrice || price;

  return (
    <m.div
      data-fixed-element
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-xl border-t border-white/10 md:hidden safe-area-pb"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground truncate">
            {productName}
          </span>
          <span className="font-bold text-lg text-primary">
            {formatCurrency(displayPrice)}
          </span>
        </div>
        <Button
          size="lg"
          onClick={onAddToCart}
          disabled={isOutOfStock || isAdding}
          className={cn(
            "rounded-full shadow-lg shadow-primary/20 shrink-0",
            (isOutOfStock || isAdding) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isAdding ? "Adding..." : isOutOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </m.div>
  );
}
