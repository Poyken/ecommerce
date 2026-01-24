
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function DealEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Section Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Section title"
        />
      </div>
      <div className="space-y-2">
        <Label>Section Subtitle</Label>
        <Input
          value={block.props.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Section subtitle"
        />
      </div>
      <div className="space-y-4 pt-4 border-t">
        <BlockStyleControls
          styles={block.props.styles}
          onChange={(newStyles) => onChange({ styles: newStyles })}
        />
      </div>
    </div>
  );
}
