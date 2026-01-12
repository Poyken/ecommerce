"use client";

import { m } from "@/lib/animations";

interface TextBlockSectionProps {
  title: string;
  content: string;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * =================================================================================================
 * TEXT BLOCK SECTION - KHỐI NỘI DUNG VĂN BẢN TỰ DO
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTENT SPLITTING:
 *    - {content.split("\n").map(...)}: Tự động chia văn bản thành các đoạn văn `<p>`
 *      dựa trên ký tự xuống dòng. Giúp User dễ dàng trình bày text từ Admin.
 *
 * 2. TYPOGRAPHY FOCUS:
 *    - Sử dụng `font-serif` (phông chữ có chân) cho tiêu đề để tạo cảm giác sang trọng, tạp chí.
 *    - Sử dụng lớp `prose` (Tailwind Typography) để tự động fomat các thẻ HTML bên trong nếu có. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function TextBlockSection({
  title,
  content,
  styles,
}: TextBlockSectionProps) {
  return (
    <section
      className="py-24 px-4 bg-background w-full"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto space-y-8 text-center"
      >
        {title && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">
              Read More
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
              {title}
            </h2>
          </div>
        )}
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-light">
          {content.split("\n").map((paragraph, idx) => (
            <p key={idx} className="mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </m.div>
    </section>
  );
}
