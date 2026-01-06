import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface BlockStyleControlsProps {
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
  onChange: (newStyles: {
    backgroundColor?: string;
    textColor?: string;
  }) => void;
}

/**
 * =================================================================================================
 * BLOCK STYLE CONTROLS - TUỲ CHỈNH GIAO DIỆN KHỐI
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PROP DRILLING & STATE LIFTING:
 *    - Component này không tự giữ State.
 *    - Nó nhận `styles` và hàm `onChange` từ cha (`PageBuilder`).
 *    - Khi User đổi màu, nó gọi `onChange` -> Cha cập nhật State -> Re-render lại Component này.
 *
 * 2. DATA STRUCTURE:
 *    - `styles` là một JSON object lưu trong cột `json` của bảng `Block` (DB).
 *    - Vì vậy, ta cần cập nhật theo kiểu Immutability: `onChange({ ...oldStyles, [key]: value })`.
 * =================================================================================================
 */
export function BlockStyleControls({
  styles,
  onChange,
}: BlockStyleControlsProps) {
  const updateStyle = (
    key: "backgroundColor" | "textColor",
    value: string | undefined
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <Label className="text-xs font-bold uppercase text-muted-foreground">
        Design
      </Label>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold">Background Color</Label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={styles?.backgroundColor || ""}
              onChange={(e) => updateStyle("backgroundColor", e.target.value)}
              placeholder="Transparent"
              className="h-8 text-xs font-mono pl-8"
            />
            <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
              <Input
                type="color"
                value={styles?.backgroundColor || "#ffffff"}
                onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
              />
            </div>
            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
              <div
                className="w-4 h-4 rounded-full border shadow-sm"
                style={{
                  backgroundColor: styles?.backgroundColor || "#ffffff",
                }}
              />
            </div>
            {styles?.backgroundColor && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                onClick={() => updateStyle("backgroundColor", undefined)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold">Text Color</Label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={styles?.textColor || ""}
              onChange={(e) => updateStyle("textColor", e.target.value)}
              placeholder="Inherit"
              className="h-8 text-xs font-mono pl-8"
            />
            <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
              <Input
                type="color"
                value={styles?.textColor || "#000000"}
                onChange={(e) => updateStyle("textColor", e.target.value)}
                className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
              />
            </div>
            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
              <div
                className="w-4 h-4 rounded-full border shadow-sm"
                style={{ backgroundColor: styles?.textColor || "#000000" }}
              />
            </div>
            {styles?.textColor && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                onClick={() => updateStyle("textColor", undefined)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
