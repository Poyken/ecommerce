'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Ticket,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface PromotionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string;
}

interface PromotionStats {
  promotion: {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    usageLimit: number | null;
    usedCount: number;
    usages: Array<{
      id: string;
      discountAmount: number;
      createdAt: string;
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }>;
  };
  stats: {
    totalUsages: number;
    totalDiscount: number;
    totalOrderAmount: number;
    remainingUsages: number | string;
    averageDiscount: number;
  };
}

export function PromotionStatsModal({
  isOpen,
  onClose,
  promotionId,
}: PromotionStatsModalProps) {
  const [data, setData] = useState<PromotionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && promotionId) {
      fetchStats();
    }
  }, [isOpen, promotionId]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promotions/${promotionId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error('Không thể tải thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Thống kê khuyến mãi
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Promotion Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{data.promotion.name}</h3>
                  {data.promotion.code && (
                    <code className="text-sm bg-primary/10 px-2 py-1 rounded">
                      {data.promotion.code}
                    </code>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(data.promotion.startDate), 'dd/MM/yyyy', {
                    locale: vi,
                  })}{' '}
                  -{' '}
                  {format(new Date(data.promotion.endDate), 'dd/MM/yyyy', {
                    locale: vi,
                  })}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Ticket className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lượt sử dụng</p>
                      <p className="text-2xl font-bold">{data.stats.totalUsages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng giảm</p>
                      <p className="text-2xl font-bold">
                        {data.stats.totalDiscount.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold">
                        {data.stats.totalOrderAmount.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Users className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Còn lại</p>
                      <p className="text-2xl font-bold">
                        {data.stats.remainingUsages}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Efficiency Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Giảm giá trung bình / lượt
                  </p>
                  <p className="text-xl font-semibold">
                    {Math.round(data.stats.averageDiscount).toLocaleString()}đ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    ROI (Doanh thu / Giảm giá)
                  </p>
                  <p className="text-xl font-semibold">
                    {data.stats.totalDiscount > 0
                      ? (
                          data.stats.totalOrderAmount / data.stats.totalDiscount
                        ).toFixed(1)
                      : 0}
                    x
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Usage History */}
            <div>
              <h4 className="font-medium mb-3">Lịch sử sử dụng gần đây</h4>
              {data.promotion.usages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có lượt sử dụng nào
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Số tiền giảm</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.promotion.usages.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {usage.user.firstName} {usage.user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {usage.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">
                              -{Number(usage.discountAmount).toLocaleString()}đ
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(
                              new Date(usage.createdAt),
                              'HH:mm dd/MM/yyyy',
                              { locale: vi }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Không có dữ liệu
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
