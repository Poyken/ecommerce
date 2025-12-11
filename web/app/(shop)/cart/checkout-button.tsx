"use client";

import { checkoutAction } from "@/actions/cart";
import { AddAddressDialog } from "@/components/add-address-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CheckoutButton({ hasAddress }: { hasAddress: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckout = () => {
    if (!hasAddress) {
      setAddressDialogOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await checkoutAction();
      if (res.success) {
        toast({
          title: "Order placed!",
          description: "Redirecting to your orders...",
        });
        router.push("/orders");
      } else {
        toast({
          title: "Checkout failed",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      <Button
        className="w-full"
        size="lg"
        onClick={handleCheckout}
        disabled={isPending}
      >
        {isPending ? "Processing..." : "Checkout"}
      </Button>

      <AddAddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onSuccess={() => {
          // Sau khi thêm địa chỉ thành công, tự động checkout luôn hoặc để user bấm lại
          // Ở đây để user bấm lại cho chắc chắn, hoặc có thể gọi handleCheckout()
          // Tuy nhiên handleCheckout cần hasAddress cập nhật, mà đây là client component
          // nên tốt nhất là đóng dialog, router.refresh() sẽ được gọi bởi action createAddress
          // và component sẽ re-render với hasAddress = true
        }}
      />
    </>
  );
}
