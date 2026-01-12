// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// PLAN DIALOG COMPONENT - FORM THÊM/SỬA GÓI DỊCH VỤ
// =================================================================================================
//
// Component này sử dụng Radix UI Dialog kết hợp với React Hook Form để quản lý việc nhập liệu.
//
// CHI TIẾT KỸ THUẬT:
// 1. Zod Validation (`planSchema`):
//    - Xác thực kỹ càng các field như `slug` (chỉ cho phép ký tự thường và gạch nối).
//    - `min(-1)` cho `maxProducts` để biểu thị giá trị "Vô hạn" (Unlimited).
//
// 2. Controlled vs Uncontrolled Dialog:
//    - Component hỗ trợ cả 2 chế độ mở Dialog:
//      a) Nội bộ (Internal State): Tự quản lý `open` state.
//      b) Điều khiển từ ngoài (Controlled State): Nhận `open` và `onOpenChange` từ cha.
//    - Điều này giúp tái sử dụng component dễ dàng cho cả nút "Add New" (tự mở) và nút "Edit" (cha mở).
//
// 3. Form Reset Pattern:
//    - Sử dụng `useEffect` để reset form values mỗi khi `planToEdit` thay đổi.
//    - Đảm bảo form luôn sạch sẽ hoặc chứa đúng dữ liệu cần sửa khi mở ra.
// =================================================================================================
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  createPlanAction,
  updatePlanAction,
} from "@/features/super-admin/domain-actions/plans-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0),
  maxProducts: z.coerce.number().min(-1),
  maxStorage: z.coerce.number().min(0, "Storage must be positive (MB)"),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  planToEdit?: any; // Replace with proper type later
}

export function PlanDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  planToEdit,
}: PlanDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 100,
      maxStorage: 1024,
      isActive: true,
      isPublic: true,
    },
  });

  useEffect(() => {
    if (planToEdit) {
      form.reset({
        name: planToEdit.name,
        slug: planToEdit.slug,
        description: planToEdit.description || "",
        priceMonthly: Number(planToEdit.priceMonthly),
        priceYearly: Number(planToEdit.priceYearly),
        maxProducts: planToEdit.maxProducts,
        maxStorage: planToEdit.maxStorage,
        isActive: planToEdit.isActive,
        isPublic: planToEdit.isPublic,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        priceMonthly: 0,
        priceYearly: 0,
        maxProducts: 100,
        maxStorage: 1024,
        isActive: true,
        isPublic: true,
      });
    }
  }, [planToEdit, isOpen, form]);

  const onSubmit = async (data: PlanFormValues) => {
    try {
      let res;
      if (planToEdit) {
        res = await updatePlanAction({ id: planToEdit.id, data });
      } else {
        res = await createPlanAction(data);
      }

      if (res?.data) {
        toast({
          variant: "success",
          title: "Success",
          description: planToEdit
            ? "Plan updated successfully"
            : "Plan created successfully",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: res?.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {planToEdit ? "Edit Plan" : "Create New Plan"}
          </DialogTitle>
          <DialogDescription>
            Configure subscription plan details, pricing and limits.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pro Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (Code)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. pro-plan"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.toLowerCase().replace(/\s+/g, "-")
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Plan details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxProducts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Products</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Set -1 for unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStorage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Limit (MB)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Available for new subscriptions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public</FormLabel>
                      <FormDescription>Shown on pricing page</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
