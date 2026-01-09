/**
 * =====================================================================
 * SHARED COMPONENTS INDEX - Central Export Point
 * =====================================================================
 *
 * Export tất cả shared components từ một điểm duy nhất.
 * Import: import { OptimizedImage, EmptyState } from "@/components/shared"
 */

// Data states (loading, error, empty)
export * from "./data-states";

// Image components
export { OptimizedImage, ProductImage } from "./optimized-image";

// Smart Widget (AI-driven UI)
export { SmartWidget } from "./smart-widget";
export type { UISchema, UISchemaType } from "./smart-widget";

// Other shared components
export { BackButton } from "./back-button";
export { BreadcrumbNav } from "./breadcrumb-nav";
export { EmptyState as EmptyStateOld } from "./empty-state";
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
export { PerformanceTracker } from "./performance-tracker";
export { ProgressiveImage } from "./progressive-image";
export { PurchaseToast } from "./purchase-toast";
export { SearchInput } from "./search-input";
export { SmoothScroll } from "./smooth-scroll";
export { SocialProofToast } from "./social-proof-toast";
export { StatusBadge } from "./status-badge";
export { StickyHeader } from "./sticky-header";
export { StockIndicator } from "./stock-indicator";
export { TenantStyleProvider } from "./tenant-style-provider";
export { ThemeProvider } from "./theme-provider";
export { ThemeToggle } from "./theme-toggle";
