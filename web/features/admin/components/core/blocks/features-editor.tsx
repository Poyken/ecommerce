
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface FeatureItem {
  title: string;
  description: string;
}

export function FeaturesEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Section Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Features section title"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtitle (Small text above title)</Label>
        <Input
          value={block.props.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Why Choose Us"
        />
      </div>
      <div className="space-y-2">
        <Label>Feature Items</Label>
        <div className="space-y-3">
          {(block.props.items || []).map((item: FeatureItem, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/30">
              <Input
                value={item.title || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    title: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                placeholder="Feature title"
                className="text-sm font-bold"
              />
              <Textarea
                value={item.description || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    description: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                placeholder="Feature description"
                rows={2}
                className="text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const newItems = (block.props.items || []).filter(
                    (_: unknown, i: number) => i !== idx
                  );
                  onChange({ items: newItems });
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => {
              const newItems = [
                ...(block.props.items || []),
                { title: "New Feature", description: "Description here" },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Feature Item
          </Button>
        </div>
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
