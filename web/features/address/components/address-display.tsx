

"use client";

import { cn } from "@/lib/utils";
import { MapPin, Phone, User } from "lucide-react";

interface AddressDisplayProps {
  name: string;
  phone: string;
  address: string;
  isDefault?: boolean;
  className?: string;
  defaultLabel?: string;
}

export function AddressDisplay({
  name,
  phone,
  address,
  isDefault,
  className,
  defaultLabel = "Default",
}: AddressDisplayProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold flex items-center gap-2 text-base">
          <User className="w-4 h-4 text-primary" />
          {name}
        </div>
        {isDefault && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {defaultLabel}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          {phone}
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="leading-snug">{address}</span>
        </div>
      </div>
    </div>
  );
}
