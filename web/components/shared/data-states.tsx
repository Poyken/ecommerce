"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { memo, ReactNode, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";



// ============================================================================
// TYPES
// ============================================================================

interface DataStateProps {
  className?: string;
  children?: ReactNode;
}

interface LoadingStateProps extends DataStateProps {
  /** Label hiển thị */
  label?: string;
  /** Size của spinner */
  size?: "sm" | "md" | "lg";
}

interface ErrorStateProps extends DataStateProps {
  /** Nội dung lỗi */
  error?: Error | string | null;
  /** Callback khi bấm retry */
  onRetry?: () => void;
  /** Label cho nút retry */
  retryLabel?: string;
}

interface DataEmptyStateProps extends DataStateProps {
  /** Icon component */
  icon?: ReactNode;
  /** Tiêu đề */
  title?: string;
  /** Mô tả chi tiết */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// LOADING STATE
// ============================================================================

/**
 * Component hiển thị trạng thái loading.
 * Sử dụng: Khi đang fetch data.
 */
export const LoadingState = memo(function LoadingState({
  label = "Đang tải...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-muted-foreground",
        className
      )}
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {label && <p className="mt-4 text-sm">{label}</p>}
    </div>
  );
});

/**
 * Skeleton loading với shimmer effect.
 */
export const SkeletonShimmer = memo(function SkeletonShimmer({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/50 rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    />
  );
});

// ============================================================================
// ERROR STATE
// ============================================================================

/**
 * Component hiển thị trạng thái lỗi.
 * Sử dụng: Khi fetch data thất bại.
 */
export const ErrorState = memo(function ErrorState({
  error,
  onRetry,
  retryLabel = "Thử lại",
  className,
  children,
}: ErrorStateProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : error || "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

  return (
    <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mt-4 font-semibold text-destructive">
          Đã có lỗi xảy ra
        </h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
          {errorMessage}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// EMPTY STATE
// ============================================================================

/**
 * Component hiển thị trạng thái empty.
 * Sử dụng: Khi không có data.
 */
export const DataEmptyState = memo(function DataEmptyState({
  icon,
  title = "Không có dữ liệu",
  description,
  action,
  className,
  children,
}: DataEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && <div className="rounded-full bg-muted p-4 mb-4">{icon}</div>}
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
});

// ============================================================================
// DATA WRAPPER (Smart Component)
// ============================================================================

interface DataWrapperProps<T> {
  /** Data đã fetch */
  data: T | null | undefined;
  /** Đang loading */
  isLoading?: boolean;
  /** Error nếu có */
  error?: Error | null;
  /** Callback retry */
  onRetry?: () => void;
  /** Render function khi có data */
  children: (data: T) => ReactNode;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom error component */
  errorComponent?: ReactNode;
  /** Custom empty component */
  emptyComponent?: ReactNode;
  /** Kiểm tra data có empty không */
  isEmpty?: (data: T) => boolean;
  /** Class cho container */
  className?: string;
}

/**
 * Smart wrapper component xử lý tất cả các trạng thái của data fetching.
 * Giúp giảm boilerplate code khi render data.
 *
 * @example
 * <DataWrapper
 *   data={products}
 *   isLoading={isLoading}
 *   error={error}
 *   isEmpty={(data) => data.length === 0}
 * >
 *   {(products) => (
 *     <ProductGrid products={products} />
 *   )}
 * </DataWrapper>
 */
export function DataWrapper<T>({
  data,
  isLoading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty,
  className,
}: DataWrapperProps<T>) {
  // Loading state
  if (isLoading) {
    return loadingComponent || <LoadingState className={className} />;
  }

  // Error state
  if (error) {
    return (
      errorComponent || (
        <ErrorState error={error} onRetry={onRetry} className={className} />
      )
    );
  }

  // Empty state
  if (!data || (isEmpty && isEmpty(data))) {
    return emptyComponent || <DataEmptyState className={className} />;
  }

  // Success - render children với data
  return <>{children(data)}</>;
}

// ============================================================================
// ASYNC BOUNDARY (For Suspense)
// ============================================================================

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * Wrapper component cho Suspense với error boundary.
 * Sử dụng với React Server Components và async data fetching.
 */
export function AsyncBoundary({
  children,
  fallback = <LoadingState />,
}: AsyncBoundaryProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// ============================================================================
// INLINE LOADING
// ============================================================================

/**
 * Loading indicator inline cho buttons, inputs, etc.
 */
export const InlineLoader = memo(function InlineLoader({
  className,
}: {
  className?: string;
}) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
});
