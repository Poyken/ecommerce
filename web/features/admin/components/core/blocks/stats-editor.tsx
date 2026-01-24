
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface StatItem {
  label: string;
  value: string;
}

export function StatsEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Stat Items</Label>
        <div className="space-y-3">
          {(block.props.items || []).map((item: StatItem, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={item.label || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      label: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder="Label"
                  className="text-sm"
                />
                <Input
                  value={item.value || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      value: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder="Value (e.g. 10k+)"
                  className="text-sm"
                />
              </div>
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
                { label: "New Stat", value: "0", color: "primary" },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Stat Item
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
