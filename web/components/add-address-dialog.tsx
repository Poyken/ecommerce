"use client";

import { createAddressAction, updateAddressAction } from "@/actions/address";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: any; // If provided, we are in edit mode
}

export function AddAddressDialog({
  open,
  onOpenChange,
  onSuccess,
  address,
}: AddAddressDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    street: "",
    city: "",
    district: "",
    ward: "",
  });

  useEffect(() => {
    if (address) {
      setFormData({
        recipientName: address.recipientName || "",
        phoneNumber: address.phoneNumber || "",
        street: address.street || "",
        city: address.city || "",
        district: address.district || "",
        ward: address.ward || "",
      });
    } else {
      setFormData({
        recipientName: "",
        phoneNumber: "",
        street: "",
        city: "",
        district: "",
        ward: "",
      });
    }
  }, [address, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      // Only set default if creating new, or if explicitly handled (UI for default not added here yet)
      // For edit, we preserve existing default status unless we add a checkbox
      if (!address) {
        form.append("isDefault", "on");
      } else {
        if (address.isDefault) form.append("isDefault", "on");
      }

      let res;
      if (address) {
        res = await updateAddressAction(address.id, form);
      } else {
        res = await createAddressAction(form);
      }

      if (res.success) {
        toast({
          title: address ? "Address updated" : "Address added successfully",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: address ? "Failed to update address" : "Failed to add address",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {address ? "Edit Address" : "Add Shipping Address"}
          </DialogTitle>
          <DialogDescription>
            {address
              ? "Update your shipping details."
              : "You need a shipping address to proceed with checkout."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipientName" className="text-right">
                Name
              </Label>
              <Input
                id="recipientName"
                className="col-span-3"
                value={formData.recipientName}
                onChange={(e) =>
                  setFormData({ ...formData, recipientName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                className="col-span-3"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="street" className="text-right">
                Street
              </Label>
              <Input
                id="street"
                className="col-span-3"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input
                id="city"
                className="col-span-3"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="district" className="text-right">
                District
              </Label>
              <Input
                id="district"
                className="col-span-3"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ward" className="text-right">
                Ward
              </Label>
              <Input
                id="ward"
                className="col-span-3"
                value={formData.ward}
                onChange={(e) =>
                  setFormData({ ...formData, ward: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : address
                ? "Update Address"
                : "Save Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
