'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, X, Check, Loader2, Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { promotionsApi } from '@/features/promotions/promotions.api';

interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  code: string;
  discountAmount: number;
  freeShipping: boolean;
  giftSkuIds: string[];
}

interface CouponInputProps {
  totalAmount: number;
  appliedPromotion: AppliedPromotion | null;
  onApply: (promotion: AppliedPromotion) => void;
  onRemove: () => void;
  className?: string;
}

export function CouponInput({
  totalAmount,
  appliedPromotion,
  onApply,
  onRemove,
  className,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedCode = code.trim().toUpperCase();
      const result = await promotionsApi.validate(normalizedCode, totalAmount);

      // Apply successful
      onApply({
        promotionId: result.promotionId,
        promotionName: result.promotionName,
        code: normalizedCode,
        discountAmount: result.discountAmount,
        freeShipping: result.freeShipping,
        giftSkuIds: result.giftSkuIds,
      });

      toast.success('Áp dụng mã khuyến mãi thành công!');
      setCode('');
    } catch (err: any) {
      const errorMessage = err.message || 'Mã không hợp lệ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    toast.success('Đã xóa mã khuyến mãi');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Applied Promotion Display */}
      {appliedPromotion ? (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-700">
                      {appliedPromotion.promotionName}
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {appliedPromotion.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-green-600">
                      Giảm {appliedPromotion.discountAmount.toLocaleString()}đ
                    </span>
                    {appliedPromotion.freeShipping && (
                      <Badge className="bg-blue-500 text-xs">Free Ship</Badge>
                    )}
                    {appliedPromotion.giftSkuIds.length > 0 && (
                      <Badge className="bg-purple-500 text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        Có quà
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Input Form */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Nhập mã khuyến mãi"
                className={cn(
                  'pl-9 uppercase',
                  error && 'border-destructive focus-visible:ring-destructive'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={isLoading || !code.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Áp dụng'
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Alternative: Expandable coupon section
interface CouponSectionProps extends CouponInputProps {
  availablePromotions?: Array<{
    id: string;
    name: string;
    code: string;
    description?: string;
  }>;
}

export function CouponSection({
  totalAmount,
  appliedPromotion,
  onApply,
  onRemove,
  availablePromotions = [],
  className,
}: CouponSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle Button */}
      {!appliedPromotion && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Sparkles className="h-4 w-4" />
          {isExpanded ? 'Ẩn' : 'Bạn có mã khuyến mãi?'}
        </button>
      )}

      {/* Coupon Input */}
      {(isExpanded || appliedPromotion) && (
        <CouponInput
          totalAmount={totalAmount}
          appliedPromotion={appliedPromotion}
          onApply={onApply}
          onRemove={onRemove}
        />
      )}

      {/* Available Promotions */}
      {isExpanded && !appliedPromotion && availablePromotions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Mã có thể áp dụng:</p>
          <div className="grid gap-2">
            {availablePromotions.map((promo) => (
              <Card
                key={promo.id}
                className="hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => {
                  // Auto-fill the code
                  const input = document.querySelector(
                    'input[placeholder="Nhập mã khuyến mãi"]'
                  ) as HTMLInputElement;
                  if (input) {
                    input.value = promo.code;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-0.5 bg-primary/10 rounded text-sm font-mono">
                          {promo.code}
                        </code>
                        <span className="text-sm font-medium">{promo.name}</span>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {promo.description}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Áp dụng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
