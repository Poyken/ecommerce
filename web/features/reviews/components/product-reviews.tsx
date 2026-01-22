"use client";

import {
  ReviewItem,
  ReviewItemProps,
  ReviewListSkeleton,
} from "@/features/reviews/components/review-item";
import { Button } from "@/components/ui/button";
import {
  checkReviewEligibilityAction,
  getReviewsAction,
} from "@/features/reviews/actions";
import { ReviewFormDialog } from "@/features/reviews/components/review-form-dialog";
import { m } from "@/lib/animations";
import { Sku } from "@/types/models";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";



interface ProductReviewsProps {
  productId: string;
  initialReviews?: ReviewItemProps["review"][];
  initialMeta?: {
    totalReviews: number;
    averageRating: number;
    nextCursor?: string;
  } | null;
  initialPurchasedSkus?: PurchasedSku[];
}

interface PurchasedSku extends Sku {
  review?: {
    id: string;
    rating: number;
    content?: string;
    images?: string[];
  };
}

export function ProductReviews({
  productId,
  initialReviews = [],
  initialMeta = null,
  initialPurchasedSkus = [],
}: ProductReviewsProps) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] =
    useState<ReviewItemProps["review"][]>(initialReviews);
  const [meta, setMeta] = useState<{
    totalReviews: number;
    averageRating: number;
    nextCursor?: string;
  } | null>(initialMeta);

  const [purchasedSkus, setPurchasedSkus] =
    useState<PurchasedSku[]>(initialPurchasedSkus);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedSkuForReview, setSelectedSkuForReview] =
    useState<PurchasedSku | null>(null);
  const [loading, setLoading] = useState(initialReviews.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(initialReviews.length > 0);

  const fetchData = useCallback(async () => {
    await Promise.resolve(); // Move state updates to microtask to avoid sync effect render
    setError(null);
    try {
      // Only set loading if not already in initial loading state
      setLoading((prev) => (prev ? prev : true));

      const [reviewsRes, eligibilityRes] = await Promise.all([
        getReviewsAction(productId), // Initial fetch (limit 5)
        checkReviewEligibilityAction(productId),
      ]);

      if (reviewsRes.success && Array.isArray(reviewsRes.data)) {
        setReviews(reviewsRes.data);
        setMeta((reviewsRes.meta as any) || null);
      } else {
        setReviews([]);
      }

      if (eligibilityRes.success && eligibilityRes.data) {
        setPurchasedSkus(
          (eligibilityRes.data.purchasedSkus as unknown as PurchasedSku[]) || []
        );
      }
    } catch {
      setError("Failed to load reviews");
    }
    setLoading(false);
  }, [productId]);

  const loadMore = async () => {
    if (!meta?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getReviewsAction(productId, meta.nextCursor);
      if (res.success && Array.isArray(res.data)) {
        setReviews((prev) => [...prev, ...(res.data as any[])]);
        setMeta((res.meta as any) || null);
      }
    } catch {
      // console.error("Failed to load more reviews", e);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

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
                      ?.map((ov) => ov.optionValue?.value)
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
                              star <= sku.review!.rating
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
        <m.div
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
        </m.div>

        {/* Reviews List */}
        <div className="md:col-span-2 space-y-8">
          {loading ? (
            <ReviewListSkeleton count={3} />
          ) : Array.isArray(reviews) && reviews.length > 0 ? (
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
          ) : (
            <div className="text-center py-12 text-muted-foreground/60 font-medium">
              {t("noReviews")}
            </div>
          )}
        </div>
      </div>

      <ReviewFormDialog
        productId={productId}
        sku={
          selectedSkuForReview as unknown as {
            id: string;
            optionValues?: { optionValue: { value: string } }[];
            review?: {
              id: string;
              rating: number;
              content: string;
              images?: string[];
            };
          }
        }
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
