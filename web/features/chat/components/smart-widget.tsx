"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
} from "lucide-react";
import { memo, useMemo } from "react";
import { formatVND, formatNumber } from "@/lib/utils";
import Image from "next/image";
import type {
  UISchemaType,
  UISchema,
  StatCardData,
  TableWidgetData,
  ChartWidgetData,
  AlertWidgetData,
  ListWidgetData,
  TableColumn,
  AlertItem,
} from "@/types/feature-types/chat.types";




// Re-export types for backward compatibility
export type { UISchemaType, UISchema } from "@/types/feature-types/chat.types";

interface SmartWidgetProps {
  schema: UISchema;
}

/**
 * SmartWidget - Component chính render UI theo schema.
 * Sử dụng memo để tránh re-render khi parent component thay đổi.
 */
export const SmartWidget = memo(function SmartWidget({ schema }: SmartWidgetProps) {
  // Memoize việc chọn widget component
  const WidgetComponent = useMemo(() => {
    switch (schema.type) {
      case "stat_card":
        return StatCardWidget;
      case "table":
        return TableWidget;
      case "bar_chart":
        return BarChartWidget;
      case "line_chart":
        return LineChartWidget;
      case "pie_chart":
        return PieChartWidget;
      case "alert":
        return AlertWidget;
      case "list":
        return ListWidget;
      default:
        return UnknownWidget;
    }
  }, [schema.type]);

  return <WidgetComponent schema={schema} />;
});

// Fallback component cho unknown widget types
const UnknownWidget = memo(function UnknownWidget() {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-muted-foreground">Unknown widget type</p>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// WIDGET COMPONENTS
// =============================================================================

const StatCardWidget = memo(function StatCardWidget({ schema }: { schema: UISchema }) {
  const { value, trend, trendUp } = schema.data as StatCardData;
  
  // Memoize formatted value để tránh recalculate
  const formattedValue = useMemo(
    () => (typeof value === "number" ? formatVND(value) : value),
    [value]
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {schema.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formattedValue}</span>
          {trend && (
            <Badge
              variant="secondary"
              className={
                trendUp
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {trendUp ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const TableWidget = memo(function TableWidget({ schema }: { schema: UISchema }) {
  const { columns, rows } = schema.data as TableWidgetData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns?.map((col: { key: string; label: string }) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows?.map((row, i: number) => (
              <TableRow key={i}>
                {columns?.map((col: TableColumn) => (
                  <TableCell key={col.key}>
                    {col.key === "image" && row[col.key] ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <Image
                          src={row[col.key] as string}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : col.key === "price" ? (
                      formatVND(row[col.key] as number)
                    ) : (
                      String(row[col.key] ?? "")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

const BarChartWidget = memo(function BarChartWidget({ schema }: { schema: UISchema }) {
  const { labels, values } = schema.data as ChartWidgetData;
  const maxValue = Math.max(...(values || [1]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <CardTitle>{schema.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {labels?.map((label: string, i: number) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">
                  {formatNumber(values[i])}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(values[i] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const LineChartWidget = memo(function LineChartWidget({ schema }: { schema: UISchema }) {
  const { labels, values } = schema.data as ChartWidgetData;
  const maxValue = Math.max(...(values || [1]));
  const minValue = Math.min(...(values || [0]));
  const range = maxValue - minValue || 1;

  // Simple line chart using SVG
  const points =
    values
      ?.map((v: number, i: number) => {
        const x = (i / (values.length - 1 || 1)) * 100;
        const y = 100 - ((v - minValue) / range) * 80 - 10;
        return `${x},${y}`;
      })
      .join(" ") || "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-emerald-500" />
          <CardTitle>{schema.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-40">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <polyline
              points={points}
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {values?.map((v: number, i: number) => {
              const x = (i / (values.length - 1 || 1)) * 100;
              const y = 100 - ((v - minValue) / range) * 80 - 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="rgb(16, 185, 129)"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {labels?.map((label: string, i: number) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const PieChartWidget = memo(function PieChartWidget({ schema }: { schema: UISchema }) {
  const { labels, values } = schema.data as ChartWidgetData;
  const total = values?.reduce((a: number, b: number) => a + b, 0) || 1;
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-violet-500" />
          <CardTitle>{schema.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Simple pie representation */}
          <div className="relative w-32 h-32">
            <div className="w-full h-full rounded-full bg-linear-to-br from-blue-500 via-emerald-500 to-amber-500" />
            <div className="absolute inset-4 rounded-full bg-white dark:bg-slate-900" />
          </div>
          {/* Legend */}
          <div className="space-y-2">
            {labels?.map((label: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className={`w-3 h-3 rounded-full ${
                    colors[i % colors.length]
                  }`}
                />
                <span>{label}</span>
                <span className="text-muted-foreground">
                  ({((values[i] / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const AlertWidget = memo(function AlertWidget({ schema }: { schema: UISchema }) {
  const { level, message, items } = schema.data as AlertWidgetData;

  const levelStyles = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <Card
      className={`border-2 ${
        levelStyles[level as keyof typeof levelStyles] || levelStyles.info
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle className="text-base">{schema.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3">{message}</p>
        {items && items.length > 0 && (
          <ul className="space-y-1 text-sm">
            {items.map((item: AlertItem, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{item.product || item.name}</span>
                <Badge variant="outline">Còn {item.stock}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});

const ListWidget = memo(function ListWidget({ schema }: { schema: UISchema }) {
  const { items } = schema.data as ListWidgetData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items?.map((item: string, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
