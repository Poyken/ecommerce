"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatVND } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/**
 * =====================================================================
 * ADMIN CHARTS - Hệ thống biểu đồ thống kê quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RECHARTS LIB (Thư viện biểu đồ):
 * - Đây là thư viện vẽ chart phổ biến nhất cho React.
 * - Nó dùng cơ chế "Declarative" (Khai báo): Ta xếp các component `<BarChart>`, `<XAxis>`, `<Tooltip>` lồng nhau thay vì vẽ canvas thủ công.
 *
 * 2. RESPONSIVE DESIGN:
 * - Luôn bọc Chart trong `<ResponsiveContainer>`.
 * - Nó giúp chart tự động co giãn (`width="100%"`) theo kích thước màn hình cha -> Quan trọng cho Dashboard Dashboard responsive.
 *
 * 3. DATA FORMATTING (Định dạng số liệu):
 * - Trục Y và Tooltip dùng `Intl.NumberFormat` để format tiền tệ (VND).
 * - `notation: "compact"`: Biến số 1.500.000 thành "1.5Tr" -> Giúp biểu đồ thoáng và dễ đọc hơn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export interface SalesTrendData {
  name: string;
  sales: number;
}

export function SalesTrendChart({ data }: { data: SalesTrendData[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-4xl border-foreground/5 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {t("salesTrends")}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="font-medium"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatVND(value || 0, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                })
              }
              className="font-medium"
            />
            <Tooltip
              formatter={(value: any) => formatCurrency(Number(value) || 0)}
              contentStyle={{
                borderRadius: "1rem",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export interface BestSellerData {
  name: string;
  sales: number;
}

export function BestSellersChart({ data }: { data: BestSellerData[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-4xl border-foreground/5 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {t("bestSellers")}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="colorBestSellers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={1}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.6}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--muted-foreground) / 0.1)"
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="font-medium"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="font-medium"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              formatter={(value) => [`${value ?? 0} sold`, "Quantity"]}
              labelFormatter={(label) => `Product: ${label}`}
              contentStyle={{
                borderRadius: "1rem",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Bar
              dataKey="sales"
              fill="url(#colorBestSellers)"
              radius={[8, 8, 8, 8]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export interface OrderStatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: any; // Recharts compatibility
}

export function OrderStatusChart({ data }: { data: OrderStatusData[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-4xl border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">
          {t("orderStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "1rem",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                fontWeight: 600,
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
