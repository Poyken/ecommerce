'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  Tag,
  TrendingUp,
  Brain,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SentimentStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

interface TopTag {
  tag: string;
  count: number;
}

interface ReviewSentimentCardProps {
  productId: string;
  className?: string;
}

const TAG_LABELS: Record<string, string> = {
  quality: 'Chất lượng',
  shipping: 'Vận chuyển',
  service: 'Dịch vụ',
  price: 'Giá cả',
  packaging: 'Đóng gói',
  size: 'Kích cỡ',
  color: 'Màu sắc',
  durability: 'Độ bền',
  value: 'Đáng tiền',
  fast_delivery: 'Giao nhanh',
  slow_delivery: 'Giao chậm',
  damaged: 'Hỏng/Vỡ',
  fake: 'Hàng giả',
  recommend: 'Khuyên mua',
  not_recommend: 'Không khuyên',
};

const TAG_COLORS: Record<string, string> = {
  quality: 'bg-blue-500',
  shipping: 'bg-purple-500',
  fast_delivery: 'bg-green-500',
  slow_delivery: 'bg-red-500',
  service: 'bg-orange-500',
  price: 'bg-yellow-500',
  packaging: 'bg-cyan-500',
  recommend: 'bg-green-600',
  not_recommend: 'bg-red-600',
  damaged: 'bg-red-400',
  fake: 'bg-red-700',
};

export function ReviewSentimentCard({
  productId,
  className,
}: ReviewSentimentCardProps) {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentiment();
  }, [productId]);

  const fetchSentiment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reviews/product/${productId}/sentiment`,
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setTopTags(data.data.topTags || []);
      }
    } catch (error) {
      console.error('Failed to fetch sentiment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chưa có đủ dữ liệu phân tích</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Phân tích cảm xúc (AI)
          <Badge variant="outline" className="ml-auto text-xs">
            {stats.total} đánh giá
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Sentiment Bars */}
        <div className="space-y-3">
          {/* Positive */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-24">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm">Tích cực</span>
            </div>
            <div className="flex-1">
              <Progress
                value={stats.positivePercent}
                className="h-2 bg-muted"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right text-green-600">
              {stats.positivePercent}%
            </span>
          </div>

          {/* Neutral */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-24">
              <Minus className="h-4 w-4 text-gray-400" />
              <span className="text-sm">Trung tính</span>
            </div>
            <div className="flex-1">
              <Progress
                value={stats.neutralPercent}
                className="h-2 bg-muted [&>div]:bg-gray-400"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right text-gray-500">
              {stats.neutralPercent}%
            </span>
          </div>

          {/* Negative */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-24">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <span className="text-sm">Tiêu cực</span>
            </div>
            <div className="flex-1">
              <Progress
                value={stats.negativePercent}
                className="h-2 bg-muted [&>div]:bg-red-500"
              />
            </div>
            <span className="text-sm font-medium w-12 text-right text-red-600">
              {stats.negativePercent}%
            </span>
          </div>
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-1 mb-2">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Chủ đề được nhắc đến nhiều
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topTags.slice(0, 6).map((item) => (
                <Badge
                  key={item.tag}
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    TAG_COLORS[item.tag] && 'text-white',
                    TAG_COLORS[item.tag] || 'bg-gray-100',
                  )}
                >
                  {TAG_LABELS[item.tag] || item.tag}
                  <span className="ml-1 opacity-75">({item.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Overall Sentiment Indicator */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Xu hướng chung</span>
            {stats.positivePercent > 60 ? (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Rất tích cực</span>
              </div>
            ) : stats.positivePercent > 40 ? (
              <div className="flex items-center gap-1 text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Khá tốt</span>
              </div>
            ) : stats.negativePercent > 40 ? (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingUp className="h-4 w-4 rotate-180" />
                <span className="text-sm font-medium">Cần cải thiện</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Minus className="h-4 w-4" />
                <span className="text-sm font-medium">Bình thường</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Admin: AI Insights Component
interface ProductInsightsProps {
  productId: string;
  className?: string;
}

export function ProductAiInsights({
  productId,
  className,
}: ProductInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reviews/product/${productId}/insights`,
      );
      if (response.ok) {
        const data = await response.json();
        setInsights(data.data.insights);
      }
    } catch (error) {
      toast.error('Không thể tải phân tích AI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [productId]);

  return (
    <Card className={cn('border-purple-200 bg-purple-50/50', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Đang phân tích...</span>
          </div>
        ) : insights ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insights}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có đủ dữ liệu để phân tích. Cần ít nhất 3 đánh giá.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
