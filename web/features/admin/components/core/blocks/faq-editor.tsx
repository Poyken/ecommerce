
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Section Title</Label>
        <Input
          value={block.props.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Section Subtitle</Label>
        <Input
          value={block.props.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>FAQ Items</Label>
        <div className="space-y-3">
          {(block.props.items || []).map((item: FaqItem, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/30">
              <Input
                value={item.question || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    question: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                placeholder="Question"
                className="text-sm"
              />
              <Textarea
                value={item.answer || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    answer: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                placeholder="Answer"
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
                { question: "New Question", answer: "New Answer" },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add FAQ Item
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
