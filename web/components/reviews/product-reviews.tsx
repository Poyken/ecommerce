"use client";

import {
  checkReviewEligibilityAction,
  getReviewsAction,
} from "@/actions/review";
import { ReviewFormDialog } from "@/components/reviews/review-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [purchasedSkus, setPurchasedSkus] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedSkuForReview, setSelectedSkuForReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, eligibilityRes] = await Promise.all([
        getReviewsAction(productId),
        checkReviewEligibilityAction(productId),
      ]);

      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.data);
        setMeta(reviewsRes.data.meta);
      }

      if (eligibilityRes.success && eligibilityRes.data) {
        setPurchasedSkus(eligibilityRes.data.purchasedSkus || []);
      } else if (!eligibilityRes.success) {
        console.error("Eligibility check failed:", eligibilityRes.error);
        setError(`Eligibility check failed: ${eligibilityRes.error}`);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load reviews");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
      </div>

      {/* Purchased Items Section */}
      {purchasedSkus.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            Your Purchased Items
          </h3>
          <div className="space-y-4">
            {purchasedSkus.map((sku) => (
              <div
                key={sku.id}
                className="flex items-center justify-between bg-white p-4 rounded-md shadow-sm"
              >
                <div>
                  <div className="font-medium">
                    {sku.optionValues
                      ?.map((ov: any) => ov.optionValue?.value)
                      .join(" / ") || "Default Variant"}
                  </div>
                  {sku.review ? (
                    <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <span>✓ Reviewed</span>
                      <span className="text-gray-400">•</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= sku.review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">
                      Not reviewed yet
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
                >
                  {sku.review ? "Edit Review" : "Write a Review"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="text-4xl font-bold text-gray-900">
              {meta?.averageRating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex justify-center my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(meta?.averageRating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">
              Based on {meta?.totalReviews || 0} reviews
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="md:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.user.firstName?.[0]}
                        {review.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {review.user.firstName} {review.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.sku && (
                  <div className="mt-2 text-xs text-gray-500">
                    Purchased:{" "}
                    {review.sku.optionValues
                      ?.map((ov: any) => ov.optionValue?.value)
                      .join(" / ")}
                  </div>
                )}

                <div className="mt-3 text-gray-700">{review.content}</div>
              </div>
            ))
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
          // Optionally refresh page data if needed
        }}
      />
    </div>
  );
}
