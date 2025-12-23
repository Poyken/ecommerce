"use client";

import {
  deleteReviewAction,
  replyToReviewAction,
  updateReviewAction,
} from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { DataTableEmptyRow } from "@/components/atoms/data-table-empty-row";
import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { GlassCard } from "@/components/atoms/glass-card";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { Textarea } from "@/components/atoms/textarea";
import { AdminSearchInput } from "@/components/organisms/admin/admin-search-input";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Eye, EyeOff, MessageSquare, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function ReviewsClient({
  reviews,
  total,
  page,
  limit,
}: {
  reviews: any[];
  total: number;
  page: number;
  limit: number;
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

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/reviews?${params.toString()}` as any);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const togglePublish = (reviewId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await updateReviewAction(reviewId, {
        isPublished: !currentStatus,
      });
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${
              s <= rating ? "fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("reviews.management")}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t("showing", {
              count: reviews.length,
              total,
              item: t("reviews.title").toLowerCase(),
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <AdminSearchInput
          placeholder={t("reviews.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <GlassCard className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{t("name")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("reviews.rating")}</TableHead>
              <TableHead className="max-w-md">{t("reviews.comment")}</TableHead>
              <TableHead>{t("reviews.status")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <DataTableEmptyRow
                colSpan={canUpdate || canDelete ? 7 : 6}
                message={t("reviews.noFound")}
              />
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.user?.firstName} {review.user?.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {review.product?.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {review.sku?.code}
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={review.comment}>
                      {review.comment}
                    </div>
                    {review.reply && (
                      <div className="mt-2 pl-3 border-l-2 border-primary/50 text-sm text-muted-foreground">
                        <span className="font-bold text-xs uppercase text-primary">
                          Admin Reply:
                        </span>{" "}
                        {review.reply}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={review.isPublished ? "PUBLISHED" : "HIDDEN"}
                      label={
                        review.isPublished
                          ? t("reviews.published")
                          : t("reviews.hidden")
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleReply(review.id, review.reply)
                              }
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              title="Reply"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                togglePublish(review.id, review.isPublished)
                              }
                              title={
                                review.isPublished
                                  ? t("reviews.hidden")
                                  : t("reviews.published")
                              }
                            >
                              {review.isPublished ? (
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
                            onClick={() => handleDelete(review.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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

        <DataTablePagination page={page} total={total} limit={limit} />

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
              <DialogTitle>Reply to Review</DialogTitle>
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
      </GlassCard>
    </div>
  );
}
