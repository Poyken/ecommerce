import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";



const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-500 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2",
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
          "border-border/50 bg-card backdrop-blur-xl text-card-foreground shadow-lg",
        destructive:
          "destructive group border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 backdrop-blur-xl text-rose-700 dark:text-rose-400 shadow-lg ring-1 ring-rose-500/10",
        success:
          "success group border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-xl text-emerald-700 dark:text-emerald-400 shadow-lg ring-1 ring-emerald-500/10",
        info: "info group border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-xl text-blue-700 dark:text-blue-400 shadow-lg ring-1 ring-blue-500/10",
        warning:
          "warning group border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20 backdrop-blur-xl text-amber-700 dark:text-amber-400 shadow-lg ring-1 ring-amber-500/10",
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
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-rose-500/40 group-[.destructive]:hover:border-rose-500/30 group-[.destructive]:hover:bg-rose-500 group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-rose-500 group-[.success]:border-emerald-500/40 group-[.success]:hover:border-emerald-500/30 group-[.success]:hover:bg-emerald-500 group-[.success]:hover:text-white group-[.success]:focus:ring-emerald-500 group-[.info]:border-blue-500/40 group-[.info]:hover:border-blue-500/30 group-[.info]:hover:bg-blue-500 group-[.info]:hover:text-white group-[.info]:focus:ring-blue-500 group-[.warning]:border-amber-500/40 group-[.warning]:hover:border-amber-500/30 group-[.warning]:hover:bg-amber-500 group-[.warning]:hover:text-white group-[.warning]:focus:ring-amber-500",
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
      "absolute right-3 top-3 rounded-xl p-1.5 text-foreground/50 opacity-0 transition-all hover:opacity-100 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 active:scale-95 group-[.destructive]:text-rose-500/70 group-[.destructive]:hover:text-rose-600 group-[.success]:text-emerald-500/70 group-[.success]:hover:text-emerald-600 group-[.info]:text-blue-500/70 group-[.info]:hover:text-blue-600 group-[.warning]:text-amber-500/70 group-[.warning]:hover:text-amber-600",
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
    type ToastProps
};

