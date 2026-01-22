

"use client";

import { AddressDisplay } from "@/features/address/components/address-display";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Address } from "@/types/models";
import { Label } from "@radix-ui/react-label";
import { MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onEdit: (address: Address) => void;
}

export const AddressSelector = memo(function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  onEdit,
}: AddressSelectorProps) {
  const t = useTranslations("checkout");

  return (
    <GlassCard className="p-8 rounded-4xl border-foreground/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
          <MapPin className="text-primary w-7 h-7" /> {t("shippingAddress")}
        </h2>
        <GlassButton
          size="sm"
          onClick={onAddNew}
          className="font-bold uppercase text-xs tracking-widest"
        >
          <Plus size={16} className="mr-2" /> {t("addNew")}
        </GlassButton>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/60 font-medium">
          {t("noAddresses")}
        </div>
      ) : (
        <RadioGroup
          value={selectedAddressId}
          onValueChange={onSelect}
          className="space-y-4"
        >
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`group relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg ${
                selectedAddressId === addr.id
                  ? "border-primary bg-primary/5 shadow-primary/10"
                  : "border-foreground/5 hover:border-primary/30 hover:bg-foreground/2"
              }`}
              onClick={() => onSelect(addr.id)}
            >
              <div className="flex items-center h-5 mt-1">
                <RadioGroupItem value={addr.id} id={addr.id} />
              </div>
              <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                <AddressDisplay
                  name={addr.recipientName}
                  phone={addr.phoneNumber}
                  address={`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                  isDefault={addr.isDefault}
                />
              </Label>
              <div className="flex flex-col items-end gap-2">
                <GlassButton
                  size="sm"
                  variant="outline"
                  className="transition-all duration-300 hover:bg-primary hover:text-white border-primary/20 font-bold uppercase text-xs tracking-widest"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(addr);
                  }}
                >
                  {t("edit") || "Edit"}
                </GlassButton>
              </div>
            </div>
          ))}
        </RadioGroup>
      )}
    </GlassCard>
  );
});
