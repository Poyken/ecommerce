/**
 * =====================================================================
 * SECURITY HUB - TRUNG TÂM PHÒNG CHỐNG TẤN CÔNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là "nút bấm khẩn cấp" của hệ thống SaaS:
 * 1. EMERGENCY LOCKDOWN: Khóa toàn bộ nền tảng nếu phát hiện tấn công.
 * 2. IP WHITELIST: Chỉ cho phép các IP tin tưởng được truy cập Super Admin.
 * 3. THREAT DETECTION: Theo dõi số lần login sai toàn hệ thống.
 * =====================================================================
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import {
  Activity,
  ArrowLeft,
  Eye,
  Fingerprint,
  Globe,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Trash2,
} from "lucide-react";
import {
  getLockdownStatusAction,
  getSecurityStatsAction,
  toggleLockdownAction,
  getSuperAdminWhitelistAction,
  updateSuperAdminWhitelistAction,
  getMyIpAction,
} from "@/features/admin/actions";
import { SecurityStats } from "@/types/dtos";
import { toast } from "@/components/shared/use-toast";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function SecurityHubPage() {
  const t = useTranslations("superAdmin.security");
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLockdown, setIsLockdown] = useState<boolean>(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [savingWhitelist, setSavingWhitelist] = useState(false);
  const [fetchingIp, setFetchingIp] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, lockdownRes, whitelistRes] = await Promise.all([
          getSecurityStatsAction(),
          getLockdownStatusAction(),
          getSuperAdminWhitelistAction(),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (lockdownRes.success && lockdownRes.data) {
          setIsLockdown(lockdownRes.data.isEnabled);
        }
        if (whitelistRes.success && Array.isArray(whitelistRes.data)) {
          setWhitelist(whitelistRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch security data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleToggleLockdown = async () => {
    setIsConfirmDialogOpen(false);
    setToggling(true);
    const nextState = !isLockdown;
    try {
      const res = await toggleLockdownAction(nextState);
      if (res.success) {
        setIsLockdown(nextState);
        toast({
          title: nextState ? t("lockdown.active") : t("lockdown.inactive"),
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error || "Failed to toggle lockdown",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleAddIp = () => {
    if (!newIp) return;
    const trimmedIp = newIp.trim();
    if (!trimmedIp) return;

    // Support both IPv4 and IPv6
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedIp);
    const isIpv6 = trimmedIp.includes(":") && trimmedIp.length >= 3;

    if (!isIpv4 && !isIpv6) {
      toast({ title: "Invalid IP address format", variant: "destructive" });
      return;
    }
    if (whitelist.includes(trimmedIp)) {
      toast({
        title: t("whitelist.alreadyExists") || "IP already in whitelist",
        variant: "destructive",
      });
      return;
    }
    setWhitelist([...whitelist, trimmedIp]);
    setNewIp("");
  };

  const handleAddYourIp = async () => {
    setFetchingIp(true);
    try {
      const res = await getMyIpAction();
      if (res.success && res.data && res.data.ip) {
        setNewIp(res.data.ip);
        toast({
          title: "IP Fetched",
          description: `Your IP: ${res.data.ip}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error || "Failed to fetch your IP or IP is empty",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    } finally {
      setFetchingIp(false);
    }
  };

  const handleRemoveIp = (ip: string) => {
    setWhitelist(whitelist.filter((i) => i !== ip));
  };

  const handleSaveWhitelist = async () => {
    setSavingWhitelist(true);
    try {
      const res = await updateSuperAdminWhitelistAction(whitelist);
      if (res.success) {
        toast({ title: t("whitelist.success") });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error || "Failed to update whitelist",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    } finally {
      setSavingWhitelist(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-indigo-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">
          {t("loading") || "Analyzing platform security..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Link
              href="/super-admin"
              className="hover:underline flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={12} /> {t("backToDashboard")}
            </Link>
          </div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-rose-500 h-10 w-10" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-indigo-500/20">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <ShieldCheck className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300/60 leading-tight">
              {t("status.label")}
            </p>
            <p className="font-black text-sm">{t("status.secured")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column: Security Protocols */}
        <div className="space-y-6">
          {/* Lockdown Protocol Card */}
          <Card className="rounded-3xl border-foreground/5 shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lock className="h-24 w-24 -rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                {t("lockdown.title")}
              </CardTitle>
              <CardDescription>{t("lockdown.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`p-4 rounded-2xl border flex flex-col gap-4 transition-colors ${
                  isLockdown
                    ? "bg-rose-50 border-rose-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full animate-pulse shrink-0 ${
                      isLockdown ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  />
                  <span
                    className={`font-bold text-sm ${
                      isLockdown ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {isLockdown ? t("lockdown.active") : t("lockdown.inactive")}
                  </span>
                </div>
                <Button
                  variant={isLockdown ? "secondary" : "destructive"}
                  size="sm"
                  className="rounded-xl shadow-sm w-full"
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={toggling}
                >
                  {toggling ? (
                    <Activity className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 mr-2" />
                  )}
                  {isLockdown ? t("lockdown.cancel") : t("lockdown.emergency")}
                </Button>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  asChild
                  className="w-full justify-between rounded-xl bg-slate-900 border-none hover:bg-slate-800 h-12"
                >
                  <Link href="/super-admin/audit-logs">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-indigo-400" />
                      <span>{t("accessReport")}</span>
                    </div>
                    <ArrowLeft className="rotate-180 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Indicator Card */}
          <Card className="rounded-3xl border-foreground/5 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                {t("stats.title")}
              </CardTitle>
              <CardDescription>{t("stats.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {t("stats.authAttempts")}
                  </p>
                  <p className="text-2xl font-black">
                    {stats?.authAttempts || 0}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {t("stats.mfaEnforced")}
                  </p>
                  <p className="text-2xl font-black">
                    {stats?.mfaPercentage || 0}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {t("stats.blockedIps")}
                  </p>
                  <p className="text-2xl font-black text-rose-500">
                    {stats?.blockedIps || 0}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {t("stats.threatGrade")}
                  </p>
                  <p className="text-2xl font-black text-indigo-600">
                    {stats?.threatGrade || "A+"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Whitelist and Local Testing */}
        <div className="lg:col-span-2 space-y-6">
          {/* IP Whitelist Card */}
          <Card className="rounded-3xl border-foreground/5 shadow-sm bg-white overflow-hidden relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-indigo-600" />
                {t("whitelist.title")}
              </CardTitle>
              <CardDescription>{t("whitelist.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder={t("whitelist.placeholder")}
                    value={newIp || ""}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleAddIp()}
                  />
                  <Button
                    onClick={handleAddIp}
                    className="rounded-xl shrink-0"
                    disabled={!newIp?.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("whitelist.addButton")}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddYourIp}
                  className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 shrink-0"
                  disabled={fetchingIp}
                >
                  {fetchingIp ? (
                    <Activity className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  {t("whitelist.addYourIp")}
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {whitelist.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-slate-50 rounded-2xl border border-dashed">
                    <p className="text-sm">{t("whitelist.noItems")}</p>
                  </div>
                ) : (
                  whitelist.map((ip) => (
                    <div
                      key={ip}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border group"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-500" />
                        <span className="font-mono text-sm">{ip}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIp(ip)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Button
                className="w-full rounded-2xl shadow-lg bg-slate-900 hover:bg-black group"
                onClick={handleSaveWhitelist}
                disabled={savingWhitelist}
              >
                {savingWhitelist ? (
                  <Activity className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400 group-hover:scale-110 transition-transform" />
                )}
                {t("whitelist.saveButton")}
              </Button>
            </CardContent>
          </Card>

          {/* Developer Toolkit Card */}
          <Card className="rounded-3xl shadow-sm border-indigo-100 bg-indigo-50/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Settings className="h-5 w-5 text-indigo-500" />
                {t("manualConfig.title")}
              </CardTitle>
              <CardDescription className="text-indigo-700/70 font-medium">
                {t("manualConfig.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-white/70 overflow-x-auto shadow-inner">
                <p className="text-emerald-400">
                  # Windows: {t("manualConfig.pathWin")}
                </p>
                <p className="text-emerald-400">
                  # Unix/macOS: {t("manualConfig.pathUnix")}
                </p>
                <p className="mt-2 text-indigo-300">
                  127.0.0.1 platform.localhost
                </p>
                <p className="text-indigo-300">127.0.0.1 customer1.localhost</p>
                <p className="text-indigo-300">
                  127.0.0.1 luxury-store.localhost
                </p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest mb-2">
                  Testing Flow
                </p>
                <ul className="text-xs space-y-2 text-indigo-900/80 font-medium">
                  <li className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">
                      1
                    </div>
                    <span>
                      Set Tenant domain as{" "}
                      <code className="text-indigo-600">t1.localhost</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">
                      2
                    </div>
                    <span>
                      Use &quot;Go to Admin Panel&quot; to jump to domain.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">
                      3
                    </div>
                    <span>Verify data isolation across domains.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              {t("lockdown.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium pt-2">
              {t("lockdown.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200">
              {t("lockdown.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleLockdown}
              className={`rounded-xl ${
                isLockdown
                  ? "bg-slate-900 hover:bg-black"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {t("lockdown.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
