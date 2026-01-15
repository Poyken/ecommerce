'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Coins, Info, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoyaltyRedeemProps {
  orderTotal: number;
  maxRedeemPercent?: number; // Default 50%
  onApply: (redemption: { points: number; discountAmount: number }) => void;
  onRemove: () => void;
  appliedRedemption?: { points: number; discountAmount: number } | null;
  className?: string;
}

interface UserLoyalty {
  balance: number;
  pointValue: number;
}

export function LoyaltyRedeem({
  orderTotal,
  maxRedeemPercent = 50,
  onApply,
  onRemove,
  appliedRedemption,
  className,
}: LoyaltyRedeemProps) {
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetchLoyalty();
  }, []);

  const fetchLoyalty = async () => {
    try {
      const response = await fetch('/api/loyalty/my-points/summary');
      if (response.ok) {
        const data = await response.json();
        setLoyalty({
          balance: data.balance,
          pointValue: data.pointValue,
        });
      }
    } catch (error) {
      console.error('Failed to fetch loyalty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !loyalty) {
    return null;
  }

  if (loyalty.balance <= 0) {
    return null; // Không hiển thị nếu không có điểm
  }

  const maxDiscountValue = (orderTotal * maxRedeemPercent) / 100;
  const maxPointsCanUse = Math.min(
    loyalty.balance,
    Math.floor(maxDiscountValue / loyalty.pointValue)
  );
  const discountValue = pointsToRedeem * loyalty.pointValue;

  const handleApply = async () => {
    if (pointsToRedeem <= 0) {
      toast.error('Vui lòng chọn số điểm muốn đổi');
      return;
    }

    setIsApplying(true);
    try {
      // Trong thực tế, có thể gọi API validate trước
      onApply({
        points: pointsToRedeem,
        discountAmount: discountValue,
      });
      toast.success(`Đã áp dụng ${pointsToRedeem} điểm`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = () => {
    setPointsToRedeem(0);
    onRemove();
    toast.success('Đã hủy đổi điểm');
  };

  // Already applied
  if (appliedRedemption) {
    return (
      <Card className={cn('border-green-500/50 bg-green-500/5', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">
                  Đã đổi {appliedRedemption.points} điểm
                </p>
                <p className="text-sm text-green-600">
                  Giảm {appliedRedemption.discountAmount.toLocaleString()}đ
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-medium">Đổi điểm thưởng</span>
          </div>
          <Badge variant="outline" className="bg-primary/5">
            Bạn có {loyalty.balance.toLocaleString()} điểm
          </Badge>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Số điểm muốn dùng</span>
            <span className="font-medium">{pointsToRedeem} điểm</span>
          </div>
          <Slider
            value={[pointsToRedeem]}
            onValueChange={(values: number[]) => setPointsToRedeem(values[0])}
            max={maxPointsCanUse}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{maxPointsCanUse} (tối đa)</span>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex gap-2">
          {[25, 50, 75, 100].map((percent) => {
            const points = Math.floor((maxPointsCanUse * percent) / 100);
            if (points <= 0) return null;
            return (
              <Button
                key={percent}
                type="button"
                variant={pointsToRedeem === points ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPointsToRedeem(points)}
                className="flex-1"
              >
                {percent}%
              </Button>
            );
          })}
        </div>

        {/* Preview */}
        {pointsToRedeem > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Giảm giá</span>
            <span className="font-semibold text-green-600">
              -{discountValue.toLocaleString()}đ
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            1 điểm = {loyalty.pointValue.toLocaleString()}đ. Tối đa{' '}
            {maxRedeemPercent}% giá trị đơn hàng.
          </span>
        </div>

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={pointsToRedeem <= 0 || isApplying}
          className="w-full"
        >
          {isApplying ? (
            'Đang xử lý...'
          ) : (
            <>
              Đổi {pointsToRedeem} điểm, giảm {discountValue.toLocaleString()}đ
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
