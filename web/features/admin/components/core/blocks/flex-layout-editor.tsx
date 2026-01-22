
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface FlexItem {
  id?: string;
  title: string;
  description: string;
  theme?: string;
  icon?: string;
  image?: string;
}

export function FlexLayoutEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Layout Settings
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Columns</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.layout || "1-1"}
              onChange={(e) => onChange({ layout: e.target.value })}
            >
              <option value="1">1 Column</option>
              <option value="1-1">1-1 (2 Cols)</option>
              <option value="1-2">1-2 (Wide Right)</option>
              <option value="2-1">2-1 (Wide Left)</option>
              <option value="1-1-1">1-1-1 (3 Cols)</option>
              <option value="1-1-1-1">1-1-1-1 (4 Cols)</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Gap</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.gap || "medium"}
              onChange={(e) => onChange({ gap: e.target.value })}
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Items
        </Label>
        <div className="space-y-4">
          {(block.props.items || []).map((item: FlexItem, idx: number) => (
            <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-dashed">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold">Item #{idx + 1}</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => {
                    const newItems = (block.props.items || []).filter(
                      (_: unknown, i: number) => i !== idx
                    );
                    onChange({ items: newItems });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

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
                placeholder="Title"
                className="h-8 text-xs font-bold"
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
                placeholder="Description"
                rows={2}
                className="text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Theme</Label>
                  <select
                    className="h-7 w-full rounded-md border border-input bg-transparent px-1 text-[10px]"
                    value={item.theme || "light"}
                    onChange={(e) => {
                      const newItems = [...(block.props.items || [])];
                      newItems[idx] = {
                        ...newItems[idx],
                        theme: e.target.value,
                      };
                      onChange({ items: newItems });
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="glass">Glass</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Icon (Lucide)</Label>
                  <Input
                    value={item.icon || ""}
                    onChange={(e) => {
                      const newItems = [...(block.props.items || [])];
                      newItems[idx] = {
                        ...newItems[idx],
                        icon: e.target.value,
                      };
                      onChange({ items: newItems });
                    }}
                    placeholder="Sparkles"
                    className="h-7 text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Image URL</Label>
                <Input
                  value={item.image || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      image: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder="/images/..."
                  className="h-7 text-[10px]"
                />
              </div>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed h-9"
            onClick={() => {
              const newItems = [
                ...(block.props.items || []),
                { title: "New Item", description: "Content goes here" },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Flex Item
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
