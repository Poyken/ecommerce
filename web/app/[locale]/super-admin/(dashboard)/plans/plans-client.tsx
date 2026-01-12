// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// PLANS LIST CLIENT COMPONENT
// =================================================================================================
//
// Component hiển thị danh sách các Subscription Plans dưới dạng bảng.
//
// ĐIỂM CẦN LƯU Ý:
// 1. Data Type Consistency: Interface `SubscriptionPlan` phải khớp với Prisma Model ở Backend và
//    kiểu dữ liệu component cha truyền xuống.
//
// 2. State Management:
//    - `plans`: State local để render UI. Mặc dù dữ liệu ban đầu đến từ Server Props (`initialPlans`),
//      việc có state local cho phép ta thực hiện các thao tác filters/sort client-side sau này nếu cần.
//    - `editingPlan`: Lưu trữ object plan đang được chọn để sửa.
//
// 3. Delete Flow:
//    - Xác nhận bằng `window.confirm` đơn giản (có thể nâng cấp lên Dialog đẹp hơn sau này).
//    - Gọi Server Action `deletePlanAction` và dùng `router.refresh()` để reload data.
// =================================================================================================
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePlanAction } from "@/features/super-admin/domain-actions/plans-actions";
import { MoreHorizontal, Pencil, Trash, Zap } from "lucide-react";
import { useState } from "react";
import { PlanDialog } from "./plan-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";

// Type definition matching Prisma Model
interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number; // Decimal comes as string or number depending on Serializer
  priceYearly: number;
  currency: string;
  maxProducts: number;
  maxStorage: number;
  isActive: boolean;
  isPublic: boolean;
  features?: string | any; // JSON
}

interface PlansClientProps {
  initialPlans: SubscriptionPlan[];
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Sync with server props
  if (initialPlans !== plans) {
    setPlans(initialPlans);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    const res = await deletePlanAction({ id });
    if (res?.success) {
      toast({ variant: "success", title: "Plan deleted" });
      router.refresh();
    } else {
      toast({
        title: "Failed to delete",
        variant: "destructive",
        description: res?.error || "Failed to delete plan",
      });
    }
  };

  return (
    <>
      <AdminTableWrapper>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <TableHead className="py-5 font-bold text-slate-900 dark:text-slate-100">
                Plan Name
              </TableHead>
              <TableHead className="py-5 font-bold text-slate-900 dark:text-slate-100">
                Slug
              </TableHead>
              <TableHead className="py-5 font-bold text-slate-900 dark:text-slate-100">
                Price (Month / Year)
              </TableHead>
              <TableHead className="py-5 font-bold text-slate-900 dark:text-slate-100">
                Limits
              </TableHead>
              <TableHead className="py-5 font-bold text-slate-900 dark:text-slate-100">
                Status
              </TableHead>
              <TableHead className="py-5 text-right font-bold text-slate-900 dark:text-slate-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-48 text-muted-foreground italic"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 opacity-20" />
                    No plans found. Create one to get started.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <TableCell className="font-medium py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {plan.name}
                      </span>
                      {plan.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {plan.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] tracking-tighter bg-slate-50 dark:bg-slate-900 uppercase px-2 py-0 border-slate-200 dark:border-slate-800"
                    >
                      {plan.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <span>${Number(plan.priceMonthly)}</span>
                      <span className="text-muted-foreground font-normal">
                        /
                      </span>
                      <span className="text-primary">
                        ${Number(plan.priceYearly)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-xs space-y-1.5 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {plan.maxProducts === -1
                          ? "Unlimited"
                          : plan.maxProducts}{" "}
                        Products
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {plan.maxStorage} MB Storage
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {plan.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200/50 shadow-sm border rounded-full px-3">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-3"
                        >
                          Inactive
                        </Badge>
                      )}
                      {plan.isPublic && (
                        <Badge
                          variant="outline"
                          className="border-indigo-200 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 rounded-full px-3"
                        >
                          Public
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-sm border-transparent hover:border-slate-200 transition-all"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-2xl p-2 shadow-2xl border-slate-200 dark:border-slate-800"
                      >
                        <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground px-3 py-2">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsEditOpen(true);
                          }}
                          className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-900"
                        >
                          <Pencil className="mr-3 h-4 w-4 text-amber-500" />{" "}
                          <span className="font-semibold">Edit Plan</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 rounded-xl px-3 py-2.5 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash className="mr-3 h-4 w-4" />{" "}
                          <span className="font-semibold">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      <PlanDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingPlan(null);
        }}
        planToEdit={editingPlan}
      />
    </>
  );
}
