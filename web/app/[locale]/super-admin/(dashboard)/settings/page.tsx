/**
 * =====================================================================
 * PLATFORM SETTINGS - CẤU HÌNH TỔNG THỂ HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Nơi điều chỉnh các quy tắc chung của toàn nền tảng:
 * - Cho phép/Tắt đăng ký cửa hàng mới.
 * - Yêu cầu xác thực Email.
 * - Chế độ bảo trì hệ thống. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Global Configuration Hub: Nơi tập trung các "công tắc tổng" của hệ thống, cho phép thay đổi hành vi của toàn bộ nền tảng SaaS chỉ với một vài thao tác đơn giản.
 * - System-wide Feature Toggles: Hỗ trợ triển khai các tính năng mới một cách an toàn (Canary Release) hoặc nhanh chóng kích hoạt Chế độ bảo trì khi hệ thống cần nâng cấp hạ tầng quan trọng.

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Shield, Globe, Lock } from "lucide-react";

import { useTranslations } from "next-intl";

export default function PlatformSettingsPage() {
  const t = useTranslations("superAdmin.settings");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-muted-foreground font-medium">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-black">
                {t("sections.registrations.title")}
              </CardTitle>
            </div>
            <CardDescription>
              {t("sections.registrations.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.registrations.publicSignups")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("sections.registrations.publicSignupsDesc")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.registrations.emailVerification")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("sections.registrations.emailVerificationDesc")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.registrations.manualApproval")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("sections.registrations.manualApprovalDesc")}
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-foreground/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-xl font-black">
                {t("sections.infrastructure.title")}
              </CardTitle>
            </div>
            <CardDescription>
              {t("sections.infrastructure.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.infrastructure.maintenance")}
                </Label>
                <p className="text-xs text-rose-500 font-bold">
                  {t("sections.infrastructure.maintenanceDesc")}
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.infrastructure.hsts")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("sections.infrastructure.hstsDesc")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">
                  {t("sections.infrastructure.backups")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("sections.infrastructure.backupsDesc")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
          <Save className="mr-2 h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
