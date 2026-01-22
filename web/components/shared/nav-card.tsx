"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";



interface NavCardProps {
  href: string;
  name: string;
  count?: number;
  imageUrl?: string;
  variant?: "default" | "brand" | "category";
  className?: string;
}

export function NavCard({
  href,
  name,
  count,
  imageUrl,
  variant = "default",
  className,
}: NavCardProps) {
  const variantStyles = {
    default: {
      ring: "group-hover:ring-primary/20",
      text: "group-hover:text-primary",
      arrow: "text-primary bg-primary/5",
      border: "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
    },
    brand: {
      ring: "group-hover:ring-accent/20",
      text: "group-hover:text-accent",
      arrow: "text-accent bg-accent/5",
      border: "hover:border-accent/20 hover:shadow-xl hover:shadow-accent/5",
    },
    category: {
      ring: "group-hover:ring-primary/20",
      text: "group-hover:text-primary",
      arrow: "text-primary bg-primary/5",
      border: "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Link
      href={href as any}
      className={cn(
        "group relative block overflow-hidden rounded-[2rem] bg-background border border-foreground/5 transition-all duration-500",
        styles.border,
        className
      )}
    >
      <div className="flex items-center p-5 gap-5">
        {/* Image with premium ring on hover */}
        <div
          className={cn(
            "relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 ring-1 ring-foreground/5 transition-all duration-700 bg-foreground/[0.02] flex items-center justify-center",
            styles.ring
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <span
              className={cn(
                "text-2xl font-black text-foreground/20 transition-colors uppercase",
                styles.text
              )}
            >
              {name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-black text-lg tracking-tight truncate transition-colors duration-300",
              styles.text
            )}
          >
            {name}
          </h3>
          {count !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1 w-1 rounded-full bg-primary/40" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {count} {count === 1 ? "Item" : "Items"}
              </p>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out",
            styles.arrow
          )}
        >
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
