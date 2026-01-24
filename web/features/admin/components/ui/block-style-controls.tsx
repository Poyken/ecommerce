 
/**
 * =====================================================================
 * BLOCK STYLE CONTROLS - BỘ ĐIỀU KHIỂN STYLE CHO CMS BLOCKS
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Maximize2, BoxSelect, Layers, Sparkles, Zap } from "lucide-react";

interface BlockStyleControlsProps {
  styles?: {
    backgroundColor?: string;
    textColor?: string;

    // Spacing
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;

    // Dimensions
    width?: string;
    height?: string;
    maxWidth?: string;
    minHeight?: string;

    // Flexbox
    display?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    flexWrap?: string;
    gap?: string;

    // Border
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;

    // Effects
    boxShadow?: string;
    opacity?: string;
    animation?: string;

    // Advanced Position
    position?: string;
    zIndex?: string;
    overflow?: string;

    // Digital Premium
    auroraPreset?: string;
    glassPreset?: string;
    glowIntensity?: string;

    // Motion
    hoverEffect?: string;
    animationDuration?: string;
    animationDelay?: string;
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

      <div className="space-y-4">
        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase opacity-60">Bg Color</Label>
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
            <Label className="text-[10px] uppercase opacity-60">
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

        {/* Digital Premium Effects */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Digital Premium Effects
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Aurora Preset</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.auroraPreset || "none"}
                onChange={(e) => updateStyle("auroraPreset", e.target.value)}
              >
                <option value="none">None</option>
                <option value="blue">Aurora Blue</option>
                <option value="purple">Aurora Purple</option>
                <option value="orange">Aurora Orange</option>
                <option value="cinematic">Cinematic Mix</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Glass Preset</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.glassPreset || "none"}
                onChange={(e) => updateStyle("glassPreset", e.target.value)}
              >
                <option value="none">None</option>
                <option value="frosted">Frosted Glass</option>
                <option value="premium">Premium Glass</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="flex justify-between items-center">
                <Label className="text-[9px] text-muted-foreground">Glow Intensity</Label>
                <span className="text-[9px] font-mono">{styles?.glowIntensity || 0}%</span>
              </div>
              <Input
                type="range"
                min="0"
                max="100"
                value={styles?.glowIntensity || "0"}
                onChange={(e) => updateStyle("glowIntensity", e.target.value)}
                className="h-4 accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Layout Mode */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
            <Maximize2 className="w-3 h-3" /> Layout Mode
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Display
              </Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.display || "block"}
                onChange={(e) => updateStyle("display", e.target.value)}
              >
                <option value="block">Block</option>
                <option value="flex">Flexbox</option>
                <option value="grid">Grid (Simple)</option>
                <option value="inline-block">Inline Block</option>
                <option value="none">None (Hidden)</option>
              </select>
            </div>
            {styles?.display === "flex" && (
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">
                  Direction
                </Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.flexDirection || "row"}
                  onChange={(e) => updateStyle("flexDirection", e.target.value)}
                >
                  <option value="row">Row (Horizontal)</option>
                  <option value="column">Column (Vertical)</option>
                  <option value="row-reverse">Row Reverse</option>
                  <option value="column-reverse">Col Reverse</option>
                </select>
              </div>
            )}
          </div>

          {styles?.display === "flex" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">
                  Justify
                </Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.justifyContent || "flex-start"}
                  onChange={(e) =>
                    updateStyle("justifyContent", e.target.value)
                  }
                >
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                  <option value="space-evenly">Space Evenly</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">
                  Align Items
                </Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.alignItems || "stretch"}
                  onChange={(e) => updateStyle("alignItems", e.target.value)}
                >
                  <option value="stretch">Stretch</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="baseline">Baseline</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Wrap</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.flexWrap || "nowrap"}
                  onChange={(e) => updateStyle("flexWrap", e.target.value)}
                >
                  <option value="nowrap">No Wrap</option>
                  <option value="wrap">Wrap</option>
                  <option value="wrap-reverse">Wrap Reverse</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">
                  Gap (px/rem)
                </Label>
                <Input
                  value={styles?.gap || ""}
                  onChange={(e) => updateStyle("gap", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="1rem"
                />
              </div>
            </div>
          )}
        </div>

        {/* Dimensions */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase opacity-60">
            Dimensions
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Width</Label>
              <Input
                value={styles?.width || ""}
                onChange={(e) => updateStyle("width", e.target.value)}
                className="h-8 text-xs"
                placeholder="100%"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Max Width
              </Label>
              <Input
                value={styles?.maxWidth || ""}
                onChange={(e) => updateStyle("maxWidth", e.target.value)}
                className="h-8 text-xs"
                placeholder="1200px"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Height</Label>
              <Input
                value={styles?.height || ""}
                onChange={(e) => updateStyle("height", e.target.value)}
                className="h-8 text-xs"
                placeholder="auto"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Min Height
              </Label>
              <Input
                value={styles?.minHeight || ""}
                onChange={(e) => updateStyle("minHeight", e.target.value)}
                className="h-8 text-xs"
                placeholder="0px"
              />
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase opacity-60">
            Spacing (Padding/Margin)
          </Label>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="col-start-2">
              <Input
                className="h-7 text-[10px] text-center px-1"
                placeholder="MT"
                title="Margin Top"
                value={styles?.marginTop?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "marginTop",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>
            <div className="col-start-2 place-self-end w-full">
              <Input
                className="h-7 text-[10px] text-center px-1 border-b-0 rounded-b-none bg-muted/20"
                placeholder="PT"
                title="Padding Top"
                value={styles?.paddingTop?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "paddingTop",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1 flex flex-col gap-1 text-center">
              <Input
                className="h-7 text-[10px] text-center px-1"
                placeholder="ML"
                title="Margin Left"
                value={styles?.marginLeft?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "marginLeft",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
              <Input
                className="h-7 text-[10px] text-center px-1 border-r-0 rounded-r-none bg-muted/20"
                placeholder="PL"
                title="Padding Left"
                value={styles?.paddingLeft?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "paddingLeft",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>

            <div className="col-span-2 bg-muted/10 border border-dashed rounded flex items-center justify-center text-[10px] text-muted-foreground">
              Content
            </div>

            <div className="col-span-1 flex flex-col gap-1 text-center">
              <Input
                className="h-7 text-[10px] text-center px-1"
                placeholder="MR"
                title="Margin Right"
                value={styles?.marginRight?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "marginRight",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
              <Input
                className="h-7 text-[10px] text-center px-1 border-l-0 rounded-l-none bg-muted/20"
                placeholder="PR"
                title="Padding Right"
                value={styles?.paddingRight?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "paddingRight",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="col-start-2 w-full">
              <Input
                className="h-7 text-[10px] text-center px-1 border-t-0 rounded-t-none bg-muted/20"
                placeholder="PB"
                title="Padding Bottom"
                value={styles?.paddingBottom?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "paddingBottom",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>
            <div className="col-start-2 place-self-start w-full">
              <Input
                className="h-7 text-[10px] text-center px-1"
                placeholder="MB"
                title="Margin Bottom"
                value={styles?.marginBottom?.replace("px", "") || ""}
                onChange={(e) =>
                  updateStyle(
                    "marginBottom",
                    e.target.value ? e.target.value + "px" : undefined
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Borders */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
            <BoxSelect className="w-3 h-3" /> Borders
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Width</Label>
              <Input
                value={styles?.borderWidth || ""}
                onChange={(e) => updateStyle("borderWidth", e.target.value)}
                className="h-8 text-xs"
                placeholder="0px"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">Style</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.borderStyle || "solid"}
                onChange={(e) => updateStyle("borderStyle", e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[9px] text-muted-foreground">Color</Label>
              <div className="relative">
                <Input
                  value={styles?.borderColor || ""}
                  onChange={(e) => updateStyle("borderColor", e.target.value)}
                  className="h-8 text-xs pl-8"
                  placeholder="transparent"
                />
                <Input
                  type="color"
                  value={styles?.borderColor || "#000000"}
                  onChange={(e) => updateStyle("borderColor", e.target.value)}
                  className="absolute left-1 top-1 w-6 h-6 p-0 border-0 bg-transparent overflow-hidden rounded-full"
                />
              </div>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[9px] text-muted-foreground">Radius</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.borderRadius || ""}
                onChange={(e) => updateStyle("borderRadius", e.target.value)}
              >
                <option value="">None</option>
                <option value="2px">XS (2px)</option>
                <option value="0.25rem">Small (4px)</option>
                <option value="0.5rem">Medium (8px)</option>
                <option value="1rem">Large (16px)</option>
                <option value="2rem">XL (32px)</option>
                <option value="9999px">Full (Circle/Pill)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Effects & Advanced */}
        <div className="space-y-3 pt-2 border-t border-dashed">
          <Label className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Effects & Misc
          </Label>
          <div className="space-y-2">
            <Label className="text-[9px] text-muted-foreground">
              Box Shadow
            </Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={styles?.boxShadow || "none"}
              onChange={(e) => updateStyle("boxShadow", e.target.value)}
            >
              <option value="none">None</option>
              <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Subtle (sm)</option>
              <option value="0 4px 6px -1px rgb(0 0 0 / 0.1)">
                Medium (md)
              </option>
              <option value="0 10px 15px -3px rgb(0 0 0 / 0.1)">
                Large (lg)
              </option>
              <option value="0 20px 25px -5px rgb(0 0 0 / 0.1)">
                X-Large (xl)
              </option>
              <option value="0 25px 50px -12px rgb(0 0 0 / 0.25)">
                2X-Large (2xl)
              </option>
              <option value="inset 0 2px 4px 0 rgb(0 0 0 / 0.05)">
                Inner Shadow
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Opacity
              </Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={styles?.opacity ?? ""}
                onChange={(e) => updateStyle("opacity", e.target.value)}
                className="h-8 text-xs"
                placeholder="1.0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Overflow
              </Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.overflow || "visible"}
                onChange={(e) => updateStyle("overflow", e.target.value)}
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Z-Index
              </Label>
              <Input
                type="number"
                value={styles?.zIndex || ""}
                onChange={(e) => updateStyle("zIndex", e.target.value)}
                className="h-8 text-xs"
                placeholder="auto"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] text-muted-foreground">
                Position
              </Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                value={styles?.position || "static"}
                onChange={(e) => updateStyle("position", e.target.value)}
              >
                <option value="static">Static</option>
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
                <option value="sticky">Sticky</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>

          {/* Motion & Interaction */}
          <div className="space-y-3 pt-2 border-t border-dashed">
            <Label className="text-[10px] font-bold uppercase text-orange-500 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Motion & Interaction
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Entrance Preset</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.animation || ""}
                  onChange={(e) => updateStyle("animation", e.target.value)}
                >
                  <option value="">None</option>
                  <option value="fade-in">Fade In</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="slide-right">Slide Right</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="bounce">Bounce</option>
                  <option value="float">Floating</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Hover Effect</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={styles?.hoverEffect || "none"}
                  onChange={(e) => updateStyle("hoverEffect", e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="lift">Lift Up</option>
                  <option value="scale">Scale Up</option>
                  <option value="glow">Inner Glow</option>
                  <option value="shine">Shine Highlight</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Duration (s)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={styles?.animationDuration || "0.5"}
                  onChange={(e) => updateStyle("animationDuration", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Delay (s)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={styles?.animationDelay || "0"}
                  onChange={(e) => updateStyle("animationDelay", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] opacity-50 hover:opacity-100 mt-2"
          onClick={() => onChange({})}
        >
          Reset Styles
        </Button>
      </div>
    </div>
  );
}
