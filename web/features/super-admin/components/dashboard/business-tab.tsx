// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// BUSINESS ANALYTICS TAB - BẢNG ĐIỀU KHIỂN KINH DOANH
// =================================================================================================
//
// Component này vẽ các biểu đồ và hiển thị các chỉ số tài chính vĩ mô cho Super Admin.
//
// THƯ VIỆN ĐỒ HỌA (RECHARTS):
// - Sử dụng `Recharts` để vẽ biểu đồ miền (AreaChart) và biểu đồ cột (BarChart).
// - `ResponsiveContainer` giúp biểu đồ tự co giãn theo kích thước màn hình cha.
//
// CẤU TRÚC UI:
// 1. KPI Cards: 4 thẻ trên cùng hiển thị các con số quan trọng (MRR, Tenant mới, Churn...).
// 2. Charts Section:
//    - MRR Growth: Biểu đồ tăng trưởng doanh thu định kỳ theo tháng.
//    - Churn Rate: Tỉ lệ rời bỏ của khách hàng theo tuần.
//
// LƯU Ý: Hiện tại data đồ thị đang là Mock Data (cứng), cần được thay thế bằng API thật trong tương lai.
// =================================================================================================
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminStatsCard } from "@/features/admin/components/ui/admin-page-components";
import { ArrowUpRight, DollarSign, Users, Store, TrendingDown, TrendingUp } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const mrrData = [
  { name: "Jan", value: 3500 },
  { name: "Feb", value: 4200 },
  { name: "Mar", value: 5100 },
  { name: "Apr", value: 6800 },
  { name: "May", value: 8400 },
  { name: "Jun", value: 9500 },
  { name: "Jul", value: 11200 },
  { name: "Aug", value: 13500 },
  { name: "Sep", value: 15100 },
  { name: "Oct", value: 18200 },
  { name: "Nov", value: 21500 },
  { name: "Dec", value: 24000 },
];

const churnData = [
  { name: "Week 1", churn: 1.2 },
  { name: "Week 2", churn: 0.8 },
  { name: "Week 3", churn: 1.5 },
  { name: "Week 4", churn: 0.5 },
];

export function BusinessTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* High Level KPI *
       * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
       * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).
       */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Calculated MRR"
          value={stats?.mrrFormatted || "$0"}
          description="Monthly Recurring Revenue"
          icon={DollarSign}
          variant="neon"
          trend={stats?.tenantGrowthRate > 0 ? { value: stats.tenantGrowthRate, isPositive: true } : undefined}
        />

        <AdminStatsCard
          title="Revenue (YTD)"
          value={stats?.mrrFormatted || "$0"}
          description="Gross Volume processed"
          icon={TrendingUp}
          variant="info"
        />

        <AdminStatsCard
          title="Active Tenants"
          value={stats?.activeTenants || stats?.totalTenants || 0}
          description="Total active stores"
          icon={Store}
          variant="aurora"
        />

        <AdminStatsCard
          title="Churn Rate"
          value={`${stats?.churnRate || 0}%`}
          description="Target: < 1%"
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-3xl glass-premium border-white/5 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">MRR Growth Trajectory</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/60">
              Revenue growth over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMrr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl glass-premium border-white/5 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <TrendingDown className="h-5 w-5 text-rose-500" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">Churn Trend</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/60">Weekly churn rate %</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="churn" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
