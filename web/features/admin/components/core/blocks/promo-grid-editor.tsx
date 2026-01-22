
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { Plus } from "lucide-react";
import { BlockEditorProps } from "./types";

interface PromoItem {
  tag: string;
  buttonText: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

export function PromoGridEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <Label>Promo Items (Max 2)</Label>
      <div className="space-y-4">
        {(block.props.items || []).map((item: PromoItem, idx: number) => (
          <Card key={idx} className="p-4 space-y-3 bg-muted/30 border-dashed">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase opacity-60">Tag</Label>
                <Input
                  value={item.tag || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      tag: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  className="h-8 text-xs"
                  placeholder="Exclusive"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase opacity-60">
                  Button Text
                </Label>
                <Input
                  value={item.buttonText || ""}
                  onChange={(e) => {
                    const newItems = [...(block.props.items || [])];
                    newItems[idx] = {
                      ...newItems[idx],
                      buttonText: e.target.value,
                    };
                    onChange({ items: newItems });
                  }}
                  className="h-8 text-xs"
                  placeholder="Shop Now"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase opacity-60">Title</Label>
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
                className="h-9 font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase opacity-60">
                Subtitle
              </Label>
              <Textarea
                value={item.subtitle || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    subtitle: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                className="h-16 text-sm"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase opacity-60">
                Image URL
              </Label>
              <Input
                value={item.imageUrl || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    imageUrl: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase opacity-60">Link</Label>
              <Input
                value={item.link || ""}
                onChange={(e) => {
                  const newItems = [...(block.props.items || [])];
                  newItems[idx] = {
                    ...newItems[idx],
                    link: e.target.value,
                  };
                  onChange({ items: newItems });
                }}
                className="h-8 text-xs"
              />
            </div>
          </Card>
        ))}

        {(block.props.items || []).length < 2 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => {
              const newItems = [
                ...(block.props.items || []),
                {
                  tag: "New",
                  title: "Promo Title",
                  subtitle: "Details here",
                  link: "/shop",
                  imageUrl: "/images/home/promo-living.jpg",
                  buttonText: "Discover",
                },
              ];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Promo Item
          </Button>
        )}
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
