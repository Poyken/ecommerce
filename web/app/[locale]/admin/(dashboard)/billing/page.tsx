/**
 * =====================================================================
 * BILLING PAGE - QUẢN LÝ GÓI CƯỚC VÀ THANH TOÁN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này cho phép Tenant (chủ cửa hàng) xem gói đăng ký hiện tại.
 * 1. SUBSCRIPTION DATA: Fetch thông tin gói từ backend API /subscriptions/current.
 * 2. PLAN STATUS: Hiển thị các giới hạn (Usage limits) dựa trên gói (Basic/Pro/Enterprise). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { adminBillingService } from "@/features/admin/services/admin-billing.service";
import { format } from "date-fns";
import { CreditCard, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const t = await getTranslations("admin.billing");

  // Fetch current subscription from Backend API
  const { data: subscription } = await adminBillingService
    .getCurrentSubscription()
    .catch(() => ({ data: null }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan and billing details"
        icon={<CreditCard className="text-blue-500 fill-blue-500/10" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Current Plan</h3>
            <Badge
              variant={
                subscription?.plan === "ENTERPRISE" ? "default" : "secondary"
              }
            >
              {subscription?.plan || "BASIC"}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">
                {subscription?.plan === "PRO"
                  ? "$29/mo"
                  : subscription?.plan === "ENTERPRISE"
                  ? "$99/mo"
                  : "Free"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Next Billing</span>
              <span className="font-medium">
                {subscription?.nextBillingDate
                  ? format(new Date(subscription.nextBillingDate), "dd/MM/yyyy")
                  : "Forever"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button className="w-full gap-2">
              <Zap className="h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Usage Limits Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Usage Limits</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Products</span>
                <span className="text-muted-foreground">
                  {subscription?.plan === "BASIC"
                    ? "100 max"
                    : subscription?.plan === "PRO"
                    ? "1,000 max"
                    : "Unlimited"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[40%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Staff Members</span>
                <span className="text-muted-foreground">
                  {subscription?.plan === "BASIC"
                    ? "2 max"
                    : subscription?.plan === "PRO"
                    ? "10 max"
                    : "Unlimited"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[20%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
