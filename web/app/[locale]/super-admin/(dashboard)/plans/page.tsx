// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// SUBSCRIPTION PLANS PAGE - QUẢN LÝ CÁC GÓI DỊCH VỤ
// =================================================================================================
//
// Server Component này quản lý danh mục các gói dịch vụ (Subscription Plans) mà nền tảng cung cấp
// cho các Merchant (Chủ shop). Ví dụ: Gói Basic, Pro, Enterprise.
//
// TÍNH NĂNG:
// 1. List Plans: Hiển thị danh sách các gói hiện có.
// 2. Add Plan: Nút gọi Dialog thêm mới gói (Client Component `PlanDialog` được pass vào đây).
//
// UX/UI PATTERN:
// - Sử dụng Slot Pattern: `trigger={<Button>...}` được truyền vào `PlanDialog`.
//   Điều này giúp giữ logic UI nút bấm ("Add Plan") ở component cha, trong khi logic
//   xử lý Dialog nằm gọn ở component con.
// =================================================================================================
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { PlansClient } from "./plans-client";
import { getPlansAction } from "@/features/super-admin/domain-actions/plans-actions";
import { PlanDialog } from "./plan-dialog";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";

export default async function PlansPage() {
  const t = await getTranslations("superAdmin.plans");
  const res = await getPlansAction();
  const plans = res.data || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<Zap className="text-amber-500 fill-amber-500/20" />}
        stats={[
          {
            label: "Active Plans",
            value: plans.filter((p: any) => p.isActive).length,
            variant: "success",
          },
          { label: "Total Plans", value: plans.length, variant: "default" },
        ]}
        actions={
          <PlanDialog
            trigger={
              <Button className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                <Plus className="mr-2 h-5 w-4 font-black" /> {t("addPlan")}
              </Button>
            }
          />
        }
      />

      <div className="bg-white dark:bg-slate-950 rounded-4xl border shadow-sm overflow-hidden">
        <PlansClient initialPlans={plans} />
      </div>
    </div>
  );
}
