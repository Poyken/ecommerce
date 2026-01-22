"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";



interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
  isLoading,
}: AdminSearchInputProps) {
  return (
    <div className={`relative max-w-sm w-full ${className || ""}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11 h-12 rounded-2xl bg-secondary/30 border-transparent focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary/20 transition-all font-medium pr-10 shadow-none hover:bg-secondary/50"
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
