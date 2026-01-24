
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FlexibleIcon } from "@/components/shared/flexible-icon";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface NavLink {
  label: string;
  href: string;
  icon?: string;
}

interface UtilityItem {
  icon: string;
  label: string;
  href: string;
}

export function HeaderEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      {/* Design Settings */}
      <div className="space-y-4 pt-2 pb-4 border-b">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Design
        </Label>

        {/* Transparency Toggle */}
        <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="text-[10px] uppercase font-bold opacity-70">
              Transparent
            </Label>
            <p className="text-[9px] text-muted-foreground leading-tight">
              No background initially
            </p>
          </div>
          <Switch
            checked={
              block.props.styles?.transparent !== undefined
                ? block.props.styles.transparent
                : block.props.transparent || false
            }
            onCheckedChange={(checked) => {
              // Update legacy and new style prop for compatibility
              onChange({
                transparent: checked,
                styles: { ...block.props.styles, transparent: checked },
              });
            }}
          />
        </div>

        <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="text-[10px] uppercase font-bold opacity-70">
              Full Width
            </Label>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Edge-to-edge layout
            </p>
          </div>
          <Switch
            checked={block.props.fullWidth || false}
            onCheckedChange={(checked) => onChange({ fullWidth: checked })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold">Header Height (px)</Label>
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            value={block.props.customHeight || 80}
            onChange={(e) =>
              onChange({
                customHeight: parseInt(e.target.value) || 80,
              })
            }
            className="w-24 h-9"
          />
          <div className="flex gap-2">
            {[64, 80, 100].map((h) => (
              <Button
                key={h}
                variant={
                  (block.props.customHeight || 80) === h ? "default" : "outline"
                }
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => onChange({ customHeight: h })}
              >
                {h}px
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold">Nav Alignment</Label>
        <div className="grid grid-cols-3 gap-2">
          {["left", "center", "right"].map((a) => (
            <Button
              key={a}
              variant={
                (block.props.alignment || "right") === a ? "default" : "outline"
              }
              size="sm"
              className="text-[10px] capitalize h-8"
              onClick={() => onChange({ alignment: a })}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t mt-4">
        <Label className="text-[10px] uppercase font-bold opacity-50">
          Utilities (Search, Cart, etc.)
        </Label>
        <div className="space-y-3">
          {(block.props.utils || []).map((util: UtilityItem, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/20 border-dashed">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px]">Lucide Icon Name</Label>
                    <a
                      href="https://lucide.dev/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-blue-500 hover:underline"
                    >
                      Browse Icons ↗
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      value={util.icon || ""}
                      onChange={(e) => {
                        const newUtils = [...(block.props.utils || [])];
                        newUtils[idx] = {
                          ...newUtils[idx],
                          icon: e.target.value,
                        };
                        onChange({ utils: newUtils });
                      }}
                      placeholder="Search, User, ShoppingCart..."
                      className="h-8 text-xs pr-8"
                    />
                    <div className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center p-1 pointer-events-none opacity-50">
                      <FlexibleIcon
                        source={util.icon}
                        size={14}
                        className="text-foreground"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Label</Label>
                  <Input
                    value={util.label || ""}
                    onChange={(e) => {
                      const newUtils = [...(block.props.utils || [])];
                      newUtils[idx] = {
                        ...newUtils[idx],
                        label: e.target.value,
                      };
                      onChange({ utils: newUtils });
                    }}
                    placeholder="Search"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={util.href || ""}
                  onChange={(e) => {
                    const newUtils = [...(block.props.utils || [])];
                    newUtils[idx] = {
                      ...newUtils[idx],
                      href: e.target.value,
                    };
                    onChange({ utils: newUtils });
                  }}
                  placeholder="/cart"
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    const newUtils = (block.props.utils || []).filter(
                      (_: unknown, i: number) => i !== idx
                    );
                    onChange({ utils: newUtils });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed h-8 text-[11px]"
            onClick={() => {
              const newUtils = [
                ...(block.props.utils || []),
                { icon: "Search", label: "Search", href: "/search" },
              ];
              onChange({ utils: newUtils });
            }}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Utility
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Navigation Links</Label>
        <div className="space-y-3">
          {(block.props.links || []).map((link: NavLink, idx: number) => (
            <Card key={idx} className="p-3 space-y-2 bg-muted/30">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={link.label || ""}
                    onChange={(e) => {
                      const newLinks = [...(block.props.links || [])];
                      newLinks[idx] = {
                        ...newLinks[idx],
                        label: e.target.value,
                      };
                      onChange({ links: newLinks });
                    }}
                    placeholder="Label"
                    className="text-sm h-8"
                  />
                  <Input
                    value={link.href || ""}
                    onChange={(e) => {
                      const newLinks = [...(block.props.links || [])];
                      newLinks[idx] = {
                        ...newLinks[idx],
                        href: e.target.value,
                      };
                      onChange({ links: newLinks });
                    }}
                    placeholder="URL"
                    className="text-sm h-8"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px]">
                      Icon (Lucide Name or Image URL)
                    </Label>
                    <a
                      href="https://lucide.dev/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-blue-500 hover:underline"
                    >
                      Browse Icons ↗
                    </a>
                  </div>
                  <div className="flex gap-2 relative">
                    <div className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center p-1 pointer-events-none opacity-50">
                      <FlexibleIcon
                        source={link.icon}
                        size={14}
                        className="text-foreground"
                      />
                    </div>
                    <Input
                      value={link.icon || ""}
                      onChange={(e) => {
                        const newLinks = [...(block.props.links || [])];
                        newLinks[idx] = {
                          ...newLinks[idx],
                          icon: e.target.value,
                        };
                        onChange({ links: newLinks });
                      }}
                      placeholder="e.g. Home, User, or https://..."
                      className="text-xs h-8 flex-1 pr-8"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const newLinks = (block.props.links || []).filter(
                    (_: unknown, i: number) => i !== idx
                  );
                  onChange({ links: newLinks });
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => {
              const newLinks = [
                ...(block.props.links || []),
                { label: "New Link", href: "/" },
              ];
              onChange({ links: newLinks });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
          </Button>
        </div>
      </div>
    </div>
  );
}
