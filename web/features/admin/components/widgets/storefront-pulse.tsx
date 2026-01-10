"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Fix: Ensure import is active
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Layout,
  Palette,
  PenTool,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface StorefrontPulseProps {
  pagesCount: number;
  publishedBlogs: number;
  activeTheme?: string;
}

/**
 * =====================================================================
 * STOREFRONT PULSE - Trung tâm điều khiển diện mạo cửa hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TỔNG QUAN HIỂN THỊ:
 * - Thay vì chỉ tập trung vào Sales, Admin cần quản lý diện mạo (CMS & Blog).
 * - Component này cung cấp lối tắt nhanh đến các phần thay đổi nội dung mặt tiền.
 *
 * 2. LIVE PREVIEW:
 * - Cho phép Admin nhảy nhanh ra trang chủ để kiểm tra thay đổi vừa thực hiện.
 */
export function StorefrontPulse({
  pagesCount,
  publishedBlogs,
  activeTheme = "Luxe Premium v2.0",
}: StorefrontPulseProps) {
  const t = useTranslations("admin.storefrontPulse");

  return (
    <GlassCard className="p-8 relative overflow-hidden group rounded-4xl border-foreground/5 bg-linear-to-br from-indigo-500/5 to-transparent">
      {/* Decorative Background Blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/10 rounded-2xl shadow-inner">
            <Globe className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-black text-2xl tracking-tight text-foreground">
              {t("title")}
            </h3>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {t("engine")}
              </p>
            </div>
          </div>
        </div>

        <Link href="/" target="_blank">
          <Button
            variant="outline"
            className="rounded-2xl h-11 px-6 border-indigo-500/20 text-indigo-600 font-bold hover:bg-indigo-500 hover:text-white transition-all group/btn shadow-sm"
          >
            {t("preview")}{" "}
            <ExternalLink className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* CMS Pages Stat */}
        <div className="p-6 rounded-[2rem] bg-foreground/2 border border-foreground/5 hover:border-indigo-500/30 transition-all duration-300 group/stat">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover/stat:bg-indigo-500/20 transition-colors">
              <Layout className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {t("pages")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-foreground tracking-tighter">
              {pagesCount}
            </span>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black border-none"
            >
              ACTIVE
            </Badge>
          </div>
          <Link
            href="/admin/pages"
            className="mt-6 flex items-center justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest group/link"
          >
            {t("updateStorefront")}{" "}
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Blogs Stat */}
        <div className="p-6 rounded-[2rem] bg-foreground/2 border border-foreground/5 hover:border-amber-500/30 transition-all duration-300 group/stat">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover/stat:bg-amber-500/20 transition-colors">
              <PenTool className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {t("blogs")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-foreground tracking-tighter">
              {publishedBlogs}
            </span>
            <span className="text-[10px] font-black text-muted-foreground uppercase">
              Posts
            </span>
          </div>
          <Link
            href="/admin/blogs"
            className="mt-6 flex items-center justify-between text-[10px] font-black text-amber-600 uppercase tracking-widest group/link"
          >
            {t("writeBlog")}{" "}
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Theme Stat */}
        <div className="p-6 rounded-[2rem] bg-foreground/2 border border-foreground/5 hover:border-purple-500/30 transition-all duration-300 group/stat">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover/stat:bg-purple-500/20 transition-colors">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {t("theme")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-foreground tracking-tight truncate">
              {activeTheme}
            </span>
          </div>
          <Link
            href="/admin/pages"
            className="mt-6 flex items-center justify-between text-[10px] font-black text-purple-600 uppercase tracking-widest group/link"
          >
            {t("globalStyles")}{" "}
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
