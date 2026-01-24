import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";



/**
 * Định nghĩa tất cả các biến thể của nút.
 * Cấu trúc: base classes -> variants -> default variants
 */
const buttonVariants = cva(
  // CLASSES CƠ BẢN (Luôn có):
  // - inline-flex center: Căn giữa nội dung
  // - focus-visible: Style cho keyboard navigation (Accessibility)
  // - disabled: Style khi bị vô hiệu hóa
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      // KIỂU DÁNG (Màu sắc, viền)
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 shadow-sm",
        outline:
          "border border-border bg-background/50 backdrop-blur-sm shadow-sm hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-white/5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-white dark:bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 dark:shadow-white/5",
        aurora:
          "bg-gradient-to-r from-[var(--aurora-blue)] via-[var(--aurora-purple)] to-[var(--aurora-orange)] text-white hover:opacity-90 shadow-xl shadow-purple-500/20",
        glass:
          "glass-premium text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 border-foreground/10 dark:border-white/10",
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
