"use client";

import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, ComponentType } from "react";

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name: keyof typeof dynamicIconImports;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const [Icon, setIcon] = useState<ComponentType<LucideProps> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = (dynamicIconImports as any)[name];
    if (typeof loader === "function") {
      loader().then((mod: any) => {
        if (isMounted && mod.default) {
          setIcon(() => mod.default);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [name]);

  if (!Icon) {
    return <Skeleton className="h-5 w-5 rounded-full" />;
  }

  return <Icon {...props} />;
}
