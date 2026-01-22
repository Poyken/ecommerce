"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  hoverBright,
  hoverGlow,
  hoverLift,
  hoverScale,
  m,
  tapScale,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";



type MotionButtonAnimation = "scale" | "lift" | "glow" | "bright" | "none";

import { type VariantProps } from "class-variance-authority";

// ...

interface MotionButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {
  animation?: MotionButtonAnimation;
  loading?: boolean;
}

const animationVariants = {
  scale: { hover: hoverScale, tap: tapScale },
  lift: { hover: hoverLift, tap: tapScale },
  glow: { hover: hoverGlow, tap: tapScale },
  bright: { hover: hoverBright, tap: tapScale },
  none: { hover: {}, tap: {} },
};

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation = "scale",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { hover, tap } = animationVariants[animation];

    return (
      <m.button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, className }),
          "transform-gpu transition-[background-color,border-color,opacity,box-shadow,filter] will-change-transform duration-300"
        )}
        whileHover={hover}
        whileTap={tap}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children as React.ReactNode}
      </m.button>
    );
  }
);

MotionButton.displayName = "MotionButton";
