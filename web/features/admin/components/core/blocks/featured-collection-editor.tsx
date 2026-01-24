import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function FeaturedCollectionEditor({
  block,
  onChange,
}: BlockEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Collection Settings
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Collection Filter Name</Label>
          <Input
            value={block.props.collectionName || ""}
            onChange={(e) => onChange({ collectionName: e.target.value })}
            placeholder="Fall 2024"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Product Count</Label>
            <Input
              type="number"
              value={block.props.count || 4}
              onChange={(e) => onChange({ count: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Columns</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.columns || 4}
              onChange={(e) => onChange({ columns: parseInt(e.target.value) })}
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Card Aesthetic
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Card Style</Label>
          <div className="grid grid-cols-3 gap-1">
            {["default", "luxury", "glass"].map((s) => (
              <Button
                key={s}
                variant={block.props.cardStyle === s ? "default" : "outline"}
                size="sm"
                className="text-[9px] capitalize h-8"
                onClick={() => onChange({ cardStyle: s })}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
