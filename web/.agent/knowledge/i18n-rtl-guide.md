# i18n & RTL Guide

> **Stack**: next-intl  
> **Goal**: 100% localization support and RTL layout (Arabic, Hebrew)

---

## 1. Current i18n Setup (next-intl)

Dự án sử dụng `next-intl` với App Router structure:

```
web/
├── messages/
│   ├── vi.json
│   └── en.json
├── src/
│   ├── i18n.ts
│   └── middleware.ts
└── app/
    └── [locale]/
        └── layout.tsx
```

---

## 2. Adding RTL Support

### 2.1 Locale Configuration

Định nghĩa metadata cho RTL locales:

```typescript
// web/src/config/i18n.config.ts
export const locales = ["vi", "en", "ar", "he"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["ar", "he"];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
```

### 2.2 Global Layout Update

Tự động detect và set `dir` attribute:

```tsx
// web/app/[locale]/layout.tsx
import { isRTL, Locale } from '@/config/i18n.config';

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const direction = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <head />
      <body className={...}>
        {children}
      </body>
    </html>
  );
}
```

---

## 3. CSS RTL Best Practices (Tailwind CSS 4)

Tailwind CSS 4 (và các bản 3.x muộn) hỗ trợ RTL qua các classes logic (logical properties).

### DO: Sử dụng Logical Properties

Sử dụng `start` và `end` thay vì `left` và `right`.

| Standard    | Logical (RTL friendly) | Description             |
| ----------- | ---------------------- | ----------------------- |
| `ml-4`      | `ms-4`                 | Margin Start            |
| `mr-2`      | `me-2`                 | Margin End              |
| `pl-6`      | `ps-6`                 | Padding Start           |
| `pr-4`      | `pe-4`                 | Padding End             |
| `left-0`    | `start-0`              | Absolute Position Start |
| `right-4`   | `end-4`                | Absolute Position End   |
| `text-left` | `text-start`           | Text Alignment          |

### Tránh: Hardcoded Directions

❌ `text-right` → Sẽ bị ngược khi ở chế độ RTL.  
✅ `text-end` → Sẽ sang phải ở LTR và sang trái ở RTL.

---

## 4. Components RTL Logic

### Icons Mirroring

Một số icon cần mirror (lật) khi ở RTL (ví dụ: Arrows).

```tsx
import { isRTL } from "@/config/i18n.config";
import { useLocale } from "next-intl";

const Icon = () => {
  const locale = useLocale() as Locale;
  const rtl = isRTL(locale);

  return <ArrowRight className={rtl ? "rotate-180" : ""} />;
};
```

---

## 5. Translation Management

### structure json

Giữ cấu trúc phẳng hoặc lồng nhau tối thiểu để dễ quản lý.

```json
// messages/vi.json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy"
  },
  "cart": {
    "title": "Giỏ hàng của bạn",
    "empty": "Chưa có sản phẩm"
  }
}
```

### Pluralization

```json
{
  "cart": {
    "itemsCount": "{count, plural, =0 {Trống} =1 {1 sản phẩm} other {# sản phẩm}}"
  }
}
```

---

## 6. Locale Switcher Component

```tsx
// web/components/locale-switcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // Replace locale in current path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      <option value="vi">Tiếng Việt</option>
      <option value="en">English</option>
      <option value="ar">العربية (RTL)</option>
    </select>
  );
}
```

---

## 7. Testing RTL

1. Switch language sang **Arabic** (`/ar`).
2. Kiểm tra sidebar chuyển sang bên phải.
3. Kiểm tra text alignment tự động chuyển sang `right` (end).
4. Kiểm tra các khoảng cách (margin/padding) vẫn chính xác.

---

## 8. Best Practices

### DO

- ✅ Luôn sử dụng logical properties (`ps`, `pe`, `ms`, `me`).
- ✅ Thiết lập `dir="rtl"` ở root HTML.
- ✅ Sử dụng `next-intl` cho toàn bộ text (kể cả placeholders).
- ✅ Validate translations định kỳ (tránh missing keys).

### DON'T

- ❌ Hardcode `left` hoặc `right` trong CSS/Inline styles.
- ❌ Quên mirror các icon chỉ hướng.
- ❌ Hardcode fonts (sử dụng font stack hỗ trợ đa ngôn ngữ).

---

**Location**: `web/app/[locale]/layout.tsx`, `web/messages/*.json`
