/**
 * =====================================================================
 * BACKGROUND BLOB - Các đốm màu nền trang trí
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này tạo ra các hiệu ứng đốm màu mờ (blur) ở nền website,
 * giúp giao diện trông hiện đại và có chiều sâu hơn (Glassmorphism style).
 * =====================================================================
 */

"use client";

import { cn } from "@/lib/utils";

interface BackgroundBlobProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "info"
    | "warning"
    | "destructive";
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  size?: "sm" | "md" | "lg" | "xl";
  opacity?: "low" | "medium" | "high";
}

export function BackgroundBlob({
  className,
  variant = "primary",
  position = "bottom-left",
  size = "lg",
  opacity = "medium",
  ...props
}: BackgroundBlobProps) {
  const variants = {
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    accent: "bg-accent/10",
    success: "bg-success/10",
    info: "bg-info/10",
    warning: "bg-warning/10",
    destructive: "bg-destructive/10",
  };

  const positions = {
    "top-left": "top-0 left-0",
    "top-center": "top-0 left-1/2 -translate-x-1/2",
    "top-right": "top-0 right-0",
    "center-left": "top-1/2 left-0 -translate-y-1/2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "center-right": "top-1/2 right-0 -translate-y-1/2",
    "bottom-left": "bottom-0 left-0",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-0 right-0",
  };

  const sizes = {
    sm: "w-[400px] h-[400px]",
    md: "w-[600px] h-[600px]",
    lg: "w-[800px] h-[800px]",
    xl: "w-[1000px] h-[1000px]",
  };

  const opacities = {
    low: "opacity-30",
    medium: "opacity-50",
    high: "opacity-70",
  };

  return (
    <div
      className={cn(
        "absolute rounded-full blur-[180px] pointer-events-none z-0",
        variants[variant],
        positions[position],
        sizes[size],
        opacities[opacity],
        className
      )}
      {...props}
    />
  );
}
