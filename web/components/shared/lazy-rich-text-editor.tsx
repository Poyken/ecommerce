

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton component cho loading state
function RichTextEditorSkeleton() {
  return (
    <div className="border rounded-md">
      {/* Toolbar skeleton */}
      <div className="border-b bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
      {/* Editor content skeleton */}
      <div className="p-4 min-h-[200px] space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

// Dynamic import với SSR disabled
const RichTextEditorBase = dynamic(
  () =>
    import("./rich-text-editor").then((mod) => ({
      default: mod.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => <RichTextEditorSkeleton />,
  }
);

// Type-safe wrapper
type RichTextEditorProps = ComponentProps<typeof RichTextEditorBase>;

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorBase {...props} />;
}

// Export skeleton for external use
export { RichTextEditorSkeleton };
