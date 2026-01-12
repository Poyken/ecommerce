import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * BUTTON COMPONENT - Nút bấm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CVA (Class Variance Authority):
 * - Đây là tiêu chuẩn hiện đại để quản lý styles trong React.
 * - Thay vì viết hàng tá `if/else` để check props (primary, seconary, small, large...),
 *   ta định nghĩa các variants một lần và CVA sẽ tự map props thành class string.
 *
 * 2. RADIX UI SLOT (`asChild`):
 * - Kỹ thuật nâng cao giúp component linh hoạt hơn (Polymorphism).
 * - Khi `asChild=true`, Button nhường quyền render cho phần tử con trực tiếp của nó,
 *   nhưng vẫn ép styles của Button lên con đó.
 * - Ứng dụng: Biến thẻ `<a>` (Link) thành hình dạng Button.
 *   `<Button asChild><Link href="/">Home</Link></Button>` *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

/**
 * Định nghĩa tất cả các biến thể của nút.
 * Cấu trúc: base classes -> variants -> default variants
 */
const buttonVariants = cva(
  // CLASSES CƠ BẢN (Luôn có):
  // - inline-flex center: Căn giữa nội dung
  // - focus-visible: Style cho keyboard navigation (Accessibility)
  // - disabled: Style khi bị vô hiệu hóa
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      // KIỂU DÁNG (Màu sắc, viền)
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 shadow-sm",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/50 hover:text-accent-foreground dark:bg-transparent dark:hover:bg-accent/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-accent/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // KÍCH THƯỚC
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-4", // Chuẩn
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3", // Nhỏ
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6", // Lớn
        icon: "size-11", // Vuông (chỉ chứa icon)
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    // Giá trị mặc định nếu không truyền props
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Tạo Interface Props kế thừa từ button chuẩn HTML + variants của CVA
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // Có delegate render cho con không?
  loading?: boolean; // Trạng thái đang tải?
}

/**
 * Button Component chính.
 * Hỗ trợ loading spinner và custom element rendering.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Nếu asChild=true -> Dùng Slot (Render con). Ngược lại render <button>
    const Comp = asChild ? Slot : "button";

    // Case đặc biệt: Khi đang loading
    // Nếu không phải asChild (tức là Button bình thường), ta tự thêm icon quay quay
    if (!asChild) {
      return (
        <Comp
          data-slot="button" // Marker để debug hoặc styling external
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={disabled || loading} // Disable nút khi đang loading
          ref={ref}
          {...props}
        >
          {/* Nếu loading -> Hiện Spinner và ẩn tạm nội dung (hoặc hiện cạnh nội dung tùy design) */}
          {/* Ở đây design là hiện cạnh trái text */}
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </Comp>
      );
    }

    // Case asChild: Chỉ forward props và styles xuống component con
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

const MemoizedButton = React.memo(Button);

export { MemoizedButton as Button, buttonVariants };
