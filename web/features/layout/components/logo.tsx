"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "default";
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
  href?: any;
}

export function Logo({
  className,
  variant = "default",
  size = "md",
  collapsed = false,
  href = "/",
}: LogoProps) {
  const sizes = {
    sm: { box: "w-8 h-8", text: "text-lg", char: "text-base" },
    md: { box: "w-10 h-10", text: "text-2xl", char: "text-xl" },
    lg: { box: "w-12 h-12", text: "text-3xl", char: "text-2xl" },
  };

  const variants = {
    default: "bg-foreground text-background", // Simplified for high contrast
    light: "bg-white text-black",
    dark: "bg-black text-white",
  };

  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <m.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center font-black rounded-xl shadow-2xl transition-all duration-500",
          sizes[size].box,
          variants[variant]
        )}
      >
        <span className={sizes[size].char}>L</span>
      </m.div>

      {!collapsed && (
        <span
          className={cn(
            "font-black tracking-tighter uppercase font-sans transition-colors duration-300",
            sizes[size].text
          )}
        >
          LUXE
          <span className="text-accent group-hover:animate-pulse">.</span>
        </span>
      )}
    </Link>
  );
}
