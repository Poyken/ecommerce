/**
 * =====================================================================
 * TENANTS TAB - Danh sách Tenants (Super Admin)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-TENANT UI:
 * - Hiển thị danh sách các cửa hàng đang thuê hệ thống.
 * - Mỗi thẻ Tenant hiển thị các chỉ số cơ bản (User, Sản phẩm, Đơn hàng) để đánh giá nhanh quy mô.
 *
 * 2. LUXURY UI (NEW):
 * - Sử dụng AdminTableWrapper với variant luxury để đồng bộ với Admin UI.
 *
 * =====================================================================
 */ 
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Store,
  Globe,
  Users,
  Package,
  ShoppingCart,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { AdminTableWrapper, AdminEmptyState } from "@/features/admin/components/ui/admin-page-components";
import { Link } from "@/i18n/routing";

export function TenantsTab({ tenants }: { tenants: any[] }) {
  if (!tenants || tenants.length === 0) {
    return (
      <AdminEmptyState
        icon={Store}
        title="No tenants yet"
        description="Launch your first store to see data here."
        action={
          <Link href="/super-admin/tenants">
            <Button className="rounded-xl font-bold">Launch Tenant</Button>
          </Link>
        }
      />
    );
  }

  return (
    <AdminTableWrapper
      title="Recent Stores Pulse"
      description="Latest tenants onboarded to the platform with real-time health metrics"
      variant="glass"
      headerActions={
        <Link href="/super-admin/tenants">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-black uppercase text-[10px] tracking-widest"
          >
            Manage All Tenants <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <div className="p-6 space-y-4">
        {tenants.map((tenant: any) => (
          <div
            key={tenant.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 group gap-4 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-2xl transition-transform group-hover:scale-110 shrink-0 border border-white/10"
                style={{
                  backgroundColor:
                    tenant.themeConfig?.primaryColor || "#6366f1",
                  backgroundImage: `linear-gradient(135deg, ${
                    tenant.themeConfig?.primaryColor || "#6366f1"
                  } 0%, #4338ca 100%)`,
                }}
              >
                {(tenant.name || "Tenant").substring(0, 1).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="font-black text-lg leading-none text-white tracking-tight">
                    {tenant.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 font-black uppercase tracking-widest bg-white/10 text-white border-0"
                  >
                    {tenant.plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground/80 font-bold">
                    {tenant.domain}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    <Users className="h-3 w-3" /> {tenant._count?.users || 0}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    <Package className="h-3 w-3" />{" "}
                    {tenant._count?.products || 0}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    <ShoppingCart className="h-3 w-3" />{" "}
                    {tenant._count?.orders || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 font-black uppercase text-[10px] tracking-widest border-white/5 hover:bg-white/10"
                onClick={() => alert("Impersonation feature coming soon!")}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log in as Owner</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AdminTableWrapper>
  );
}
