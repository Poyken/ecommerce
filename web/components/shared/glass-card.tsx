"use client";

import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { type HTMLMotionProps } from "framer-motion";



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
    default:
      "bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border-foreground/5 dark:border-white/5 text-foreground shadow-lg",
    hover:
      "bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border-foreground/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/[0.05] hover:border-foreground/10 dark:hover:border-white/10 hover:shadow-2xl transition-all duration-500 text-foreground",
    heavy:
      "bg-white/90 dark:bg-black/40 backdrop-blur-2xl border-foreground/10 dark:border-white/5 text-foreground shadow-2xl",
  };

  return (
    <m.div
      className={cn("rounded-2xl border", variants[variant], className)}
      {...props}
    >
      {children}
    </m.div>
  );
}
