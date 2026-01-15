'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Coins,
  Gift,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoyaltySummary {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  expiringPoints: number;
  expiringDate: string | null;
  pointValue: number;
}

interface PointHistory {
  id: string;
  amount: number;
  type: 'EARNED' | 'REDEEMED' | 'REFUNDED';
  reason: string;
  createdAt: string;
  expiresAt?: string;
}

export function LoyaltyDashboard() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        fetch('/api/loyalty/my-points/summary'),
        fetch('/api/loyalty/my-points/history?limit=10'),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.data);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu điểm thưởng');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không thể tải thông tin điểm thưởng
      </div>
    );
  }

  const redeemProgress =
    summary.totalEarned > 0
      ? ((summary.totalRedeemed / summary.totalEarned) * 100).toFixed(0)
      : 0;

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Số dư điểm hiện tại</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {summary.balance.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground">điểm</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tương đương{' '}
                <span className="font-medium text-green-600">
                  {(summary.balance * summary.pointValue).toLocaleString()}đ
                </span>
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-full">
              <Coins className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Expiring Warning */}
          {summary.expiringPoints > 0 && summary.expiringDate && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">
                <span className="font-medium text-yellow-700">
                  {summary.expiringPoints.toLocaleString()} điểm
                </span>{' '}
                sẽ hết hạn vào{' '}
                {format(new Date(summary.expiringDate), 'dd/MM/yyyy', {
                  locale: vi,
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đã tích</p>
                <p className="text-lg font-bold text-green-600">
                  +{summary.totalEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã sử dụng</p>
                <p className="text-lg font-bold text-red-600">
                  -{summary.totalRedeemed.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ sử dụng</p>
                <p className="text-lg font-bold">{redeemProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Cách tích và sử dụng điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="font-medium">Tích điểm</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Mỗi 10,000đ chi tiêu = 1 điểm
              </p>
              <p className="text-sm text-muted-foreground">
                Điểm được tích sau khi đơn hàng hoàn thành
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Đổi điểm</span>
              </div>
              <p className="text-sm text-muted-foreground">
                1 điểm = {summary.pointValue.toLocaleString()}đ giảm giá
              </p>
              <p className="text-sm text-muted-foreground">
                Tối đa 50% giá trị đơn hàng
              </p>
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Điểm sẽ hết hạn sau 365 ngày kể từ ngày tích lũy
            </p>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử điểm gần đây</CardTitle>
          <CardDescription>10 giao dịch điểm gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Chưa có lịch sử điểm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        item.type === 'EARNED'
                          ? 'bg-green-500/10'
                          : item.type === 'REDEEMED'
                          ? 'bg-red-500/10'
                          : 'bg-blue-500/10'
                      )}
                    >
                      {item.type === 'EARNED' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : item.type === 'REDEEMED' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), 'HH:mm dd/MM/yyyy', {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'font-semibold',
                      item.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {item.amount > 0 ? '+' : ''}
                    {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
