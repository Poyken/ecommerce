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
 * 2. IMPERSONATION ENTRY POINT:
 * - Nút "Log in as Owner" (khi được implement) sẽ gọi API `impersonate`
 *   để truy cập vào dashboard của tenant đó.
 * =====================================================================
 */ 
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Globe,
  Users,
  Package,
  ShoppingCart,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/routing";

export function TenantsTab({ tenants }: { tenants: any[] }) {
  if (!tenants || tenants.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Store className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-bold text-lg">No tenants yet</h3>
          <p className="text-muted-foreground mb-4">
            Launch your first store to see data here.
          </p>
          <Link href="/super-admin/tenants">
            <Button>Launch Tenant</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl shadow-sm border-foreground/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Stores</CardTitle>
          <CardDescription>
            Latest tenants onboarded to the platform
          </CardDescription>
        </div>
        <Link href="/super-admin/tenants">
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-600 font-bold"
          >
            Manage All Tenants <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {tenants.map((tenant: any) => (
          <div
            key={tenant.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-200 group gap-4"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg transition-transform group-hover:scale-110 shrink-0"
                style={{
                  backgroundColor:
                    tenant.themeConfig?.primaryColor || "#6366f1",
                  backgroundImage: `linear-gradient(135deg, ${
                    tenant.themeConfig?.primaryColor || "#6366f1"
                  } 0%, #4338ca 100%)`,
                }}
              >
                {(tenant.name || "Tenant").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base leading-none">
                    {tenant.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 font-bold uppercase tracking-widest"
                  >
                    {tenant.plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">
                    {tenant.domain}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {tenant._count?.users || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />{" "}
                    {tenant._count?.products || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />{" "}
                    {tenant._count?.orders || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 font-medium"
                onClick={() => alert("Impersonation feature coming soon!")}
              >
                <LogIn className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Log in as Owner</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
