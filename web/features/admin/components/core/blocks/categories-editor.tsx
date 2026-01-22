
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function CategoriesEditor({ block, onChange }: BlockEditorProps) {
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
            placeholder="Featured Categories"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Section Subtitle</Label>
          <Textarea
            value={block.props.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Curated collections for every style"
            rows={2}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Layout & Style
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Grid Columns</Label>
          <div className="grid grid-cols-5 gap-1">
            {[2, 3, 4, 5, 6].map((c) => (
              <Button
                key={c}
                variant={block.props.columns === c ? "default" : "outline"}
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => onChange({ columns: c })}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Layout Mode</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.layout || "grid"}
              onChange={(e) => onChange({ layout: e.target.value })}
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="masonry">Masonry</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Card Style</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.cardStyle || "default"}
              onChange={(e) => onChange({ cardStyle: e.target.value })}
            >
              <option value="default">Default</option>
              <option value="luxury">Luxury</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Alignment</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.alignment || "left"}
              onChange={(e) => onChange({ alignment: e.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Animation</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.animationType || "fade"}
              onChange={(e) => onChange({ animationType: e.target.value })}
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="zoom">Zoom</option>
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
