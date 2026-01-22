

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
import { Save, Shield, Globe, Lock, Settings } from "lucide-react";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";

import { useTranslations } from "next-intl";

export default function PlatformSettingsPage() {
  const t = useTranslations("superAdmin.settings");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<Settings className="text-cyan-500 fill-cyan-500/20" />}
        variant="cyan"
      />

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
