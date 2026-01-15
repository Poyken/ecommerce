/**
 * =====================================================================
 * TYPED NAVIGATION - Type-safe wrappers for next-intl routing
 * =====================================================================
 *
 * 📚 PURPOSE:
 * This file provides type-safe wrappers around next-intl's navigation
 * utilities to eliminate `as any` type assertions in components.
 *
 * USAGE:
 * Instead of: router.prefetch(`/products/${id}` as any)
 * Use:        router.prefetch(appRoutes.product(id))
 * 
 * Instead of: <Link href={`/products/${id}` as any}>
 * Use:        <TypedLink href={appRoutes.product(id)}>
 *
 * =====================================================================
 */

import { ComponentProps } from "react";
import { Link as NextIntlLink, useRouter as useNextIntlRouter } from "@/i18n/routing";

// ============================================================================
// ROUTE DEFINITIONS - Central place for all app routes
// ============================================================================

/**
 * Application routes with type-safe parameters.
 * Add new routes here as the app grows.
 */
export const appRoutes = {
  // Public routes
  home: "/" as const,
  shop: "/shop" as const,
  products: "/products" as const,
  about: "/about" as const,
  contact: "/contact" as const,
  product: (idOrSlug: string) => `/products/${idOrSlug}` as const,
  categories: "/categories" as const,
  category: (slug: string) => `/categories/${slug}` as const,
  brands: "/brands" as const,
  brand: (slug: string) => `/brands/${slug}` as const,
  cart: "/cart" as const,
  checkout: "/checkout" as const,
  
  // Blog
  blog: "/blog" as const,
  blogPost: (slug: string) => `/blog/${slug}` as const,
  
  // User routes
  profile: "/profile" as const,
  orders: "/profile/orders" as const,
  order: (id: string) => `/profile/orders/${id}` as const,
  addresses: "/profile/addresses" as const,
  wishlist: "/wishlist" as const,
  
  // Auth routes
  login: "/login" as const,
  register: "/register" as const,
  forgotPassword: "/forgot-password" as const,
  notifications: "/notifications" as const,
  
  // Admin routes
  admin: {
    superAdmin: "/super-admin" as const,
    dashboard: "/admin" as const,
    products: "/admin/products" as const,
    product: (id: string) => `/admin/products/${id}` as const,
    productEdit: (id: string) => `/admin/products/${id}/edit` as const,
    orders: "/admin/orders" as const,
    order: (id: string) => `/admin/orders/${id}` as const,
    customers: "/admin/customers" as const,
    notifications: "/admin/notifications" as const,
    settings: "/admin/settings" as const,
  },
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * All valid route paths in the application.
 * This union type allows TypeScript to validate route strings.
 */
export type AppRoute = 
  | typeof appRoutes.home
  | typeof appRoutes.products
  | ReturnType<typeof appRoutes.product>
  | typeof appRoutes.categories
  | ReturnType<typeof appRoutes.category>
  | typeof appRoutes.brands
  | ReturnType<typeof appRoutes.brand>
  | typeof appRoutes.cart
  | typeof appRoutes.checkout
  | typeof appRoutes.blog
  | ReturnType<typeof appRoutes.blogPost>
  | typeof appRoutes.profile
  | typeof appRoutes.orders
  | ReturnType<typeof appRoutes.order>
  | typeof appRoutes.addresses
  | typeof appRoutes.wishlist
  | typeof appRoutes.login
  | typeof appRoutes.register
  | typeof appRoutes.forgotPassword
  | typeof appRoutes.admin.dashboard
  | typeof appRoutes.admin.products
  | ReturnType<typeof appRoutes.admin.product>
  | ReturnType<typeof appRoutes.admin.productEdit>
  | typeof appRoutes.admin.orders
  | ReturnType<typeof appRoutes.admin.order>
  | typeof appRoutes.admin.customers
  | typeof appRoutes.admin.settings
  // Allow any string starting with / for flexibility
  | `/${string}`
  // Allow hash links
  | `#${string}`;

// ============================================================================
// TYPED LINK COMPONENT
// ============================================================================

type NextIntlLinkProps = ComponentProps<typeof NextIntlLink>;

export interface TypedLinkProps extends Omit<NextIntlLinkProps, "href"> {
  href: AppRoute;
}

/**
 * Type-safe Link component wrapper.
 * 
 * @example
 * // Instead of:
 * <Link href={`/products/${id}` as any}>View</Link>
 * 
 * // Use:
 * <TypedLink href={appRoutes.product(id)}>View</TypedLink>
 */
export function TypedLink({ href, ...props }: TypedLinkProps) {
  return <NextIntlLink href={href as NextIntlLinkProps["href"]} {...props} />;
}

// ============================================================================
// TYPED ROUTER HOOK
// ============================================================================

/**
 * Type-safe useRouter hook wrapper.
 * 
 * @example
 * const router = useTypedRouter();
 * router.push(appRoutes.product(id)); // Type-safe!
 */
export function useTypedRouter() {
  const router = useNextIntlRouter();
  
  return {
    ...router,
    push: (href: AppRoute, options?: Parameters<typeof router.push>[1]) => {
      router.push(href as Parameters<typeof router.push>[0], options);
    },
    replace: (href: AppRoute, options?: Parameters<typeof router.replace>[1]) => {
      router.replace(href as Parameters<typeof router.replace>[0], options);
    },
    prefetch: (href: AppRoute) => {
      router.prefetch(href as Parameters<typeof router.prefetch>[0]);
    },
  };
}
