"use client";

import { useToast } from "@/components/ui/use-toast";
import { AnimatedError } from "@/components/shared/animated-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTenantAction,
  updateTenantAction,
} from "@/features/admin/actions";
import { CreateTenantDto } from "@/types/dtos";
import { Tenant } from "@/types/models";
import {
  Users,
  Package,
  CreditCard,
  Loader2,
  BarChart3,
  Globe,
  Hash,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  mode?: "create" | "edit" | "view";
}

/**
 * =================================================================================================
 * TENANT DIALOG - FORM QUẢN LÝ CỬA HÀNG (TENANT)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Component này đa năng: Vừa là form Tạo mới (Create), Sửa (Edit), vừa là Xem chi tiết (View).
 *    - Được điều khiển qua prop `mode`.
 *
 * 2. LOGIC TÊN MIỀN (DOMAIN):
 *    - Mỗi Tenant (Cửa hàng) chạy trên một Subdomain (VD: store1.flatform.com) hoặc Custom Domain.
 *    - Trong môi trường DEV (Localhost), việc map domain hơi phức tạp (cần sửa file hosts).
 *    - Dialog này hiển thị hướng dẫn suffix `.local` để dễ test.
 *
 * 3. TẠO ADMIN (AUTO-PROVISIONING):
 *    - Khi tạo Tenant mới, ta đồng thời tạo luôn 1 tài khoản Admin cho Tenant đó.
 *    - Backend sẽ sử dụng Transaction để đảm bảo cả 2 việc này thành công hoặc cùng thất bại (Atomic). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  mode = "create",
}: TenantDialogProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateTenantDto>({
    defaultValues: {
      plan: "BASIC",
      themeConfig: {
        primaryColor: "#000000",
      },
    },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan as any,
        themeConfig: {
          primaryColor: tenant.themeConfig?.primaryColor || "#000000",
        },
      });
    } else {
      reset({
        plan: "BASIC",
        themeConfig: {
          primaryColor: "#000000",
        },
      });
    }
  }, [tenant, reset, open]);

  const onSubmit = async (data: CreateTenantDto) => {
    if (isView) return;
    setIsPending(true);

    const result =
      isEdit && tenant
        ? await updateTenantAction(tenant.id, data)
        : await createTenantAction(data);

    setIsPending(false);

    if (result.success) {
      toast({
        title: "Thành công",
        description: isEdit
          ? "Cập nhật tenant thành công"
          : "Khởi tạo tenant và Admin thành công",
        variant: "success",
      });
      onOpenChange(false);
      reset();
    } else {
      toast({
        title: "Lỗi",
        description: result.error || "Thao tác thất bại",
        variant: "destructive",
      });
    }
  };

  const t = useTranslations("superAdmin.tenants.dialog");

  const title = isView
    ? t("titleView") || "Chi tiết Tenant"
    : isEdit
    ? t("titleEdit") || "Chỉnh sửa Tenant"
    : t("titleCreate") || "Khởi tạo Tenant mới";
  const description = isView
    ? t("descriptionView") || "Xem thông tin cấu hình chi tiết của cửa hàng."
    : isEdit
    ? t("descriptionEdit") ||
      "Cập nhật thông tin cấu hình cho cửa hàng hiện tại."
    : t("descriptionCreate") ||
      "Triển khai một cửa hàng chuyên biệt (niche store) mới trên hệ thống.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-1">
              {t("sections.basic")}
            </h3>
            <div className="grid gap-2">
              <Label
                htmlFor="name"
                className="text-slate-700 font-semibold text-xs"
              >
                {t("fields.name")}
              </Label>
              <Input
                id="name"
                placeholder="VD: Nội thất cao cấp"
                className="bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900"
                disabled={isView}
                {...register("name", { required: true })}
              />
              <AnimatedError
                message={errors.name && t("validation.required")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="domain"
              className="text-slate-700 font-semibold text-xs"
            >
              {t("fields.domain")}
            </Label>
            <div className="relative">
              <Input
                id="domain"
                placeholder="VD: noithat.local"
                className="bg-slate-50 border-slate-200 focus:ring-indigo-500 pr-12 text-slate-900"
                disabled={isView}
                {...register("domain", { required: true })}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                .local
              </div>
            </div>
            <AnimatedError
              message={errors.domain && t("validation.required")}
            />
            {!isView && (
              <p className="text-[10px] text-slate-400 italic">
                {t("hints.domain")}
              </p>
            )}
          </div>

          {!isEdit && !isView && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                {t("sections.adminAccount")}
              </h3>

              <div className="grid gap-2">
                <Label
                  htmlFor="adminEmail"
                  className="text-slate-700 text-xs font-semibold"
                >
                  {t("fields.adminEmail")}
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  className="bg-white border-slate-200 focus:ring-indigo-500 text-slate-900 h-9 text-sm"
                  {...register("adminEmail", {
                    required: true,
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="adminPassword"
                  className="text-slate-700 text-xs font-semibold"
                >
                  {t("fields.adminPassword")}
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white border-slate-200 focus:ring-indigo-500 text-slate-900 h-9 text-sm"
                  {...register("adminPassword", {
                    required: true,
                    minLength: 6,
                  })}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label
              htmlFor="plan"
              className="text-slate-700 font-semibold text-xs"
            >
              {t("fields.plan")}
            </Label>
            <Select
              onValueChange={(val) => setValue("plan", val as any)}
              value={watch("plan")}
              disabled={isView}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder={t("buttons.selectPlan")} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="BASIC">Cơ bản (Basic)</SelectItem>
                <SelectItem value="PRO">Chuyên nghiệp (Pro)</SelectItem>
                <SelectItem value="ENTERPRISE">
                  Doanh nghiệp (Enterprise)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-700 font-semibold text-xs">
              {t("fields.color")}
            </Label>
            <div className="flex gap-3 items-center">
              <div
                className="w-10 h-10 rounded-lg border-2 border-slate-200 shadow-sm overflow-hidden"
                style={{ backgroundColor: watch("themeConfig.primaryColor") }}
              >
                <Input
                  type="color"
                  {...register("themeConfig.primaryColor")}
                  className="opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                  disabled={isView}
                />
              </div>
              <Input
                {...register("themeConfig.primaryColor")}
                placeholder="#000000"
                className="flex-1 bg-slate-50 border-slate-200 font-mono text-slate-900"
                disabled={isView}
              />
            </div>
            {!isView && (
              <p className="text-[10px] text-slate-400 italic">
                {t("hints.color")}
              </p>
            )}
          </div>

          {(isEdit || isView) && tenant?._count && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4 shadow-inner">
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2 border-b border-indigo-100 pb-2 uppercase tracking-wider">
                <BarChart3 className="h-4 w-4" />
                {t("sections.metrics")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-center">
                  <div className="flex justify-center mb-1">
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-indigo-900 leading-none">
                    {tenant._count.users}
                  </div>
                  <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight mt-1">
                    KHÁCH HÀNG
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-center">
                  <div className="flex justify-center mb-1">
                    <Package className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-indigo-900 leading-none">
                    {tenant._count.products}
                  </div>
                  <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight mt-1">
                    SẢN PHẨM
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-center">
                  <div className="flex justify-center mb-1">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-indigo-900 leading-none">
                    {tenant._count.orders}
                  </div>
                  <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight mt-1">
                    {t("metrics.orders")}
                  </div>
                </div>
              </div>

              {/* System Info Section (Read-only) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-1 uppercase tracking-wider">
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("sections.system")}
                </h3>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Hash className="h-3 w-3" /> {t("fields.id")}
                    </span>
                    <span className="text-slate-900 font-mono font-bold">
                      {tenant?.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {t("fields.createdAt")}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {tenant?.createdAt
                        ? format(new Date(tenant.createdAt), "dd/MM/yyyy")
                        : "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3" /> {t("fields.updatedAt")}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {tenant?.updatedAt
                        ? format(new Date(tenant.updatedAt), "dd/MM/yyyy")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-white pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-slate-600 hover:text-slate-900 border-slate-200"
              disabled={isPending}
            >
              {isView ? t("buttons.close") : t("buttons.cancel")}
            </Button>
            {!isView && (
              <Button
                type="submit"
                disabled={
                  isPending ||
                  (isEdit
                    ? !isDirty
                    : !watch("name") ||
                      !watch("domain") ||
                      !watch("adminEmail") ||
                      !watch("adminPassword"))
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? t("buttons.update") : t("buttons.create")}
              </Button>
            )}
            {isView && (
              <Button
                type="button"
                onClick={() => {
                  const protocol = window.location.protocol;
                  const host = window.location.host;
                  let targetDomain = tenant?.domain || "";
                  if (
                    host.includes("localhost") &&
                    !targetDomain.includes(":")
                  ) {
                    const port = host.split(":")[1] || "3000";
                    targetDomain = `${targetDomain}:${port}`;
                  }
                  window.open(`${protocol}//${targetDomain}/admin`, "_blank");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md"
              >
                {t("buttons.goToAdmin")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
