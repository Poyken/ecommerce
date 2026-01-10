"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AiInsightsWidget } from "@/components/admin/ai-insights-widget";
import { RecentChatsWidget } from "@/features/admin/components/widgets/recent-chats-widget";
import {
  Star,
  MessageSquare,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

interface CustomersTabProps {
  recentReviews: any[];
}

export function CustomersTab({ recentReviews }: CustomersTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Insights - Understanding Customers */}
        <div className="lg:col-span-2 space-y-6">
          <AiInsightsWidget />

          {/* Reviews Section */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  Recent Reviews
                </CardTitle>
                <CardDescription>
                  What customers are saying about your products
                </CardDescription>
              </div>
              <Link href="/admin/reviews">
                <Button variant="ghost" className="text-indigo-600 font-bold">
                  View All <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recentReviews.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    No recent reviews.
                  </div>
                ) : (
                  recentReviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="p-4 flex gap-4 hover:bg-muted/20 transition-colors rounded-lg group"
                    >
                      <div className="shrink-0">
                        <UserAvatar
                          src={review.user?.avatarUrl}
                          alt={`${review.user?.firstName} ${review.user?.lastName}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                            {review.user?.firstName} {review.user?.lastName}
                          </span>
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < review.rating
                                    ? "fill-current"
                                    : "text-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 italic">
                          &quot;{review.content}&quot;
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(review.createdAt), "MZ dd, yyyy")}
                          <span className="text-border">|</span>
                          <span className="truncate max-w-[200px] font-medium text-foreground">
                            {review.product?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Support / Chats */}
        <div className="space-y-6">
          <RecentChatsWidget />

          {/* Simple Customer Stat */}
          <Card className="rounded-2xl bg-indigo-600 text-white shadow-lg border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="text-lg">Growth Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-100 text-sm mb-4">
                Engage with your customers by replying to reviews. Stores that
                reply to reviews see a <strong>12% increase</strong> in repeat
                purchases.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full font-bold text-indigo-700"
              >
                Reply to Reviews
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
