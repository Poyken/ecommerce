

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: string; // e.g. "sm:max-w-md" or "sm:max-w-2xl"
  disabled?: boolean;
  icon?: ReactNode;
  variant?: "default" | "create" | "edit";
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isPending = false,
  submitLabel,
  cancelLabel,
  maxWidth = "sm:max-w-md",
  disabled = false,
  icon,
  variant = "default",
}: FormDialogProps) {
  const t = useTranslations("admin");

  const submitButtonClass = cn(
    variant === "create" && "bg-emerald-600 hover:bg-emerald-700 text-white",
    variant === "edit" && "bg-blue-600 hover:bg-blue-700 text-white"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  variant === "create" &&
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                  variant === "edit" &&
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                  variant === "default" && "bg-primary/10 text-primary"
                )}
              >
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {/* Form Content */}
          <div className="py-2 space-y-4">{children}</div>

          {/* Footer */}
          <DialogFooter className="gap-2 sm:gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {cancelLabel || t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={disabled || isPending}
              className={cn("w-full sm:w-auto", submitButtonClass)}
            >
              {submitLabel || t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
