"use client";

import {
  checkReviewEligibilityAction,
  getReviewsAction,
} from "@/actions/review";
import { Button } from "@/components/atoms/button";
import {
  ReviewItem,
  ReviewListSkeleton,
} from "@/components/molecules/review-item";
import { ReviewFormDialog } from "@/components/organisms/review-form-dialog";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * PRODUCT REVIEWS - Danh sách đánh giá sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ELIGIBILITY CHECK (`checkReviewEligibilityAction`):
 * - Không phải ai cũng được đánh giá. Chỉ những user đã mua sản phẩm (đã thanh toán) mới có quyền đánh giá.
 * - Hệ thống check dựa trên `productId` và trả về danh sách các SKU mà user đã mua.
 *
 * 2. REVIEW SUMMARY:
 * - Hiển thị điểm trung bình (`averageRating`) và tổng số đánh giá.
 * - Sử dụng `Math.round` để hiển thị số sao tương ứng.
 *
 * 3. DYNAMIC FETCHING:
 * - Dữ liệu được fetch ở Client (`useEffect`) để đảm bảo tính realtime và không làm chậm quá trình render trang sản phẩm chính.
 *
 * 4. PERFORMANCE OPTIMIZATIONS:
 * - useRef để prevent duplicate fetches in StrictMode
 * - useCallback để stabilize fetchData reference
 * =====================================================================
 */

interface ProductReviewsProps {
  productId: string;
  initialReviews?: any[];
  initialMeta?: any;
  initialPurchasedSkus?: any[];
}

export function ProductReviews({
  productId,
  initialReviews = [],
  initialMeta = null,
  initialPurchasedSkus = [],
}: ProductReviewsProps) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [meta, setMeta] = useState<any>(initialMeta);
  const [purchasedSkus, setPurchasedSkus] =
    useState<any[]>(initialPurchasedSkus);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedSkuForReview, setSelectedSkuForReview] = useState<any>(null);
  const [loading, setLoading] = useState(initialReviews.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(initialReviews.length > 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, eligibilityRes] = await Promise.all([
        getReviewsAction(productId), // Initial fetch (limit 5)
        checkReviewEligibilityAction(productId),
      ]);

      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data);
        setMeta(reviewsRes.meta);
      }

      if (eligibilityRes.success && eligibilityRes.data) {
        setPurchasedSkus(eligibilityRes.data.purchasedSkus || []);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load reviews");
    }
    setLoading(false);
  }, [productId]);

  const loadMore = async () => {
    if (!meta?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getReviewsAction(productId, meta.nextCursor);
      if (res.success && res.data) {
        setReviews((prev) => [...prev, ...res.data]);
        setMeta(res.meta);
      }
    } catch (e) {
      console.error("Failed to load more reviews", e);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, [productId]);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-5 rounded-2xl border border-red-200 dark:border-red-900/30 font-medium">
          {error}
        </div>
      )}

      {/* Purchased Items Section */}
      {purchasedSkus.length > 0 && (
        <div className="bg-primary/5 p-8 rounded-4xl border border-primary/20 shadow-lg shadow-primary/5">
          <h3 className="text-xl font-black mb-6 text-primary tracking-tight uppercase">
            {t("purchasedItems")}
          </h3>
          <div className="space-y-5">
            {purchasedSkus.map((sku) => (
              <div
                key={sku.id}
                className="flex items-center justify-between bg-background p-5 rounded-2xl shadow-sm border border-foreground/5"
              >
                <div>
                  <div className="font-bold text-base">
                    {sku.optionValues
                      ?.map((ov: any) => ov.optionValue?.value)
                      .join(" / ") || "Default Variant"}
                  </div>
                  {sku.review ? (
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-2 font-medium">
                      <span>✓ {t("reviewed")}</span>
                      <span className="text-foreground/20">•</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= sku.review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-foreground/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground/60 mt-2 font-medium">
                      {t("notReviewed")}
                    </div>
                  )}
                </div>
                <Button
                  variant={sku.review ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setSelectedSkuForReview(sku);
                    setShowReviewDialog(true);
                  }}
                  className="font-bold uppercase tracking-wider text-xs"
                >
                  {sku.review ? t("editReview") : t("writeReview")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Summary */}
        <motion.div
          className="md:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-foreground/2 p-8 rounded-4xl text-center border border-foreground/5 shadow-lg">
            <div className="text-5xl font-black text-primary">
              {meta?.averageRating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex justify-center my-4 gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(meta?.averageRating || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-foreground/10"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground/70 font-medium">
              {t("basedOn", { count: meta?.totalReviews || 0 })}
            </div>
          </div>
        </motion.div>

        {/* Reviews List */}
        <div className="md:col-span-2 space-y-8">
          {loading ? (
            <ReviewListSkeleton count={3} />
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/60 font-medium">
              {t("noReviews")}
            </div>
          ) : (
            <>
              {reviews.map((review, index) => (
                <ReviewItem key={review.id} review={review} index={index} />
              ))}

              {/* Load More Button */}
              {meta?.nextCursor && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full md:w-auto"
                  >
                    {loadingMore ? "Loading..." : t("loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ReviewFormDialog
        productId={productId}
        sku={selectedSkuForReview}
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
