
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function PromoBannerEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Promo Content</Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Title</Label>
          <Input
            value={block.props.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Midnight Edition"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Subtitle</Label>
          <Textarea
            value={block.props.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Exclusive drops..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Discount Text</Label>
          <Input
            value={block.props.discountText || ""}
            onChange={(e) => onChange({ discountText: e.target.value })}
            placeholder="70% OFF"
          />
        </div>
      </div>
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Digital Premium</Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Aurora Variant</Label>
          <select
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
            value={block.props.auroraVariant || "cinematic"}
            onChange={(e) => onChange({ auroraVariant: e.target.value })}
          >
            <option value="blue">Blue Aurora</option>
            <option value="purple">Purple Aurora</option>
            <option value="orange">Orange Aurora</option>
            <option value="cinematic">Cinematic Mix</option>
          </select>
        </div>
      </div>
      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
