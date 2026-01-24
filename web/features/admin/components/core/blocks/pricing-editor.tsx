
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface PricingItem {
  name: string;
  price: string;
  period: string;
  description: string;
  isPopular: boolean;
}

export function PricingEditor({ block, onChange }: BlockEditorProps) {
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
        <Label>Pricing Plans</Label>
        <div className="space-y-3">
          {(block.props.items || []).map((item: PricingItem, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/30">
              <Input
                value={item.name || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    name: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                placeholder="Plan Name (e.g. Pro)"
                className="text-sm font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={item.price || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      price: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder="Price (e.g. $29)"
                  className="text-sm"
                />
                <Input
                  value={item.period || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      period: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  placeholder="Period (e.g. /month)"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={item.isPopular || false}
                  onCheckedChange={(checked) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      isPopular: checked,
                    };
                    onChange({ items: newItems });
                  }}
                />
                <Label className="text-xs">Highlight as Popular</Label>
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
                {
                  name: "New Plan",
                  price: "$19",
                  period: "/mo",
                  isPopular: false,
                },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Pricing Plan
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
