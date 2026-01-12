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
import { ArrowUpRight } from "lucide-react";
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
        <Card className="rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Calculated MRR
            </CardDescription>
            <CardTitle className="text-3xl font-black flex items-baseline gap-2">
              $24,000
              <span className="text-sm font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12.5%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Total Revenue (YTD)
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              ${(stats?.totalRevenue || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Gross Volume processed
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Active Tenants
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {stats?.totalTenants || 142}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Total paying stores
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Churn Rate
            </CardDescription>
            <CardTitle className="text-3xl font-black text-rose-600">
              0.8%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Lower is better (Target: &lt; 1%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>MRR Growth Trajectory</CardTitle>
            <CardDescription>
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

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Churn Trend</CardTitle>
            <CardDescription>Weekly churn rate %</CardDescription>
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
