
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function VideoHeroEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Video Content
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Video URL (MP4)</Label>
          <Input
            value={block.props.videoUrl || ""}
            onChange={(e) => onChange({ videoUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Hero Title</Label>
          <Input
            value={block.props.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Subtitle</Label>
          <Textarea
            value={block.props.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            rows={3}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Visuals & Design
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Overlay Opacity</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={block.props.overlayOpacity ?? 0.5}
              onChange={(e) =>
                onChange({
                  overlayOpacity: parseFloat(e.target.value),
                })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Theme Style</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.theme || "luxury"}
              onChange={(e) => onChange({ theme: e.target.value })}
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Section Height</Label>
          <select
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
            value={block.props.height || "large"}
            onChange={(e) => onChange({ height: e.target.value })}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Fullscreen</option>
          </select>
        </div>
      </div>

      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
