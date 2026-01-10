"use client";

/**
 * =====================================================================
 * ADMIN PAGE HEADER - Header component cho các trang Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này tái sử dụng style header cho các trang admin.
 * Bao gồm: Title, Subtitle/Stats, và Action buttons.
 *
 * USAGE:
 * <AdminPageHeader
 *   title="Order Management"
 *   subtitle="Manage all customer orders"
 *   icon={<ShoppingBag className="h-6 w-6" />}
 *   stats={[
 *     { label: "Total", value: 150 },
 *     { label: "Pending", value: 5, variant: "warning" },
 *   ]}
 *   actions={<Button>Create New</Button>}
 * />
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface StatItem {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  stats?: StatItem[];
  actions?: React.ReactNode;
  className?: string;
}

const statVariants = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function AdminPageHeader({
  title,
  subtitle,
  icon,
  stats,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="hidden md:flex items-center gap-2 ml-4">
            {stats.map((stat, index) => (
              <span
                key={index}
                className={cn(
                  "px-2.5 py-1 rounded-md text-sm font-medium",
                  statVariants[stat.variant || "default"]
                )}
              >
                {stat.value} {stat.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN TABLE WRAPPER - Wrapper component cho Table trong Admin
 * =====================================================================
 *
 * Style đồng nhất cho các table trong admin pages.
 * =====================================================================
 */

interface AdminTableWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function AdminTableWrapper({
  children,
  title,
  description,
  headerActions,
  className,
  isLoading,
}: AdminTableWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerActions}
        </div>
      )}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">
                Loading data...
              </span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN STATS CARD - Card hiển thị thống kê nhanh
 * =====================================================================
 */

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function AdminStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: AdminStatsCardProps) {
  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-red-500/10 text-red-600",
    info: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconVariants[variant]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold">{value}</span>
        {trend && (
          <span
            className={cn(
              "ml-2 text-sm font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN EMPTY STATE - Component hiển thị khi không có dữ liệu
 * =====================================================================
 */

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN ACTION BADGE - Badge cho các status/type tags
 * =====================================================================
 */

interface AdminActionBadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const badgeVariants = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

export function AdminActionBadge({
  label,
  variant = "default",
  className,
}: AdminActionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
