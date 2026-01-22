import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { LucideIcon, PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function ShopEmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-900/50 dark:border-gray-800">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground mb-6">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
