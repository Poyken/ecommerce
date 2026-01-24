
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function CTASectionEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="CTA title"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Textarea
          value={block.props.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Supporting text"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={block.props.buttonText || ""}
            onChange={(e) => onChange({ buttonText: e.target.value })}
            placeholder="Get Started"
          />
        </div>
        <div className="space-y-2">
          <Label>Button Link</Label>
          <Input
            value={block.props.buttonLink || ""}
            onChange={(e) => onChange({ buttonLink: e.target.value })}
            placeholder="/signup"
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
