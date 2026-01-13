"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReturnRequestSchema } from "@/lib/schemas";
import { Order } from "@/types/models";
import { createReturnRequestAction } from "@/features/returns/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// UI Components
import { GlassCard } from "@/components/shared/glass-card";
import { GlassButton } from "@/components/shared/glass-button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { AlertCircle, Package, Truck, Wallet, Hash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { m } from "@/lib/animations";

/**
 * =====================================================================
 * RETURN REQUEST FORM - Form tạo yêu cầu trả hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPLEX FORM STATE:
 * - Sử dụng `react-hook-form` để quản lý trạng thái form phức tạp: chọn sản phẩm, lý do, phương thức hoàn tiền.
 * - `zodResolver` đảm bảo dữ liệu gửi lên server luôn match với schema (P1 security).
 *
 * 2. CONDITIONAL UI:
 * - Hiển thị các trường thông tin ngân hàng CHỈ KHI chọn phương thức "Chuyển khoản".
 * - Hiển thị phương thức vận chuyển trả hàng CHỈ KHI loại yêu cầu không phải là "Chỉ hoàn tiền".
 *
 * 3. ITEM SELECTION LOGIC:
 * - Cho phép chọn một hoặc nhiều sản phẩm trong đơn hàng để trả.
 * - Mặc định số lượng trả là số lượng tối đa đã mua.
 * =====================================================================
 */

interface ReturnRequestFormProps {
  order: Order;
}

export function ReturnRequestForm({ order }: ReturnRequestFormProps) {
  const t = useTranslations("returns");
  const tOrders = useTranslations("orders");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(ReturnRequestSchema),
    defaultValues: {
      orderId: order.id,
      type: "RETURN_AND_REFUND" as const,
      reason: "",
      description: "",
      items: [] as { orderItemId: string; quantity: number }[],
      returnMethod: "SELF_SHIP" as const,
      refundMethod: "ORIGINAL_PAYMENT" as const,
      bankAccount: {
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      },
    }
  });

  const selectedType = form.watch("type");
  const selectedRefundMethod = form.watch("refundMethod");
  const selectedItems = form.watch("items");

  const onSubmit = (data: any) => {
    // Flatten bankAccount if not needed
    const submissionData = { ...data };
    if (submissionData.refundMethod !== 'BANK_TRANSFER') {
      delete submissionData.bankAccount;
    }
    
    startTransition(async () => {
      const res = await createReturnRequestAction(submissionData);
      if (res.success) {
        toast({
          variant: "success",
          title: "Request submitted",
          description: "Your return request has been submitted successfully.",
        });
        router.push("/profile"); 
      } else {
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: res.error || "An error occurred while submitting your request.",
        });
      }
    });
  };

  const handleItemToggle = (orderItemId: string, maxQty: number) => {
    const currentItems = [...selectedItems];
    const index = currentItems.findIndex((item: any) => item.orderItemId === orderItemId);

    if (index > -1) {
      currentItems.splice(index, 1);
    } else {
      currentItems.push({ orderItemId, quantity: maxQty });
    }
    form.setValue("items", currentItems, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Item Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold">1. Select Items to {selectedType === 'REFUND_ONLY' ? 'Refund' : 'Return'}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.items?.map((item: any) => {
              const isSelected = selectedItems.some((i: any) => i.orderItemId === item.id);
              return (
                <GlassCard 
                  key={item.id} 
                  className={`p-4 transition-all border-2 cursor-pointer relative ${isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-white/5 hover:border-white/10'}`}
                  onClick={() => handleItemToggle(item.id, item.quantity)}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => handleItemToggle(item.id, item.quantity)} 
                        className="data-[state=checked]:bg-primary"
                    />
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                       <Image 
                        src={
                            item.sku?.imageUrl || 
                            item.sku?.image || 
                            (item.sku?.product?.images?.[0] as any)?.url || 
                            item.sku?.product?.images?.[0] || 
                            "https://picsum.photos/200"
                        } 
                        alt={item.sku?.product?.name || "Product"} 
                        fill 
                        className="object-cover"
                       />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                       <p className="font-bold text-sm truncate">{item.sku?.product?.name}</p>
                       <p className="text-xs text-muted-foreground mt-1">
                           Qty: {item.quantity} • {formatCurrency(Number(item.priceAtPurchase))}
                       </p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
          {form.formState.errors.items && (
            <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-2">
                <AlertCircle size={14} />
                {form.formState.errors.items.message}
            </p>
          )}
        </section>

        {/* Section 2: Return Details */}
        <section className="space-y-6">
          <Separator className="bg-white/10" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Hash className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold">2. Return Reason & Method</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Request Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                      <SelectItem value="REFUND_ONLY">Refund Only (No return needed)</SelectItem>
                      <SelectItem value="RETURN_AND_REFUND">Return & Refund</SelectItem>
                      <SelectItem value="EXCHANGE">Exchange Item</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Primary Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                      <SelectItem value="DAMAGED">Damaged/Defective product</SelectItem>
                      <SelectItem value="WRONG_ITEM">Wrong item received</SelectItem>
                      <SelectItem value="NOT_AS_DESCRIBED">Product not as described</SelectItem>
                      <SelectItem value="CHANGED_MIND">Changed my mind</SelectItem>
                      <SelectItem value="OTHER">Other reason</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Additional Comments</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us more about why you're returning these items..." 
                    className="min-h-[120px] bg-white/5 border-white/10 focus:ring-primary resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {selectedType !== 'REFUND_ONLY' && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="returnMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Home Shipping Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                        <SelectItem value="PICKUP">Doorstep Pickup (We collect from you)</SelectItem>
                        <SelectItem value="SELF_SHIP">Self Ship (You ship to us)</SelectItem>
                        <SelectItem value="AT_COUNTER">Drop-off at Store Counter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px] text-muted-foreground mt-1 italic">
                      Pickup window is usually 24-48 business hours after approval.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </m.div>
          )}
        </section>

        {/* Section 3: Refund Preferences */}
        <section className="space-y-6">
          <Separator className="bg-white/10" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold">3. Refund Preferences</h2>
          </div>

          <FormField
            control={form.control}
            name="refundMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Refund To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary">
                      <SelectValue placeholder="Select refund method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                    <SelectItem value="ORIGINAL_PAYMENT">Original Payment Method (Reverse Charge)</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Direct Bank Transfer</SelectItem>
                    <SelectItem value="WALLET">Luxe Store Wallet (Instant Credit)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {selectedRefundMethod === 'BANK_TRANSFER' && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Recipient Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="bankAccount.bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Bank Name</FormLabel>
                      <FormControl>
                        <Input className="bg-black/20 border-white/5 h-10 focus:ring-primary" placeholder="e.g. Vietcombank" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccount.accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Account Number</FormLabel>
                      <FormControl>
                        <Input className="bg-black/20 border-white/5 h-10 focus:ring-primary" placeholder="0001000..." {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="bankAccount.accountHolder"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Account Holder Name</FormLabel>
                      <FormControl>
                        <Input className="bg-black/20 border-white/5 h-10 focus:ring-primary" placeholder="NGUYEN VAN A" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </m.div>
          )}
        </section>

        {/* Policy Alert */}
        <Alert className="bg-primary/5 border-primary/20 text-foreground rounded-2xl p-6">
          <Truck className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-bold mb-1">Advanced RMA Policy</AlertTitle>
          <AlertDescription className="text-sm opacity-80 leading-relaxed">
            Every luxe purchase is protected. Once you submit this request, our concierge team will inspect your details within 6-12 working hours. 
            If your return requires shipping, we will provide a printable shipping label via email.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
          <GlassButton 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {tCommon("cancel")}
          </GlassButton>
          <GlassButton 
            type="submit" 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black px-12 h-12 rounded-full shadow-lg shadow-primary/20"
            disabled={isPending}
          >
            {isPending ? "Submitting Request..." : "Submit RMA Request"}
          </GlassButton>
        </div>
      </form>
    </Form>
  );
}
