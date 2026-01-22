
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function BannerEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Banner title"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Textarea
          value={block.props.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Banner subtitle"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={block.props.imageUrl || ""}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            value={block.props.ctaText || ""}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            placeholder="Button text"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Link</Label>
          <Input
            value={block.props.ctaLink || ""}
            onChange={(e) => onChange({ ctaLink: e.target.value })}
            placeholder="/deals"
          />
        </div>
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
