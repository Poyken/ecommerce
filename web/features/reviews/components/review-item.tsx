

"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { m } from "@/lib/animations";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

// =====================================================================
// TYPES
// =====================================================================

interface ReviewUser {
  firstName?: string;
  lastName?: string;
}

interface ReviewSku {
  optionValues?: Array<{
    optionValue?: {
      value: string;
    };
  }>;
}

interface Review {
  id: string;
  rating: number;
  content?: string | null;
  createdAt: string | Date;
  user?: ReviewUser;
  sku?: ReviewSku | null;
}

export interface ReviewItemProps {
  review: Review;
  index?: number;
  showAnimation?: boolean;
}

// =====================================================================
// SKELETON COMPONENT
// =====================================================================

export function ReviewItemSkeleton() {
  return (
    <div className="border-b border-foreground/5 pb-8 last:border-0 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar Skeleton */}
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            {/* Name Skeleton */}
            <Skeleton className="h-4 w-28 rounded" />
            {/* Date Skeleton */}
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
        {/* Stars Skeleton */}
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-5 h-5 rounded" />
          ))}
        </div>
      </div>

      {/* SKU info Skeleton */}
      <Skeleton className="h-3 w-32 mt-3 rounded" />

      {/* Content Skeleton */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-4 w-3/5 rounded" />
      </div>
    </div>
  );
}

// =====================================================================
// REVIEW ITEM COMPONENT (MEMOIZED)
// =====================================================================

export const ReviewItem = memo(function ReviewItem({
  review,
  index = 0,
  showAnimation = true,
}: ReviewItemProps) {
  const t = useTranslations("reviews");

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>
              {review.user?.firstName?.[0] || "U"}
              {review.user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-black text-base">
              {review.user
                ? `${review.user.firstName} ${review.user.lastName}`
                : "Verified User"}
            </div>
            <div className="text-xs text-muted-foreground/60 font-medium mt-0.5">
              {format(new Date(review.createdAt), "dd/MM/yyyy")}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-foreground/10"
              }`}
            />
          ))}
        </div>
      </div>

      {review.sku && (
        <div className="mt-3 text-xs text-muted-foreground/60 font-medium">
          {t("purchased")}:{" "}
          {review.sku.optionValues
            ?.map((ov) => ov.optionValue?.value)
            .join(" / ")}
        </div>
      )}

      <div className="mt-4 text-foreground/80 leading-relaxed">
        {review.content}
      </div>
    </>
  );

  if (showAnimation) {
    return (
      <m.div
        className="border-b border-foreground/5 pb-8 last:border-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
      >
        {content}
      </m.div>
    );
  }

  return (
    <div className="border-b border-foreground/5 pb-8 last:border-0">
      {content}
    </div>
  );
});

// =====================================================================
// REVIEW LIST SKELETON (Multiple items)
// =====================================================================

export function ReviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {[...Array(count)].map((_, i) => (
        <ReviewItemSkeleton key={i} />
      ))}
    </div>
  );
}
