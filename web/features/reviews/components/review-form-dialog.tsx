"use client";

import { ImageUpload } from "@/components/shared/image-upload";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  createReviewAction,
  deleteReviewAction,
  updateReviewAction,
} from "@/features/reviews/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";



interface ReviewFormDialogProps {
  productId: string;
  sku: {
    id: string;
    optionValues?: { optionValue: { value: string } }[];
    review?: {
      id: string;
      rating: number;
      content: string;
      images?: string[];
    };
  };
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
  const t = useTranslations("reviews");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sku?.review ? t("form.edit") : t("form.write")}
          </DialogTitle>
          <DialogDescription>
            {sku?.optionValues
              ?.map(
                (ov: { optionValue: { value: string } }) =>
                  ov.optionValue?.value
              )
              .join(" / ") || "Product Variant"}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          productId={productId}
          sku={sku}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  productId,
  sku,
  onOpenChange,
  onSuccess,
}: {
  productId: string;
  sku: {
    id: string;
    optionValues?: { optionValue: { value: string } }[];
    review?: {
      id: string;
      rating: number;
      content: string;
      images?: string[];
    };
  };
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // ... onSubmit logic
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!sku) return;

    setLoading(true);

    // let imageUrls: string[] = []; // If we remove formData logic completely?
    // Actually, just remove the unused formData = new FormData() line.

    let imageUrls: string[] = [];
    if (files.length > 0) {
      // const formData = new FormData(); // REMOVED

      try {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const uploadedUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file))
        );
        imageUrls = uploadedUrls;
      } catch (e) {
        console.error("Upload failed", e);
        toast({
          title: tCommon("toast.error"),
          description: "Upload failed: " + (e as Error).message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    let result: { success?: boolean; error?: string };
    if (sku.review) {
      result = await updateReviewAction({
        reviewId: sku.review.id,
        rating: values.rating,
        content: values.content,
        images: imageUrls.length > 0 ? imageUrls : sku.review.images,
      });
    } else {
      result = await createReviewAction({
        productId,
        skuId: sku.id,
        rating: values.rating,
        content: values.content,
        images: imageUrls,
      });
    }

    setLoading(false);
    if (result.success === true) {
      toast({
        variant: "success",
        title: tCommon("toast.success"),
        description: sku.review
          ? t("form.editSuccess")
          : t("form.createSuccess"),
      });
      onOpenChange(false);
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: tCommon("toast.error"),
        description: result.error || t("form.error"),
      });
    }
  };

  const formSchema = z.object({
    rating: z.number().min(1).max(5),
    content: z.string().min(10, t("form.atLeast10")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: sku?.review?.rating || 5,
      content: sku?.review?.content || "",
    },
  });

  // Re-initialize form when sku changes (if the dialog stays open but sku changes)
  useEffect(() => {
    if (sku) {
      form.reset({
        rating: sku.review?.rating || 5,
        content: sku.review?.content || "",
      });
    }
  }, [sku, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base font-semibold">
                {t("form.rating")}
              </FormLabel>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      star <= field.value
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
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
              <FormLabel className="text-base font-semibold">
                {t("form.review")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form.placeholder")}
                  className="min-h-[120px] resize-none text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel className="text-base font-semibold block">
            {t("form.images")}
          </FormLabel>

          <div className="grid grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square border rounded-lg overflow-hidden group"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {files.length < 5 && (
              <div className="relative aspect-square">
                <ImageUpload
                  value=""
                  onChange={(f) => {
                    if (f) setFiles((prev) => [...prev, f]);
                  }}
                  onRemove={() => {}}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {files.length}/5 images. PNG, JPG, WEBP up to 5MB.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between pt-4 border-t">
          {sku?.review && (
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                if (!sku.review) return;
                const result = await deleteReviewAction({
                  reviewId: sku.review.id,
                });
                setLoading(false);
                if (result.success) {
                  toast({
                    variant: "success",
                    title: tCommon("toast.success"),
                    description: t("form.deleteSuccess"),
                  });
                  onOpenChange(false);
                  onSuccess();
                } else {
                  toast({
                    title: tCommon("toast.error"),
                    description: result.error,
                    variant: "destructive",
                  });
                }
              }}
            >
              {tCommon("delete")}
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                (sku?.review
                  ? !(form.formState.isDirty || files.length > 0)
                  : !form.watch("content") || form.watch("content").length < 10)
              }
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("form.submitting")}
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
