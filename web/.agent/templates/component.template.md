# Component Template

> Mẫu tạo React component theo chuẩn dự án

## React Component (Client)

```tsx
"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface {{ComponentName}}Props {
  children?: ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * {{ComponentName}} - [Mô tả ngắn]
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * - [Giải thích mục đích]
 * - [Các pattern đang dùng]
 */
export function {{ComponentName}}({ children, className }: {{ComponentName}}Props) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
```

## Server Component

```tsx
import { http } from "@/lib/http";

interface {{ComponentName}}Props {
  id: string;
}

export async function {{ComponentName}}({ id }: {{ComponentName}}Props) {
  const data = await http<ResponseType>(`/api/endpoint/${id}`);

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

## Component với Form (React Hook Form + Zod)

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schema
const formSchema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  email: z.email("Email không hợp lệ"),
});

type FormValues = z.infer<typeof formSchema>;

export function {{ComponentName}}Form() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Handle submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Gửi</Button>
      </form>
    </Form>
  );
}
```

## Custom Hook

```tsx
import { useState, useCallback } from "react";

export function use{{HookName}}(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, setValue, reset };
}
```

## Server Action

```tsx
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  id: z.string(),
});

export const {{actionName}}Action = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    try {
      // Implementation
      revalidatePath("/path");
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
```

## Zustand Store

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface {{StoreName}}State {
  items: Item[];
  isLoading: boolean;
}

interface {{StoreName}}Actions {
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

type {{StoreName}}Store = {{StoreName}}State & {{StoreName}}Actions;

export const use{{StoreName}}Store = create<{{StoreName}}Store>()(
  persist(
    (set) => ({
      // State
      items: [],
      isLoading: false,

      // Actions
      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      reset: () => set({ items: [], isLoading: false }),
    }),
    { name: "{{store-name}}-storage" }
  )
);
```
