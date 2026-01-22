
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function BrandsEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Content
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Section Title</Label>
          <Input
            value={block.props.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Our Trusted Partners"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Section Subtitle</Label>
          <Input
            value={block.props.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Collaborating with the world's finest artisans"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Visual & Style
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
            <Label className="text-[10px]">Grayscale</Label>
            <Switch
              checked={block.props.grayscale !== false}
              onCheckedChange={(checked) => onChange({ grayscale: checked })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">
              Opacity: {block.props.opacity || 1}
            </Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={block.props.opacity || 1}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Logo Size</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.logoSize || "md"}
              onChange={(e) => onChange({ logoSize: e.target.value })}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Hover Effect</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.hoverEffect || "lift"}
              onChange={(e) => onChange({ hoverEffect: e.target.value })}
            >
              <option value="scale">Scale</option>
              <option value="lift">Lift</option>
              <option value="glow">Glow</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Layout Style</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.layout || "grid"}
              onChange={(e) => onChange({ layout: e.target.value })}
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Alignment</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.alignment || "left"}
              onChange={(e) => onChange({ alignment: e.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
      </div>

      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
