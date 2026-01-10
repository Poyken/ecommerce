/**
 * =====================================================================
 * SHARED COMPONENTS INDEX - Central Export Point
 * =====================================================================
 *
 * Export tất cả shared components từ một điểm duy nhất.
 * Import: import { OptimizedImage, ShopEmptyState } from "@/components/shared"
 */

// Data states (loading, error, empty)
export * from "./data-states";

// Image components
export { OptimizedImage, ProductImage } from "./optimized-image";

// Data table components
export { DataTablePagination } from "./data-table-pagination";
export { DataTableEmptyRow } from "./data-table-empty-row";

// Other shared components

export { BackgroundBlob } from "./background-blob";

export { BreadcrumbNav } from "./breadcrumb-nav";
export { ErrorBoundary } from "./error-boundary";
export { FormDialog } from "./form-dialog";
export { GlassButton } from "./glass-button";
export { GlassCard } from "./glass-card";
export { ImageUpload } from "./image-upload";
export { LanguageSwitcher } from "./language-switcher";
export { LazyLoad } from "./lazy-load";
export { LoadingScreen } from "./loading-screen";
export { MotionButton } from "./motion-button";
export { NavCard } from "./nav-card";
export { PasswordInput } from "./password-input";
export { SearchInput } from "./search-input";
export { ShopEmptyState } from "./shop-empty-state";
export { SmoothScroll } from "./smooth-scroll";
export { StatusBadge } from "./status-badge";
export { StickyHeader } from "./sticky-header";
export { TenantStyleProvider } from "./tenant-style-provider";
export { ThemeProvider } from "./theme-provider";
export { ThemeToggle } from "./theme-toggle";
export { UserAvatar } from "./user-avatar";
