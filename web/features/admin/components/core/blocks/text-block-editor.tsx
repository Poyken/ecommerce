
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function TextBlockEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Section title"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={block.props.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter your content..."
          rows={6}
        />
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
