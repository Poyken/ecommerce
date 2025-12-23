import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * TOAST COMPONENT - Thông báo nổi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ARCHITECTURE:
 * - `ToastProvider`: Wrap toàn bộ ứng dụng (thường ở Root Layout).
 * - `ToastViewport`: Nơi các toast sẽ xuất hiện (thường là góc màn hình).
 * - `Toast`: Component hiển thị từng thông báo cụ thể.
 *
 * 2. VARIANTS (CVA):
 * - Sử dụng `class-variance-authority` để định nghĩa các kiểu toast:
 *   - `default`: Thông báo thường (trắng/đen).
 *   - `destructive`: Lỗi (đỏ).
 *   - `success`: Thành công (xanh lá).
 * =====================================================================
 */

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[500] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-5 pr-8 shadow-2xl transition-all duration-300 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default:
          "border-white/20 bg-white/10 dark:bg-black/40 backdrop-blur-xl text-foreground shadow-white/5",
        destructive:
          "destructive group border-destructive/40 bg-destructive/10 backdrop-blur-xl text-destructive shadow-destructive/20 ring-1 ring-destructive/20",
        success:
          "success group border-success/40 bg-success/10 backdrop-blur-xl text-success shadow-success/20 ring-1 ring-success/20",
        info: "info group border-info/40 bg-info/10 backdrop-blur-xl text-info shadow-info/20 ring-1 ring-info/20",
        warning:
          "warning group border-warning/40 bg-warning/10 backdrop-blur-xl text-warning shadow-warning/20 ring-1 ring-warning/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive group-[.success]:border-muted/40 group-[.success]:hover:border-green-500/30 group-[.success]:hover:bg-green-500 group-[.success]:hover:text-white group-[.success]:focus:ring-green-500 group-[.info]:border-muted/40 group-[.info]:hover:border-primary/30 group-[.info]:hover:bg-primary group-[.info]:hover:text-primary-foreground group-[.info]:focus:ring-primary group-[.warning]:border-muted/40 group-[.warning]:hover:border-amber-500/30 group-[.warning]:hover:bg-amber-500 group-[.warning]:hover:text-white group-[.warning]:focus:ring-amber-500",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-xl p-1.5 text-foreground/50 opacity-0 transition-all hover:opacity-100 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 active:scale-95 group-[.destructive]:text-destructive/70 group-[.destructive]:hover:text-destructive group-[.success]:text-success/70 group-[.success]:hover:text-success group-[.info]:text-info/70 group-[.info]:hover:text-info group-[.warning]:text-warning/70 group-[.warning]:hover:text-warning",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4 stroke-[3px]" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
};
