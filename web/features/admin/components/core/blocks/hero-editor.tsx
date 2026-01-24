import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { BlockEditorProps } from "./types";

export function HeroEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-6">
      {/* Layout Section */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Layout & Structure
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Layout Style</Label>
          <div className="grid grid-cols-4 gap-1">
            {["split", "center", "fullscreen", "minimal"].map((l) => (
              <Button
                key={l}
                variant={block.props.layout === l ? "default" : "outline"}
                size="sm"
                className="text-[9px] capitalize h-8"
                onClick={() => onChange({ layout: l })}
              >
                {l}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Height</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.height || "screen"}
              onChange={(e) => onChange({ height: e.target.value })}
            >
              <option value="auto">Auto</option>
              <option value="medium">Medium (50vh)</option>
              <option value="large">Large (80vh)</option>
              <option value="screen">Full Screen</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Content Width</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.contentWidth || "medium"}
              onChange={(e) =>
                onChange({
                  contentWidth: e.target.value,
                })
              }
            >
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Content
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Badge Text</Label>
          <Input
            value={block.props.badge || ""}
            onChange={(e) => onChange({ badge: e.target.value })}
            placeholder="New Collection"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Title</Label>
          <Textarea
            value={block.props.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter hero title"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Subtitle</Label>
          <Textarea
            value={block.props.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Enter hero subtitle"
            rows={3}
          />
        </div>
      </div>

      {/* Typography Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Typography
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Title Size</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.titleSize || "xlarge"}
              onChange={(e) => onChange({ titleSize: e.target.value })}
            >
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">X-Large</option>
              <option value="xxlarge">XX-Large</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Title Font</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.titleFont || "serif"}
              onChange={(e) => onChange({ titleFont: e.target.value })}
            >
              <option value="serif">Serif (Elegant)</option>
              <option value="sans">Sans (Modern)</option>
              <option value="display">Display (Bold)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Call to Action
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Primary CTA Text</Label>
            <Input
              value={block.props.ctaText || ""}
              onChange={(e) => onChange({ ctaText: e.target.value })}
              placeholder="Shop Now"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Primary CTA Link</Label>
            <Input
              value={block.props.ctaLink || ""}
              onChange={(e) => onChange({ ctaLink: e.target.value })}
              placeholder="/shop"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Secondary CTA Text</Label>
            <Input
              value={block.props.secondaryCtaText || ""}
              onChange={(e) =>
                onChange({
                  secondaryCtaText: e.target.value,
                })
              }
              placeholder="Learn More"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Secondary CTA Link</Label>
            <Input
              value={block.props.secondaryCtaLink || ""}
              onChange={(e) =>
                onChange({
                  secondaryCtaLink: e.target.value,
                })
              }
              placeholder="/about"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">CTA Style</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.ctaStyle || "solid"}
              onChange={(e) => onChange({ ctaStyle: e.target.value })}
            >
              <option value="solid">Solid</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">CTA Corners</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.ctaRounded || "full"}
              onChange={(e) => onChange({ ctaRounded: e.target.value })}
            >
              <option value="none">Square</option>
              <option value="sm">Slightly Rounded</option>
              <option value="md">Rounded</option>
              <option value="lg">More Rounded</option>
              <option value="full">Pill</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Visual & Background
        </Label>
        <div className="space-y-2">
          <Label className="text-[10px]">Background Image URL</Label>
          <Input
            value={block.props.bgImage || ""}
            onChange={(e) => onChange({ bgImage: e.target.value })}
            placeholder="/images/hero.jpg"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">
            Background Video URL (Optional)
          </Label>
          <Input
            value={block.props.bgVideo || ""}
            onChange={(e) => onChange({ bgVideo: e.target.value })}
            placeholder="/videos/hero.mp4"
            className="h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Overlay Type</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.overlayType || "none"}
              onChange={(e) =>
                onChange({
                  overlayType: e.target.value,
                })
              }
            >
              <option value="none">None</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="gradient">Gradient</option>
              <option value="radial">Radial</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Overlay Opacity</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={block.props.overlayOpacity ?? 0}
              onChange={(e) =>
                onChange({
                  overlayOpacity: parseFloat(e.target.value),
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Animation Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Animation
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px]">Animation Type</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              value={block.props.animationType || "fade"}
              onChange={(e) =>
                onChange({
                  animationType: e.target.value,
                })
              }
            >
              <option value="none">None</option>
              <option value="fade">Fade In</option>
              <option value="slide">Slide Up</option>
              <option value="zoom">Zoom In</option>
              <option value="parallax">Parallax</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Animation Delay (s)</Label>
            <Input
              type="number"
              min="0"
              max="3"
              step="0.1"
              value={block.props.animationDelay ?? 0}
              onChange={(e) =>
                onChange({
                  animationDelay: parseFloat(e.target.value),
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Featured Card (for split layout) */}
      {(block.props.layout === "split" || !block.props.layout) && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Featured Card
            </Label>
            <Switch
              checked={block.props.showFeaturedCard !== false}
              onCheckedChange={(checked) =>
                onChange({ showFeaturedCard: checked })
              }
            />
          </div>
          {block.props.showFeaturedCard !== false && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Featured Title</Label>
                  <Input
                    value={block.props.featuredTitle || ""}
                    onChange={(e) =>
                      onChange({
                        featuredTitle: e.target.value,
                      })
                    }
                    placeholder="Silk Evening Dress"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Featured Price</Label>
                  <Input
                    value={block.props.featuredPrice || ""}
                    onChange={(e) =>
                      onChange({
                        featuredPrice: e.target.value,
                      })
                    }
                    placeholder="$1,299"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Featured Image URL</Label>
                <Input
                  value={block.props.featuredImage || ""}
                  onChange={(e) =>
                    onChange({
                      featuredImage: e.target.value,
                    })
                  }
                  placeholder="/images/product.jpg"
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Features */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            Bottom Features Bar
          </Label>
          <Switch
            checked={block.props.showBottomFeatures !== false}
            onCheckedChange={(checked) =>
              onChange({ showBottomFeatures: checked })
            }
          />
        </div>
      </div>

      <BlockStyleControls
        styles={block.props.styles}
        onChange={(newStyles) => onChange({ styles: newStyles })}
      />
    </div>
  );
}
