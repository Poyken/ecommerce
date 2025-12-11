"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
      glass: "bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 hover:border-white/30",
      ghost: "bg-transparent text-current hover:bg-white/5 border-transparent",
    };
    
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-6 py-2",
      lg: "h-12 px-8 text-lg font-medium",
      icon: "h-10 w-10 p-0 flex items-center justify-center rounded-full",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
