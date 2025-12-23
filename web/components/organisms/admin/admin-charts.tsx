"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
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
} from "recharts";

/**
 * =====================================================================
 * ADMIN CHARTS - Hệ thống biểu đồ thống kê quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RECHARTS LIBRARY:
 * - Sử dụng thư viện Recharts để vẽ biểu đồ dạng Declarative (khai báo).
 * - `ResponsiveContainer`: Đảm bảo biểu đồ tự động co giãn theo kích thước của thẻ cha.
 *
 * 2. DATA FORMATTING:
 * - Sử dụng `Intl.NumberFormat` để định dạng tiền tệ (VND) trực tiếp trên trục Y và Tooltip.
 * - `notation: "compact"` giúp rút gọn các con số lớn (VD: 1.000.000 -> 1Tr) để biểu đồ trông gọn gàng hơn.
 *
 * 3. CHART TYPES:
 * - `LineChart`: Phù hợp để theo dõi xu hướng (Sales Trends) theo thời gian.
 * - `BarChart`: Phù hợp để so sánh các hạng mục (Best Sellers).
 * - `PieChart`: Phù hợp để hiển thị tỷ lệ phần trăm (Order Status).
 * =====================================================================
 */

export function SalesTrendChart({ data }: { data: any[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-[2rem] border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">{t("salesTrends")}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
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
                formatCurrency(value, { notation: "compact", maximumFractionDigits: 1 })
              }
              className="font-medium"
            />
            <Tooltip
              formatter={(value: any) =>
                formatCurrency(value)
              }
              contentStyle={{ 
                borderRadius: "1rem", 
                border: "1px solid hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--background))"
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function BestSellersChart({ data }: { data: any[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-[2rem] border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">{t("bestSellers")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
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
              className="font-medium"
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--foreground) / 0.05)" }}
              contentStyle={{ 
                borderRadius: "1rem",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--background))"
              }}
            />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function OrderStatusChart({ data }: { data: any[] }) {
  const t = useTranslations("admin");
  return (
    <Card className="h-full rounded-[2rem] border-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight">{t("orderStatus")}</CardTitle>
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
                fontWeight: 600
              }}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: "12px",
                fontWeight: 600
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
