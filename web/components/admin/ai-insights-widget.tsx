"use client";

/**
 * =====================================================================
 * AI INSIGHTS WIDGET - WIDGET PHÂN TÍCH KINH DOANH BẰNG AI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Widget này hiển thị các insights (gợi ý kinh doanh) được tạo bởi AI
 * trên Admin Dashboard.
 *
 * 1. CHỨC NĂNG:
 *    - Fetch insights từ API /api/v1/insights
 *    - Hiển thị 3 loại: warning (cảnh báo), success (tốt), info (thông tin)
 *    - Có nút Refresh để yêu cầu AI tạo insights mới
 *
 * 2. KIẾN TRÚC:
 *    - fetchInsights(): Lấy insights đã có (cached)
 *    - refreshInsights(): Gọi AI tạo insights mới (POST request)
 *    - Insights được lưu cache ở backend để tiết kiệm API calls
 *
 * 3. UI/UX:
 *    - Header gradient tím (violet-purple) với icon Brain
 *    - Mỗi insight có màu riêng: amber (warning), emerald (success), blue (info)
 *    - Loading spinner khi đang fetch
 *    - Hiển thị thời gian cập nhật cuối
 *
 * 4. VÍ DỤ INSIGHTS:
 *    - "Doanh thu tuần này tăng 15% so với tuần trước" (success)
 *    - "5 sản phẩm sắp hết hàng" (warning)
 *    - "Khách hàng mới tháng này: 120 người" (info)
 * =====================================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Insight {
  type: "warning" | "success" | "info";
  title: string;
  message: string;
  action?: string;
}

interface DailyInsights {
  insights: Insight[];
  summary: string;
  generatedAt: string;
}

async function fetchInsights(): Promise<DailyInsights | null> {
  try {
    const res = await fetch("/api/v1/insights", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) return data.data;
    return null;
  } catch {
    return null;
  }
}

async function refreshInsights(): Promise<DailyInsights | null> {
  try {
    const res = await fetch("/api/v1/insights/refresh", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) return data.data;
    return null;
  } catch {
    return null;
  }
}

export function AiInsightsWidget() {
  const [insights, setInsights] = useState<DailyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights().then((data) => {
      setInsights(data);
      setIsLoading(false);
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await refreshInsights();
    if (data) setInsights(data);
    setIsRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "success":
        return "bg-emerald-50 border-emerald-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-linear-to-r from-violet-500 to-purple-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
            <Badge className="bg-white/20 text-white text-xs">
              Cố vấn kinh doanh
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white hover:bg-white/20"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        {insights?.summary && (
          <p className="text-sm text-white/80 mt-2">{insights.summary}</p>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {!insights ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có insights.</p>
            <Button onClick={handleRefresh} className="mt-4" size="sm">
              Tạo insights
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.insights.map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${getInsightBg(
                  insight.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.message}
                    </p>
                    {insight.action && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          💡 {insight.action}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {insights?.generatedAt && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Cập nhật: {new Date(insights.generatedAt).toLocaleString("vi-VN")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
