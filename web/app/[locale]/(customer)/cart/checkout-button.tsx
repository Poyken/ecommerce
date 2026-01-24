"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTransition } from "react";



export function CheckoutButton({ itemIds }: { itemIds: string[] }) {
  const [isPending] = useTransition();

  const checkoutUrl =
    itemIds.length > 0 ? `/checkout?items=${itemIds.join(",")}` : "/checkout";

  return (
    <Link href={checkoutUrl} className="w-full">
      <Button
        className="w-full bg-linear-to-r from-success to-success/80 hover:from-success/90 hover:to-success text-success-foreground font-semibold shadow-lg shadow-success/20"
        size="lg"
        disabled={isPending || itemIds.length === 0}
      >
        Checkout ({itemIds.length})
      </Button>
    </Link>
  );
}
