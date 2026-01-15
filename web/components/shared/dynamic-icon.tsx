"use client";

import dynamic from "next/dynamic";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name: keyof typeof dynamicIconImports;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = dynamic(dynamicIconImports[name], {
    loading: () => <Skeleton className="h-5 w-5 rounded-full" />,
  });

  return <Icon {...props} />;
}
