"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "hover" | "heavy";
}

export function GlassCard({ 
  children, 
  className, 
  variant = "default",
  ...props 
}: GlassCardProps) {
  const variants = {
    default: "bg-white/60 dark:bg-white/5 backdrop-blur-md border-black/5 dark:border-white/10 text-foreground",
    hover: "bg-white/60 dark:bg-white/5 backdrop-blur-md border-black/5 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20 hover:shadow-lg transition-all duration-300 text-foreground",
    heavy: "bg-white/80 dark:bg-black/40 backdrop-blur-xl border-black/5 dark:border-white/5 text-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "rounded-xl border shadow-sm overflow-hidden",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
