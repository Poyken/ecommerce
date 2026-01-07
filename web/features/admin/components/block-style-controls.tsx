/**
 * =====================================================================
 * BLOCK STYLE CONTROLS - BỘ ĐIỀU KHIỂN STYLE CHO CMS BLOCKS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này xuất hiện trong Sidebar của Page Builder khi chọn một Block.
 * Cho phép tùy chỉnh: Màu nền, Màu chữ, Padding, Margin, Bo góc, Hiệu ứng.
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface BlockStyleControlsProps {
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    marginTop?: string;
    marginBottom?: string;
    borderRadius?: string;
    animation?: string;
  };
  onChange: (newStyles: any) => void;
}

export function BlockStyleControls({
  styles,
  onChange,
}: BlockStyleControlsProps) {
  const updateStyle = (key: string, value: string | undefined) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 pt-6 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Advanced Design
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Colors */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase opacity-60">
            Bg Color
          </Label>
          <div className="relative">
            <Input
              value={styles?.backgroundColor || ""}
              onChange={(e) => updateStyle("backgroundColor", e.target.value)}
              className="h-8 text-xs pl-8"
              placeholder="#FFFFFF"
            />
            <Input
              type="color"
              value={styles?.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyle("backgroundColor", e.target.value)}
              className="absolute left-1 top-1 w-6 h-6 p-0 border-0 bg-transparent overflow-hidden rounded-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase opacity-60">
            Text Color
          </Label>
          <div className="relative">
            <Input
              value={styles?.textColor || ""}
              onChange={(e) => updateStyle("textColor", e.target.value)}
              className="h-8 text-xs pl-8"
              placeholder="#000000"
            />
            <Input
              type="color"
              value={styles?.textColor || "#000000"}
              onChange={(e) => updateStyle("textColor", e.target.value)}
              className="absolute left-1 top-1 w-6 h-6 p-0 border-0 bg-transparent overflow-hidden rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="space-y-3">
        <Label className="text-[10px] font-bold uppercase opacity-60">
          Vertical Spacing (px)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground">
              Padding Top
            </Label>
            <Input
              type="number"
              value={styles?.paddingTop?.replace("px", "") || ""}
              onChange={(e) => updateStyle("paddingTop", e.target.value + "px")}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground">
              Padding Bottom
            </Label>
            <Input
              type="number"
              value={styles?.paddingBottom?.replace("px", "") || ""}
              onChange={(e) =>
                updateStyle("paddingBottom", e.target.value + "px")
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Border & Effects */}
      <div className="space-y-3">
        <Label className="text-[10px] font-bold uppercase opacity-60">
          Effects
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground">
              Corner Radius
            </Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={styles?.borderRadius || ""}
              onChange={(e) => updateStyle("borderRadius", e.target.value)}
            >
              <option value="">None</option>
              <option value="0.5rem">Small</option>
              <option value="1rem">Medium</option>
              <option value="2rem">Large</option>
              <option value="100rem">Full</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground">
              Entrance Anim
            </Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={styles?.animation || ""}
              onChange={(e) => updateStyle("animation", e.target.value)}
            >
              <option value="">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="zoom-in">Zoom In</option>
            </select>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-[10px] opacity-50 hover:opacity-100"
        onClick={() => onChange({})}
      >
        Reset Styles
      </Button>
    </div>
  );
}
