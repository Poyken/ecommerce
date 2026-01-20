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
  variant?: "default" | "success" | "warning" | "danger" | "info" | "aurora" | "emerald" | "sky" | "violet" | "rose" | "amber" | "indigo" | "teal" | "orange" | "blue" | "cyan" | "slate" | "secondary";

}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  stats?: StatItem[];
  actions?: React.ReactNode;
  className?: string;
  layout?: "default" | "luxury" | "minimalist" | "glass";
  variant?: "default" | "success" | "warning" | "danger" | "info" | "aurora" | "emerald" | "sky" | "violet" | "rose" | "amber" | "indigo" | "teal" | "orange" | "blue" | "cyan" | "slate" | "secondary";
  children?: React.ReactNode;
}

const statVariants = {
  default: "bg-white/5 text-muted-foreground border-border",
  success: "bg-white dark:bg-zinc-900 text-foreground border-border",
  warning: "bg-white dark:bg-zinc-900 text-foreground border-border",
  danger: "bg-white dark:bg-zinc-900 text-foreground border-border",
  info: "bg-white dark:bg-zinc-900 text-foreground border-border",
  aurora: "bg-linear-to-r from-[--aurora-blue]/10 via-[--aurora-purple]/10 to-[--aurora-orange]/10 border-[--aurora-blue]/20 hover:border-[--aurora-blue]/40",
  emerald: "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5",
  sky: "border-sky-500/20 hover:border-sky-500/40 bg-sky-500/5",
  violet: "border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5",
  rose: "border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5",
  amber: "border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5",
  indigo: "border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5",
  teal: "border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5",
  orange: "border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5",
  blue: "border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5",
  cyan: "border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5",
  slate: "border-slate-500/20 hover:border-slate-500/40 bg-slate-500/5",
  secondary: "bg-secondary/50 text-secondary-foreground border-border",
};

const colorPalette: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  default: { bg: "bg-secondary/50", border: "border-border", text: "text-foreground", icon: "text-primary" },
  success: { bg: "bg-emerald-500/15", border: "border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-600" },
  warning: { bg: "bg-amber-500/15", border: "border-amber-500/20", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-600" },
  danger: { bg: "bg-rose-500/15", border: "border-rose-500/20", text: "text-rose-700 dark:text-rose-400", icon: "text-rose-600" },
  info: { bg: "bg-blue-500/15", border: "border-blue-500/20", text: "text-blue-700 dark:text-blue-400", icon: "text-blue-600" },
  aurora: { bg: "bg-(--aurora-purple)/15", border: "border-(--aurora-blue)/20", text: "text-(--aurora-purple)", icon: "text-(--aurora-purple)" },
  emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-600" },
  sky: { bg: "bg-sky-500/15", border: "border-sky-500/20", text: "text-sky-700 dark:text-sky-400", icon: "text-sky-600" },
  violet: { bg: "bg-violet-500/15", border: "border-violet-500/20", text: "text-violet-700 dark:text-violet-400", icon: "text-violet-600" },
  rose: { bg: "bg-rose-500/15", border: "border-rose-500/20", text: "text-rose-700 dark:text-rose-400", icon: "text-rose-600" },
  amber: { bg: "bg-amber-500/15", border: "border-amber-500/20", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-600" },
  indigo: { bg: "bg-indigo-500/15", border: "border-indigo-500/20", text: "text-indigo-700 dark:text-indigo-400", icon: "text-indigo-600" },
  teal: { bg: "bg-teal-500/15", border: "border-teal-500/20", text: "text-teal-700 dark:text-teal-400", icon: "text-teal-600" },
  orange: { bg: "bg-orange-500/15", border: "border-orange-500/20", text: "text-orange-700 dark:text-orange-400", icon: "text-orange-600" },
  blue: { bg: "bg-blue-500/15", border: "border-blue-500/20", text: "text-blue-700 dark:text-blue-400", icon: "text-blue-600" },
  cyan: { bg: "bg-cyan-500/15", border: "border-cyan-500/20", text: "text-cyan-700 dark:text-cyan-400", icon: "text-cyan-600" },
  slate: { bg: "bg-slate-500/15", border: "border-slate-500/20", text: "text-slate-700 dark:text-slate-400", icon: "text-slate-600" },
};

const textVariants = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  info: "text-blue-600 dark:text-blue-400",
  aurora: "text-[var(--aurora-purple)]",
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  teal: "text-teal-600 dark:text-teal-400",
  orange: "text-orange-600 dark:text-orange-400",
  blue: "text-blue-600 dark:text-blue-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  slate: "text-slate-600 dark:text-slate-400",
  secondary: "text-secondary-foreground",
};

export function AdminPageHeader({
  title,
  subtitle,
  icon,
  stats,
  actions,
  className,
  layout = "default",
  variant = "default",
  children,
}: AdminPageHeaderProps) {
  if (layout === "minimalist") {
    const iconVariants = {
      default: "bg-primary/5 text-primary border-primary/10",
      success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      danger: "bg-red-500/10 text-red-600 border-red-500/20",
      info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      aurora: "bg-[var(--aurora-blue)]/10 text-[var(--aurora-purple)] border-[var(--aurora-blue)]/20",
      emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      secondary: "bg-secondary text-secondary-foreground border-border",
    };
    
    return (
      <div className={cn("flex items-center justify-between mb-8 animate-in fade-in slide-in-from-left-4 duration-500", className)}>
        <div className="flex items-center gap-4">
          {icon && (
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                variant === "default" ? "bg-primary/5 text-primary border border-primary/10" : iconVariants[variant]
              )}>
                {React.isValidElement(icon) 
                  ? React.cloneElement(icon as React.ReactElement<any>, { 
                      className: cn("h-6 w-6 stroke-[2px]", (icon as any).props?.className?.includes('fill-') ? "" : "fill-current/10") 
                    }) 
                  : icon}
              </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground/60">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }

  if (layout === "luxury") {
    return (
      <div className={cn("relative p-6 md:p-10 rounded-4xl bg-card/40 backdrop-blur-3xl border border-border/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden mb-8 animate-in fade-in zoom-in duration-1000", className)}>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            {icon && (
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-primary/5 border border-border flex items-center justify-center p-4 text-primary"
              >
                 {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-full h-full stroke-[1.5]" }) : icon}
              </m.div>
            )}
            <div className="space-y-1">
              <m.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-black tracking-tighter text-foreground font-sans"
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
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-border/10 backdrop-blur-md flex flex-col items-start lg:items-end min-w-[120px] transition-all hover:bg-white/10"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-black">
                      {stat.label}
                    </span>
                    <span className="text-xl font-black text-foreground">
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
        "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 rounded-3xl border mb-8 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden",
        "glass-premium border border-border/50", // Neutral background
        className
      )}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-(--aurora-blue)/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
        <div className="flex items-center gap-5">
          {icon && (
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm backdrop-blur-md transition-all duration-500",
                variant === "default"
                  ? "bg-white/5 text-primary border border-white/10"
                  : cn((colorPalette[variant] || colorPalette.default).bg) // No border
              )}
            >
              <div className={cn(variant === "default" ? "text-primary" : (colorPalette[variant] || colorPalette.default).icon)}>
                {React.isValidElement(icon) 
                  ? React.cloneElement(icon as React.ReactElement<any>, { 
                      className: cn("h-8 w-8 stroke-[2px]", (icon as any).props?.className?.includes('fill-') ? "" : "fill-current/10") 
                    }) 
                  : icon}
              </div>
            </div>

          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-sans">
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
            {stats.map((stat, index) => {
              const activeVariant = stat.variant || variant;
              const palette = colorPalette[activeVariant] || colorPalette.default;
              return (
              <span
                key={index}
                className={cn(
                  "px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 flex items-center gap-2",
                  activeVariant === "default" 
                    ? "bg-white/5 border-white/10 text-muted-foreground border" 
                    : cn(palette.bg) // No border, just bg
                )}
              >
                <span className={cn(
                  "opacity-60 font-bold",
                   activeVariant === "default" ? "text-muted-foreground" : "text-foreground"
                )}>{stat.label}</span>
                <span className={cn(
                  "opacity-100 font-black text-sm",
                   activeVariant === "default" ? "text-foreground" : palette.text
                )}>
                  {stat.value}
                </span>
              </span>
            )})}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 self-end md:self-center relative z-10">
          {actions}
        </div>
      )}

      {children && (
        <div className="w-full mt-4 pt-4 border-t border-border/20 relative z-10">
          {children}
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
  loadingMessage?: string;
  variant?: "default" | "glass";
}

export function AdminTableWrapper({
  children,
  title,
  description,
  headerActions,
  className,
  isLoading,
  loadingMessage,
  variant = "default",
}: AdminTableWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700",
        variant === "glass" ? "glass-card border-none" : "glass-premium border border-border/80",
        className
      )}
    >
      {(title || description || headerActions) && (
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between px-8 py-7 border-b gap-4 border-border/40 bg-white/5"
        )}>
          <div>
            {title && (
              <h1 className={cn(
                "text-3xl sm:text-4xl font-black tracking-tight mb-2 text-foreground"
              )}>
                {title}
              </h1>
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl glass-card border border-border/10 shadow-2xl">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-[3px] border-primary/10" />
                <div className="absolute top-0 left-0 h-14 w-14 rounded-full border-[3px] border-primary border-t-transparent animate-spin shadow-sm" />
              </div>
              <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase animate-pulse">
                {loadingMessage || "Processing"}
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
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
  variant?: "default" | "success" | "warning" | "danger" | "info" | "aurora" | "emerald" | "sky" | "violet" | "rose" | "amber" | "indigo" | "teal" | "orange" | "blue" | "cyan" | "slate" | "secondary";

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
    default: "bg-secondary/50 text-primary border-border",
    success: "bg-secondary/50 text-primary border-border",
    warning: "bg-secondary/50 text-primary border-border",
    danger: "bg-secondary/50 text-primary border-border",
    info: "bg-secondary/50 text-primary border-border",
    aurora: "bg-secondary/50 text-primary border-border",
    neon: "bg-secondary/50 text-primary border-border",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
  };

  return (
    <m.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "rounded-4xl border bg-card/50 backdrop-blur-xl p-7 transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-md",
        variant === "default" && "border-border hover:border-foreground/20",
        statVariants[variant]
      )}
    >
      {variant === "aurora" && (
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-(--aurora-purple)/20 rounded-full blur-2xl group-hover:bg-(--aurora-purple)/30 transition-all" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-foreground tracking-tighter">{value}</h2>
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
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all group-hover:rotate-12 duration-500 shadow-sm border border-border",
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
  variant = "default",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "minimal";
}) {
  const isMinimal = variant === "minimal";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center group",
      isMinimal 
        ? "py-10" 
        : "py-28 rounded-2xl border border-border/80 bg-muted/10 glass-premium"
    )}>
      {Icon && (
        <m.div 
          whileHover={{ rotate: [0, -10, 10, 0] }}
          className={cn(
            "rounded-4xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all",
            isMinimal ? "mb-4 p-6" : "mb-8 p-8"
          )}
        >
          <Icon className={cn("text-primary", isMinimal ? "h-8 w-8" : "h-12 w-12")} />
        </m.div>
      )}
      <h3 className={cn("font-black text-foreground tracking-tight", isMinimal ? "text-xl" : "text-2xl")}>{title}</h3>
      {description && (
        <p className={cn(
          "mt-2 text-muted-foreground/60 max-w-sm font-medium leading-relaxed",
          isMinimal ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      {action && <div className={cn(isMinimal ? "mt-6" : "mt-10")}>{action}</div>}
    </div>
  );
}

export function AdminActionBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "aurora" | "emerald" | "sky" | "violet" | "rose" | "amber" | "indigo" | "teal" | "orange" | "blue" | "cyan" | "slate" | "secondary";

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
