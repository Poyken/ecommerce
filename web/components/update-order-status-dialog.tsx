"use client";

import { updateOrderStatusAction } from "@/actions/admin";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function UpdateOrderStatusDialog({
  orderId,
  currentStatus,
  open,
  onOpenChange,
}: {
  orderId: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setLoading(true);
    const result = await updateOrderStatusAction(orderId, status);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const isOptionDisabled = (optionValue: string) => {
    if (optionValue === currentStatus) return false; // Always allow keeping current status
    const allowed = allowedTransitions[currentStatus] || [];
    return !allowed.includes(optionValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the status of order {orderId.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="PENDING"
                disabled={isOptionDisabled("PENDING")}
              >
                PENDING
              </SelectItem>
              <SelectItem
                value="PROCESSING"
                disabled={isOptionDisabled("PROCESSING")}
              >
                PROCESSING
              </SelectItem>
              <SelectItem
                value="SHIPPED"
                disabled={isOptionDisabled("SHIPPED")}
              >
                SHIPPED
              </SelectItem>
              <SelectItem
                value="DELIVERED"
                disabled={isOptionDisabled("DELIVERED")}
              >
                DELIVERED
              </SelectItem>
              <SelectItem
                value="CANCELLED"
                disabled={isOptionDisabled("CANCELLED")}
              >
                CANCELLED
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
