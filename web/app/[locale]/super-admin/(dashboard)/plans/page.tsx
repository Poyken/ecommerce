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
import { Plus } from "lucide-react";
import { PlansClient } from "./plans-client";
import { getPlansAction } from "@/features/super-admin/domain-actions/plans-actions";
import { PlanDialog } from "./plan-dialog";

export default async function PlansPage() {
  const { data: plansRes } = await getPlansAction();
  const plans = plansRes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground">
            Manage available plans for tenants.
          </p>
        </div>
        <PlanDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          }
        />
      </div>
      <PlansClient initialPlans={plans} />
    </div>
  );
}
