
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function ProductsEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Product Filtering
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Filter Type</Label>
          <select
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
            value={block.props.filter || "trending"}
            onChange={(e) => onChange({ filter: e.target.value })}
          >
            <option value="trending">Trending Products</option>
            <option value="new">New Arrivals</option>
          </select>
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
