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
 * /> *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

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
        "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-white dark:bg-slate-950 rounded-4xl border border-white/20 shadow-sm backdrop-blur-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-500",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4">
          {icon && React.isValidElement(icon) && (
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-100 dark:bg-slate-900 text-primary shadow-inner border border-slate-200/50 dark:border-slate-800/50">
              {React.cloneElement(icon as React.ReactElement<any>, {
                className: cn(
                  (icon as React.ReactElement<any>).props.className,
                  "h-7 w-7 stroke-[2.5px]"
                ),
              })}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-muted-foreground font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="flex items-center gap-3 ml-0 md:ml-4">
            {stats.map((stat, index) => (
              <span
                key={index}
                className={cn(
                  "px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-transparent",
                  statVariants[stat.variant || "default"]
                )}
              >
                {stat.value} {stat.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 self-end md:self-center">
          {actions}
        </div>
      )}
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
        "rounded-4xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700",
        className
      )}
    >
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            {title && (
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground font-medium">
                {description}
              </p>
            )}
          </div>
          {headerActions}
        </div>
      )}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-[1px] transition-all duration-300">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-2xl border border-white/20 dark:border-slate-800/50 backdrop-blur-md">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-[3px] border-primary/20" />
                <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
              </div>
              <span className="text-xs font-black text-primary tracking-[0.2em] uppercase animate-pulse">
                Synchronizing
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
