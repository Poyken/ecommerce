"use client";

import { cn } from "@/lib/utils";



interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "luxury";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md transition-all duration-300",
        variant === "default" && "bg-muted/50",
        variant === "glass" && "bg-white/5 backdrop-blur-md border border-white/5",
        variant === "luxury" && "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent dark:after:via-white/5",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
