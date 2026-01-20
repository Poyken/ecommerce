"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { m } from "@/lib/animations";

/**
 * =====================================================================
 * ADMIN PAGE COMPONENTS - Thư viện UI cực kỳ linh hoạt cho Admin
 * =====================================================================
 */

interface StatItem {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "aurora";
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  stats?: StatItem[];
  actions?: React.ReactNode;
  className?: string;
  layout?: "default" | "luxury" | "minimalist" | "glass";
}

const statVariants = {
  default: "bg-white/5 text-muted-foreground border-white/5",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aurora: "bg-[var(--aurora-purple)]/20 text-white border-[var(--aurora-purple)]/30 shadow-[0_0_15px_-5px_var(--aurora-purple)]",
};

export function AdminPageHeader({
  title,
  subtitle,
  icon,
  stats,
  actions,
  className,
  layout = "default",
}: AdminPageHeaderProps) {
  if (layout === "minimalist") {
    return (
      <div className={cn("flex items-center justify-between mb-8 animate-in fade-in slide-in-from-left-4 duration-500", className)}>
        <div className="flex items-center gap-4">
          {icon && (
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6" }) : icon}
             </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground/60">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }

  if (layout === "luxury") {
    return (
      <div className={cn("relative p-6 md:p-10 rounded-[2rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden mb-8 animate-in fade-in zoom-in duration-1000", className)}>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            {icon && (
              <m.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-2xl"
              >
                <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center backdrop-blur-xl text-white">
                  {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-8 w-8" }) : icon}
                </div>
              </m.div>
            )}
            <div className="space-y-1">
              <m.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-black tracking-tighter text-white font-sans"
              >
                {title}
              </m.h1>
              {subtitle && (
                <m.p 
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.4 }}
                   className="text-base text-muted-foreground/80 font-medium tracking-wide"
                >
                  {subtitle}
                </m.p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3">
                {stats.map((stat, index) => (
                  <m.div
                    key={index}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-start lg:items-end min-w-[120px] transition-all hover:bg-white/10"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-black">
                      {stat.label}
                    </span>
                    <span className="text-xl font-black text-white">
                      {stat.value}
                    </span>
                  </m.div>
                ))}
              </div>
            )}
            {actions && <div className="flex items-center gap-4">{actions}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 glass-premium rounded-3xl border border-white/10 shadow-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden",
        className
      )}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--aurora-blue)]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
        <div className="flex items-center gap-5">
          {icon && (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white shadow-2xl border border-white/10 backdrop-blur-md">
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-8 w-8 stroke-[2px]" }) : icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-sans">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground font-medium mt-1 tracking-wide">
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
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all hover:scale-105",
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
        <div className="flex items-center gap-3 self-end md:self-center relative z-10">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN TABLE WRAPPER - Wrapper cho Table với khả năng tùy biến cao
 * =====================================================================
 */

interface AdminTableWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  variant?: "glass" | "solid" | "luxury";
}

export function AdminTableWrapper({
  children,
  title,
  description,
  headerActions,
  className,
  isLoading,
  variant = "glass",
}: AdminTableWrapperProps) {
  const variantClasses = {
    glass: "bg-background/40 backdrop-blur-3xl border-white/5 shadow-3xl",
    solid: "bg-card border-border shadow-md",
    luxury: "bg-black/60 backdrop-blur-3xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]",
  };

  return (
    <div
      className={cn(
        "rounded-[2rem] border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700",
        variantClasses[variant],
        className
      )}
    >
      {(title || description || headerActions) && (
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between px-8 py-7 border-b gap-4",
          variant === "luxury" ? "border-white/10 bg-white/5" : "border-white/5 bg-white/5"
        )}>
          <div>
            {title && (
              <h3 className="text-xl font-black text-white tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground font-medium mt-1 tracking-wide">
                {description}
              </p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl glass-premium border border-white/10 shadow-2xl">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-[3px] border-white/5" />
                <div className="absolute top-0 left-0 h-14 w-14 rounded-full border-[3px] border-[var(--aurora-blue)] border-t-transparent animate-spin shadow-[0_0_15px_var(--aurora-blue)]" />
              </div>
              <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase animate-pulse">
                Processing
              </span>
            </div>
          </div>
        )}
        <div className="p-2 overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * =====================================================================
 * ADMIN STATS CARD - Card thống kê đa dạng layout
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
  variant?: "default" | "success" | "warning" | "danger" | "info" | "aurora" | "neon";
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
    default: "bg-white/5 text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    aurora: "bg-[var(--aurora-purple)]/20 text-white shadow-[0_0_15px_var(--aurora-purple)] border-white/20",
    neon: "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.6)] border-none",
  };

  return (
    <m.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl p-7 transition-all duration-500 group relative overflow-hidden",
        variant === "neon" && "border-primary/30 bg-primary/10"
      )}
    >
      {variant === "aurora" && (
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-[var(--aurora-purple)]/20 rounded-full blur-2xl group-hover:bg-[var(--aurora-purple)]/30 transition-all" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">{value}</h2>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5",
                  trend.isPositive 
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                    : "text-red-400 bg-red-500/10 border-red-500/20"
                )}
              >
                {trend.isPositive ? "↑" : "↓"}{trend.value}%
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all group-hover:rotate-12 duration-500 shadow-xl border border-white/10",
              iconVariants[variant]
            )}
          >
            <Icon className="h-6 w-6 stroke-[2.5px]" />
          </div>
        )}
      </div>
      {description && (
        <p className="mt-4 text-xs text-muted-foreground/60 font-medium tracking-wide leading-relaxed relative z-10">
          {description}
        </p>
      )}
    </m.div>
  );
}

/**
 * =====================================================================
 * ADMIN ACTION BADGE & EMPTY STATE (PRO)
 * =====================================================================
 */

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-[3rem] border border-white/5 mx-4 my-4 group">
      {Icon && (
        <m.div 
          whileHover={{ rotate: [0, -10, 10, 0] }}
          className="mb-8 rounded-[2rem] bg-white/5 p-8 shadow-2xl border border-white/10 group-hover:bg-white/10 transition-all"
        >
          <Icon className="h-12 w-12 text-primary" />
        </m.div>
      )}
      <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground/60 max-w-sm font-medium leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}

export function AdminActionBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "aurora";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
        statVariants[variant === "purple" ? "aurora" : variant],
        className
      )}
    >
      {label}
    </span>
  );
}
