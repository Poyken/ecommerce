"use client";

/**
 * =====================================================================
 * DIVIDER/SPACER BLOCK - Điều chỉnh khoảng cách giữa các sections
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import type { BaseBlockProps } from "../types/block-types";

interface DividerBlockProps extends BaseBlockProps {
  height?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showLine?: boolean;
  lineStyle?: "solid" | "dashed" | "dotted" | "gradient";
  lineColor?: string;
  lineWidth?: "thin" | "medium" | "thick";
  linePosition?: "top" | "center" | "bottom";
  maxWidth?: "full" | "container" | "narrow" | "xs";
  icon?: React.ReactNode;
  text?: string;
}

export function DividerBlock({
  height = "md",
  showLine = true,
  lineStyle = "solid",
  lineColor,
  lineWidth = "thin",
  linePosition = "center",
  maxWidth = "container",
  icon,
  text,
}: DividerBlockProps) {
  const heights = {
    xs: "py-4",
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
    "2xl": "py-32",
  };

  const widths = {
    full: "max-w-full",
    container: "max-w-4xl",
    narrow: "max-w-2xl",
    xs: "max-w-xs",
  };

  const lineWidths = {
    thin: "h-px",
    medium: "h-0.5",
    thick: "h-1",
  };

  const lineStyles = {
    solid: "border-0",
    dashed: "border-dashed border-t-0",
    dotted: "border-dotted border-t-0",
    gradient: "border-0",
  };

  const positions = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
  };

  const getLineBackground = () => {
    if (lineStyle === "gradient") {
      return "bg-gradient-to-r from-transparent via-border to-transparent";
    }
    return lineColor ? "" : "bg-border";
  };

  // If there's text or icon, render decorated divider
  if (text || icon) {
    return (
      <div className={cn("flex justify-center", heights[height])}>
        <div
          className={cn(
            "w-full flex items-center gap-4",
            widths[maxWidth],
            "px-4"
          )}
        >
          <div
            className={cn(
              "flex-1",
              lineWidths[lineWidth],
              getLineBackground(),
              lineStyles[lineStyle]
            )}
            style={lineColor ? { backgroundColor: lineColor } : undefined}
          />

          {(icon || text) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {icon}
              {text && <span className="text-sm font-medium">{text}</span>}
            </div>
          )}

          <div
            className={cn(
              "flex-1",
              lineWidths[lineWidth],
              getLineBackground(),
              lineStyles[lineStyle]
            )}
            style={lineColor ? { backgroundColor: lineColor } : undefined}
          />
        </div>
      </div>
    );
  }

  // Simple spacer (no line)
  if (!showLine) {
    return <div className={heights[height]} aria-hidden="true" />;
  }

  // Simple line divider
  return (
    <div
      className={cn(
        "flex justify-center",
        heights[height],
        positions[linePosition]
      )}
    >
      <div className={cn("w-full mx-auto px-4", widths[maxWidth])}>
        <div
          className={cn(
            "w-full",
            lineWidths[lineWidth],
            getLineBackground(),
            lineStyles[lineStyle]
          )}
          style={lineColor ? { backgroundColor: lineColor } : undefined}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// Alias for semantic usage
export const SpacerBlock = DividerBlock;
