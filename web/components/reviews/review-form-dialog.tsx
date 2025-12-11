"use client";

import {
  createReviewAction,
  deleteReviewAction,
  updateReviewAction,
} from "@/actions/review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10, "Review must be at least 10 characters"),
});

interface ReviewFormDialogProps {
  productId: string;
  sku: any; // The selected SKU to review (contains review data if exists)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReviewFormDialog({
  productId,
  sku,
  open,
  onOpenChange,
  onSuccess,
}: ReviewFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 5,
      content: "",
    },
  });

  // Reset/Pre-fill form when dialog opens or SKU changes
  useEffect(() => {
    if (open && sku) {
      if (sku.review) {
        form.reset({
          rating: sku.review.rating,
          content: sku.review.content,
        });
      } else {
        form.reset({
          rating: 5,
          content: "",
        });
      }
    }
  }, [open, sku, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!sku) return;

    setLoading(true);
    let result;

    if (sku.review) {
      // Update existing review
      result = await updateReviewAction(sku.review.id, {
        rating: values.rating,
        content: values.content,
      });
    } else {
      // Create new review
      result = await createReviewAction({
        productId,
        skuId: sku.id,
        rating: values.rating,
        content: values.content,
      });
    }

    setLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: sku.review
          ? "Your review has been updated"
          : "Your review has been submitted",
      });
      onOpenChange(false);
      onSuccess();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sku?.review ? "Edit Review" : "Write a Review"}
          </DialogTitle>
          <DialogDescription>
            {sku?.optionValues
              ?.map((ov: any) => ov.optionValue?.value)
              .join(" / ") || "Product Variant"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 cursor-pointer ${
                          star <= field.value
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        onClick={() => field.onChange(star)}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what you liked or disliked..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between sm:justify-between">
              {sku?.review && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    const result = await deleteReviewAction(sku.review.id);
                    setLoading(false);
                    if (result.success) {
                      toast({
                        title: "Success",
                        description: "Review deleted successfully",
                      });
                      onOpenChange(false);
                      onSuccess();
                    } else {
                      toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
