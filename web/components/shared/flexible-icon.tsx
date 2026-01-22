
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";
import Image from "next/image";

export const FlexibleIcon = ({
  source,
  size = 18,
  className,
}: {
  source?: string;
  size?: number;
  className?: string;
}) => {
  if (!source) return null;

  // Check if source is a URL (contains / or .)
  if (source.includes("/") || source.includes(".")) {
    return (
      <div
        className={cn("relative overflow-hidden", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={source}
          alt="icon"
          fill
          className="object-contain"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  // Otherwise assume Lucide Icon Name
  const iconName = source.toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  if (iconName in dynamicIconImports) {
    return <DynamicIcon name={iconName as keyof typeof dynamicIconImports} size={size} className={className} />;
  }
  
  return null;
};
