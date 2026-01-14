"use client";

/**
 * =====================================================================
 * SKELETON COMPONENTS - LOADING PLACEHOLDERS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Skeleton components hiển thị placeholder khi đang load data:
 * 1. Cải thiện Perceived Performance (cảm nhận tốc độ)
 * 2. Giảm CLS (Cumulative Layout Shift)
 * 3. UX tốt hơn so với spinner
 *
 * =====================================================================
 */

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton component
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted/50", className)} />
  );
}

/**
 * Text line skeleton
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24 rounded-lg", className)} />;
}

/**
 * Product card skeleton
 */
export function SkeletonProductCard() {
  return (
    <div className="group rounded-2xl bg-white dark:bg-gray-900 overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* Image */}
      <Skeleton className="aspect-square w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Price */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Rating */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Product list skeleton
 */
export function SkeletonProductList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 py-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 py-4 border-b border-gray-100 dark:border-gray-800"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Order card skeleton
 */
export function SkeletonOrderCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Items */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-16 h-16 rounded-lg" />
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

/**
 * Dashboard stats skeleton
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
        >
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        <SkeletonButton className="w-32" />
        <SkeletonButton className="w-24" />
      </div>
    </div>
  );
}

/**
 * Page header skeleton
 */
export function SkeletonPageHeader() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Full page skeleton with header, content, sidebar
 */
export function SkeletonPage() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <SkeletonStats />
          <SkeletonTable />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
