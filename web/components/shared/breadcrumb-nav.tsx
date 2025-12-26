import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shared/breadcrumb";
import { Link } from "@/i18n/routing";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * BREADCRUMB NAV - Thanh điều hướng phân cấp
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UX & SEO:
 * - Breadcrumb giúp người dùng biết họ đang ở đâu trong cấu trúc website.
 * - Hỗ trợ Google Index tốt hơn (Search Console thường báo lỗi nếu thiếu Breadcrumb).
 *
 * 2. COMPONENT STRUCTURE:
 * - Luôn bắt đầu bằng `Home` icon để user dễ dàng quay lại trang chủ.
 * - Tự động render `BreadcrumbSeparator` giữa các item.
 *
 * 3. CONDITIONAL RENDERING:
 * - Nếu item có `href`: Render `BreadcrumbLink` (có thể click).
 * - Nếu không có `href`: Render `BreadcrumbPage` (trang hiện tại, không click được).
 * =====================================================================
 */

export interface BreadcrumbNavItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[];
  className?: string;
}

/**
 * BreadcrumbNav - Reusable breadcrumb navigation component
 * Tự động thêm Home icon ở đầu và render các breadcrumb items
 *
 * @example
 * <BreadcrumbNav items={[
 *   { label: "Shop", href: "/shop" },
 *   { label: "Women's Clothing" }
 * ]} />
 */
export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  const t = useTranslations("common");

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home Link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only">{t("sr.home")}</span>
              </div>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 sm:gap-2.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href as any}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
