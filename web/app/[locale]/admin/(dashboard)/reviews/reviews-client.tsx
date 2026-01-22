"use client";



import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteReviewAction,
  replyToReviewAction,
  updateReviewStatusAction,
  analyzeReviewSentimentAction,
} from "@/features/admin/actions";
import {
  AdminActionBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/routing";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Eye, EyeOff, MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

// Helper function for sentiment badge
const getSentimentBadge = (sentiment?: string, tags: string[] = []) => {
  if (!sentiment) return null;
  const styles: Record<string, string> = {
    POSITIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    NEGATIVE: "bg-red-100 text-red-800 border-red-200",
    NEUTRAL: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return (
    <div className="flex flex-col gap-1 mt-1">
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border w-fit",
          styles[sentiment] || styles.NEUTRAL
        )}
      >
        {sentiment}
      </span>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground bg-secondary px-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

type FilterType = "all" | "published" | "hidden";

export function ReviewsClient({
  reviews,
  total,
  page,
  limit,
  counts,
  currentStatus = "all",
}: {
  reviews: any[];
  total: number;
  page: number;
  limit: number;
  counts?: { total: number; published: number; hidden: number };
  currentStatus?: string;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Reply State
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const canUpdate = hasPermission("review:update");
  const canDelete = hasPermission("review:delete");

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Server Stats
  const publishedCount = counts?.published || 0;
  const hiddenCount = counts?.hidden || 0;
  const totalCount = counts?.total || total;

  // Avg Rating Calculation (Based on current page only, as approximation)
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "N/A";

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/admin/reviews?${params.toString()}` as any);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const handleStatusChange = (status: FilterType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      params.set("page", "1");
      router.push(`/admin/reviews?${params.toString()}` as any);
    });
  };

  const togglePublish = (reviewId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await updateReviewStatusAction(reviewId, !currentStatus);
      if (result.success) {
        toast({
          title: t("success"),
          description: t("reviews.successUpdate"),
        });
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (reviewId: string) => {
    setDeleteId(reviewId);
    setDeleteDialogOpen(true);
  };

  const handleReply = (reviewId: string, currentReply?: string) => {
    setReplyId(reviewId);
    setReplyText(currentReply || "");
    setReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!replyId || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const result = await replyToReviewAction(replyId, replyText);
      if (result.success) {
        toast({
          title: t("success"),
          description: "Reply sent successfully",
          variant: "success",
        });
        setReplyDialogOpen(false);
        setReplyText("");
        setReplyId(null);
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleAnalyze = async (reviewId: string, content: string) => {
    try {
      const res = await analyzeReviewSentimentAction(content);
      if (res.success) {
        toast({
          title: "AI Analysis Complete",
          description: `Sentiment: ${res.data?.sentiment}`,
          variant: "success",
        });
        // Note: Real implementation should save to DB.
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to analyze",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              "h-4 w-4",
              s <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("reviews.management")}
        subtitle={t("reviews.showingCount", {
          count: reviews.length,
          total: totalCount,
        })}
        icon={<Star className="text-amber-500 fill-amber-500/10" />}
        variant="amber"
        stats={[
          { label: "total", value: totalCount, variant: "slate" },
          { label: "published", value: publishedCount, variant: "success" },
          { label: "hidden", value: hiddenCount, variant: "warning" },
          ...(avgRating !== "N/A"
            ? [
                {
                  label: "avg rating",
                  value: `⭐ ${avgRating}`,
                  variant: "amber" as const,
                },
              ]
            : []),
        ]}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentStatus}
          onValueChange={(v) => handleStatusChange(v as FilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
              disabled={isPending}
            >
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
              disabled={isPending}
            >
              <Eye className="h-4 w-4" />
              Published
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {publishedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="hidden"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-amber-600 transition-all gap-2"
              disabled={isPending}
            >
              <EyeOff className="h-4 w-4" />
              Hidden
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[10px] font-black"
              >
                {hiddenCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder={t("reviews.searchPlaceholder")}
            value={searchTerm}
            onChange={setSearchTerm}
            isLoading={isPending}
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending} >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">{t("reviews.rating")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead className="max-w-[300px]">
                {t("reviews.comment")}
              </TableHead>
              <TableHead>{t("reviews.status")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right w-[120px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 6 : 5}>
                  <AdminEmptyState
                    icon={Star}
                    title={t("reviews.noFound")}
                    description="No reviews found matching your criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow
                  key={review.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {renderStars(review.rating)}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {review.user?.firstName} {review.user?.lastName}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {review.product?.name}
                      </p>
                      <code className="text-xs text-muted-foreground">
                        {review.sku?.skuCode}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm line-clamp-2" title={review.content}>
                      {review.content}
                    </p>
                    {review.reply && (
                      <div className="mt-2 pl-3 border-l-2 border-primary/50">
                        <span className="text-[10px] font-bold uppercase text-primary">
                          Admin Reply:
                        </span>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {review.reply}
                        </p>
                      </div>
                    )}
                    {getSentimentBadge(review.sentiment, review.autoTags)}
                  </TableCell>
                  <TableCell>
                    <AdminActionBadge
                      label={
                        review.isApproved
                          ? t("reviews.published")
                          : t("reviews.hidden")
                      }
                      variant={review.isApproved ? "success" : "warning"}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(review.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                handleReply(review.id, review.reply)
                              }
                              title="Reply"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                togglePublish(review.id, review.isApproved)
                              }
                              title={review.isApproved ? "Hide" : "Publish"}
                            >
                              {review.isApproved ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination with page numbers - only show when needed */}
      {reviews.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      {/* Delete Dialog */}
      {deleteId && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t("reviews.deleteConfirm")}
          description={t("reviews.deleteConfirmDesc", { id: deleteId })}
          action={() => deleteReviewAction(deleteId)}
          successMessage={t("reviews.successDelete")}
        />
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reply to Review
            </DialogTitle>
            <DialogDescription>
              Write a response to this customer review. They will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              disabled={isReplying}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReply}
              disabled={isReplying || !replyText.trim()}
            >
              {isReplying ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
