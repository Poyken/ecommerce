"use client";

import { BlockRenderer } from "@/features/cms/components/block-renderer";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deletePageAction, updatePageAction } from "@/features/admin/actions";
import {
  AddBlockDialog,
  AVAILABLE_BLOCKS,
  BlockType,
} from "@/features/admin/components/content/add-block-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { PageSettingsSheet } from "@/features/admin/components/page-settings-sheet";
import { Footer } from "@/features/layout/components/footer";
import { Header } from "@/features/layout/components/header";
import { LayoutVisibilityProvider } from "@/features/layout/providers/layout-visibility-provider";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Monitor,
  Plus,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { v4 as uuidv4 } from "uuid";

import { BlockStyleControls } from "@/features/admin/components/ui/block-style-controls";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.js";
import Image from "next/image";

/**
 * =================================================================================================
 * PAGE BUILDER CLIENT - TRÌNH KÉO THẢ VÀ CHỈNH SỬA TRANG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MÔ HÌNH DỮ LIỆU (DATA MODEL):
 *    - Một `Page` được cấu tạo từ một mảng các `Blocks` (Khối).
 *    - Mỗi Block có: `type` (Loại: Hero, Banner...) và `props` (Dữ liệu: Text, Image URL...).
 *    - Toàn bộ nội dung trang được lưu dưới dạng JSON trong Database.
 *
 * 2. CƠ CHẾ HOẠT ĐỘNG (CLIENT-SIDE STATE):
 *    - Chúng ta dùng `useState` để quản lý danh sách Blocks ngay tại trình duyệt.
 *    - Khi User chỉnh sửa (gõ text, đổi ảnh), ta cập nhật state `blocks`.
 *    - CHÚ Ý: Dữ liệu CHƯA được lưu vào DB cho đến khi bấm nút "Save Changes".
 *
 * 3. RENDER LOGIC:
 *    - Bên trái (hoặc giữa): Preview (Hiển thị trang web như user thấy). Dùng `BlockRenderer`.
 *    - Bên phải (Sidebar): Editor (Form chỉnh sửa). Khi click vào block nào, form tương ứng hiện ra.
 *
 * 4. OPTIMIZATION:
 *    - Sử dụng `useTransition` khi Save để không làm đơ UI.
 *    - Tách biệt `BlockStyleControls` để tái sử dụng logic chỉnh màu/padding. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).
 * =================================================================================================
 */

interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
}

const FlexibleIcon = ({
  source,
  size = 18,
  className,
}: {
  source?: string;
  size?: number;
  className?: string;
}) => {
  if (!source) return null;

  // Check if source is a URL (contains / or .)
  if (source.includes("/") || source.includes(".")) {
    return (
      <div
        className={cn("relative overflow-hidden", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={source}
          alt="icon"
          fill
          className="object-contain"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  // Otherwise assume Lucide Icon Name
  const iconName = source.toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  if (iconName in dynamicIconImports) {
    return <DynamicIcon name={iconName as keyof typeof dynamicIconImports} size={size} className={className} />;
  }
  
  return null;
};

interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  isPublished: boolean;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PageBuilderClientProps {
  page: Page;
}

type PreviewDevice = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PageBuilderClient({
  page: initialPage,
}: PageBuilderClientProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialPage.blocks || []);
  const [page, setPage] = useState<Page>(initialPage);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const router = useRouter();
  const { toast } = useToast();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePageAction(page.id, {
        blocks,
        title: page.title,
        slug: page.slug,
        isPublished: page.isPublished,
      });
      if (res.success) {
        toast({
          title: "Page saved",
          description: "Your changes have been saved successfully.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to save page",
          variant: "destructive",
        });
      }
    });
  };

  const handleSettingsSave = (data: Partial<Page>) => {
    setPage({ ...page, ...data });
    setIsSettingsOpen(false);
    toast({
      title: "Settings updated",
      description: "Remember to save to apply changes.",
    });
  };

  const handleDelete = async (): Promise<{
    success?: boolean;
    error?: string;
  }> => {
    const res = await deletePageAction(page.id);
    if (res.success) {
      router.push("/admin/pages");
      return { success: true };
    } else {
      return { error: res.error || "Failed to delete page" };
    }
  };

  const handleAddBlock = (blockType: BlockType) => {
    const newBlock: Block = {
      id: uuidv4(),
      type: blockType.type,
      props: { ...blockType.defaultProps },
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast({
      title: "Block added",
      description: `${blockType.label} has been added to your page.`,
    });
  };

  const updateBlockProps = (id: string, newProps: Record<string, any>) => {
    setBlocks(
      blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...newProps } } : b
      )
    );
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    toast({
      title: "Block removed",
      description: "The block has been removed from your page.",
    });
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    )
      return;

    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];
    setBlocks(newBlocks);
  };

  const getBlockTypeInfo = (type: string) => {
    return AVAILABLE_BLOCKS.find((b) => b.type === type);
  };

  const renderBlockEditor = (block: Block) => {
    switch (block.type) {
      case "Hero":
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
                      onClick={() => updateBlockProps(block.id, { layout: l })}
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { height: e.target.value })
                    }
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
                      updateBlockProps(block.id, {
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
                  onChange={(e) =>
                    updateBlockProps(block.id, { badge: e.target.value })
                  }
                  placeholder="New Collection"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Title</Label>
                <Textarea
                  value={block.props.title || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { title: e.target.value })
                  }
                  placeholder="Enter hero title"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Subtitle</Label>
                <Textarea
                  value={block.props.subtitle || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { subtitle: e.target.value })
                  }
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { titleSize: e.target.value })
                    }
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { titleFont: e.target.value })
                    }
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { ctaText: e.target.value })
                    }
                    placeholder="Shop Now"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Primary CTA Link</Label>
                  <Input
                    value={block.props.ctaLink || ""}
                    onChange={(e) =>
                      updateBlockProps(block.id, { ctaLink: e.target.value })
                    }
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
                      updateBlockProps(block.id, {
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
                      updateBlockProps(block.id, {
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { ctaStyle: e.target.value })
                    }
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { ctaRounded: e.target.value })
                    }
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
                  onChange={(e) =>
                    updateBlockProps(block.id, { bgImage: e.target.value })
                  }
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
                  onChange={(e) =>
                    updateBlockProps(block.id, { bgVideo: e.target.value })
                  }
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
                      updateBlockProps(block.id, {
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
                      updateBlockProps(block.id, {
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
                      updateBlockProps(block.id, {
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
                      updateBlockProps(block.id, {
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
                      updateBlockProps(block.id, { showFeaturedCard: checked })
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
                            updateBlockProps(block.id, {
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
                            updateBlockProps(block.id, {
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
                          updateBlockProps(block.id, {
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
                    updateBlockProps(block.id, { showBottomFeatures: checked })
                  }
                />
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "FeaturedCollection":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Collection Settings</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Collection Filter Name</Label>
                <Input
                  value={block.props.collectionName || ""}
                  onChange={(e) => updateBlockProps(block.id, { collectionName: e.target.value })}
                  placeholder="Fall 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Product Count</Label>
                  <Input
                    type="number"
                    value={block.props.count || 4}
                    onChange={(e) => updateBlockProps(block.id, { count: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Columns</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.columns || 4}
                    onChange={(e) => updateBlockProps(block.id, { columns: parseInt(e.target.value) })}
                  >
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Card Aesthetic</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Card Style</Label>
                <div className="grid grid-cols-3 gap-1">
                  {["default", "luxury", "glass"].map((s) => (
                    <Button
                      key={s}
                      variant={block.props.cardStyle === s ? "default" : "outline"}
                      size="sm"
                      className="text-[9px] capitalize h-8"
                      onClick={() => updateBlockProps(block.id, { cardStyle: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) => updateBlockProps(block.id, { styles: newStyles })}
            />
          </div>
        );
      case "PromoBanner":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Promo Content</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Title</Label>
                <Input
                  value={block.props.title || ""}
                  onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                  placeholder="Midnight Edition"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Subtitle</Label>
                <Textarea
                  value={block.props.subtitle || ""}
                  onChange={(e) => updateBlockProps(block.id, { subtitle: e.target.value })}
                  placeholder="Exclusive drops..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Discount Text</Label>
                <Input
                  value={block.props.discountText || ""}
                  onChange={(e) => updateBlockProps(block.id, { discountText: e.target.value })}
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
                  onChange={(e) => updateBlockProps(block.id, { auroraVariant: e.target.value })}
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
              onChange={(newStyles) => updateBlockProps(block.id, { styles: newStyles })}
            />
          </div>
        );

      case "Features":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Features section title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (Small text above title)</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
                placeholder="Why Choose Us"
              />
            </div>
            <div className="space-y-2">
              <Label>Feature Items</Label>
              <div className="space-y-3">
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-3 space-y-2 bg-muted/30">
                    <Input
                      value={item.title || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          title: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Feature title"
                      className="text-sm font-bold"
                    />
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          description: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Feature description"
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const newItems = (block.props.items || []).filter(
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { items: newItems });
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
                      { title: "New Feature", description: "Description here" },
                    ];
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Feature Item
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      /* ... (Others remain same, skip for brevity in this specific tool call or replace fully) ... */

      case "PromoGrid":
        return (
          <div className="space-y-4">
            <Label>Promo Items (Max 2)</Label>
            <div className="space-y-4">
              {(block.props.items || []).map((item: any, idx: number) => (
                <Card
                  key={idx}
                  className="p-4 space-y-3 bg-muted/30 border-dashed"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase opacity-60">
                        Tag
                      </Label>
                      <Input
                        value={item.tag || ""}
                        onChange={(e) => {
                          const newItems = [...(block.props.items || [])];
                          newItems[idx] = {
                            ...newItems[idx],
                            tag: e.target.value,
                          };
                          updateBlockProps(block.id, { items: newItems });
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
                          updateBlockProps(block.id, { items: newItems });
                        }}
                        className="h-8 text-xs"
                        placeholder="Shop Now"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase opacity-60">
                      Title
                    </Label>
                    <Input
                      value={item.title || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          title: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
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
                        updateBlockProps(block.id, { items: newItems });
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
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase opacity-60">
                      Link
                    </Label>
                    <Input
                      value={item.link || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          link: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
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
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Promo Item
                </Button>
              )}
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Banner":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Banner title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
                placeholder="Banner subtitle"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={block.props.imageUrl || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input
                  value={block.props.ctaText || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { ctaText: e.target.value })
                  }
                  placeholder="Button text"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input
                  value={block.props.ctaLink || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { ctaLink: e.target.value })
                  }
                  placeholder="/deals"
                />
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "TextBlock":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Section title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={block.props.content || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { content: e.target.value })
                }
                placeholder="Enter your content..."
                rows={6}
              />
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "CTASection":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="CTA title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
                placeholder="Supporting text"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={block.props.buttonText || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { buttonText: e.target.value })
                  }
                  placeholder="Get Started"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={block.props.buttonLink || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { buttonLink: e.target.value })
                  }
                  placeholder="/signup"
                />
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Stats":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stat Items</Label>
              <div className="space-y-3">
                {(block.props.items || []).map((item: any, idx: number) => (
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
                          updateBlockProps(block.id, { items: newItems });
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
                          updateBlockProps(block.id, { items: newItems });
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
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { items: newItems });
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
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Stat Item
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Pricing":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Pricing Plans</Label>
              <div className="space-y-3">
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-3 space-y-2 bg-muted/30">
                    <Input
                      value={item.name || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = { ...item, name: e.target.value };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Plan Name"
                      className="font-bold"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.price || ""}
                        onChange={(e) => {
                          const newItems = [...(block.props.items || [])];
                          newItems[idx] = { ...item, price: e.target.value };
                          updateBlockProps(block.id, { items: newItems });
                        }}
                        placeholder="Price (e.g. $99)"
                      />
                      <Input
                        value={item.period || ""}
                        onChange={(e) => {
                          const newItems = [...(block.props.items || [])];
                          newItems[idx] = { ...item, period: e.target.value };
                          updateBlockProps(block.id, { items: newItems });
                        }}
                        placeholder="Period (/mo)"
                      />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <Switch
                        checked={item.isPopular}
                        onCheckedChange={(checked) => {
                          const newItems = [...(block.props.items || [])];
                          newItems[idx] = { ...item, isPopular: checked };
                          updateBlockProps(block.id, { items: newItems });
                        }}
                        id={`popular-${idx}`}
                      />
                      <Label htmlFor={`popular-${idx}`} className="text-xs">
                        Is Popular?
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-full"
                      onClick={() => {
                        const newItems = block.props.items.filter(
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { items: newItems });
                      }}
                    >
                      Remove Plan
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
                        price: "$0",
                        period: "/mo",
                        features: [],
                        ctaText: "Choose Plan",
                        ctaLink: "#",
                      },
                    ];
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  Add Plan
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Gallery":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="space-y-3">
                {(block.props.images || []).map((img: any, idx: number) => (
                  <Card key={idx} className="p-3 space-y-2 bg-muted/30">
                    <Input
                      value={img.src || ""}
                      onChange={(e) => {
                        const newImgs = [...(block.props.images || [])];
                        newImgs[idx] = { ...img, src: e.target.value };
                        updateBlockProps(block.id, { images: newImgs });
                      }}
                      placeholder="Image URL"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={img.title || ""}
                        onChange={(e) => {
                          const newImgs = [...(block.props.images || [])];
                          newImgs[idx] = { ...img, title: e.target.value };
                          updateBlockProps(block.id, { images: newImgs });
                        }}
                        placeholder="Title"
                      />
                      <select
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                        value={img.span || "normal"}
                        onChange={(e) => {
                          const newImgs = [...(block.props.images || [])];
                          newImgs[idx] = { ...img, span: e.target.value };
                          updateBlockProps(block.id, { images: newImgs });
                        }}
                      >
                        <option value="normal">Normal</option>
                        <option value="wide">Wide</option>
                        <option value="tall">Tall</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-full"
                      onClick={() => {
                        const newImgs = block.props.images.filter(
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { images: newImgs });
                      }}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => {
                    const newImgs = [
                      ...(block.props.images || []),
                      {
                        src: "/images/home/hero-luxury.jpg",
                        alt: "",
                        title: "New Item",
                        category: "Luxury",
                        span: "normal",
                      },
                    ];
                    updateBlockProps(block.id, { images: newImgs });
                  }}
                >
                  Add Image
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Marquee":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Items (Comma separated)</Label>
              <Textarea
                value={(block.props.items || []).join(", ")}
                onChange={(e) =>
                  updateBlockProps(block.id, {
                    items: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Speed (Seconds)</Label>
                <Input
                  type="number"
                  value={block.props.speed || 30}
                  onChange={(e) =>
                    updateBlockProps(block.id, {
                      speed: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={block.props.direction || "left"}
                  onChange={(e) =>
                    updateBlockProps(block.id, { direction: e.target.value })
                  }
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Countdown":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Target Date (ISO Format)</Label>
              <Input
                type="datetime-local"
                value={
                  block.props.targetDate
                    ? new Date(block.props.targetDate)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateBlockProps(block.id, {
                    targetDate: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={block.props.ctaText || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { ctaText: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={block.props.ctaLink || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { ctaLink: e.target.value })
                  }
                />
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Products":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Content
              </Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Title</Label>
                <Input
                  value={block.props.title || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { title: e.target.value })
                  }
                  placeholder="Featured Products"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Subtitle</Label>
                <Textarea
                  value={block.props.subtitle || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { subtitle: e.target.value })
                  }
                  placeholder="Discover our latest collections"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Configuration
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px]">Data Filter</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.type || "trending"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { type: e.target.value })
                    }
                  >
                    <option value="trending">Trending</option>
                    <option value="new_arrivals">New Arrivals</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Show Count</Label>
                  <Input
                    type="number"
                    value={block.props.count || 8}
                    onChange={(e) =>
                      updateBlockProps(block.id, {
                        count: parseInt(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">Grid Columns</Label>
                <div className="grid grid-cols-5 gap-1">
                  {[2, 3, 4, 5, 6].map((c) => (
                    <Button
                      key={c}
                      variant={
                        block.props.columns === c ? "default" : "outline"
                      }
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => updateBlockProps(block.id, { columns: c })}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Layout Mode</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.layout || "grid"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { layout: e.target.value })
                    }
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Alignment</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.alignment || "center"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { alignment: e.target.value })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px]">Card Style</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={block.props.cardStyle || "default"}
                  onChange={(e) =>
                    updateBlockProps(block.id, { cardStyle: e.target.value })
                  }
                >
                  <option value="default">Default</option>
                  <option value="luxury">Luxury</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Categories":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Content
              </Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Title</Label>
                <Input
                  value={block.props.title || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { title: e.target.value })
                  }
                  placeholder="Featured Categories"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Subtitle</Label>
                <Textarea
                  value={block.props.subtitle || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { subtitle: e.target.value })
                  }
                  placeholder="Curated collections for every style"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Layout & Style
              </Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Grid Columns</Label>
                <div className="grid grid-cols-5 gap-1">
                  {[2, 3, 4, 5, 6].map((c) => (
                    <Button
                      key={c}
                      variant={
                        block.props.columns === c ? "default" : "outline"
                      }
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => updateBlockProps(block.id, { columns: c })}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Layout Mode</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.layout || "grid"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { layout: e.target.value })
                    }
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                    <option value="masonry">Masonry</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Card Style</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.cardStyle || "default"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { cardStyle: e.target.value })
                    }
                  >
                    <option value="default">Default</option>
                    <option value="luxury">Luxury</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Alignment</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.alignment || "left"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { alignment: e.target.value })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Animation</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.animationType || "fade"}
                    onChange={(e) =>
                      updateBlockProps(block.id, {
                        animationType: e.target.value,
                      })
                    }
                  >
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Brands":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Content
              </Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Title</Label>
                <Input
                  value={block.props.title || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { title: e.target.value })
                  }
                  placeholder="Our Trusted Partners"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Section Subtitle</Label>
                <Input
                  value={block.props.subtitle || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { subtitle: e.target.value })
                  }
                  placeholder="Collaborating with the world's finest artisans"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Visual & Style
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
                  <Label className="text-[10px]">Grayscale</Label>
                  <Switch
                    checked={block.props.grayscale !== false}
                    onCheckedChange={(checked: boolean) =>
                      updateBlockProps(block.id, { grayscale: checked })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">
                    Opacity: {block.props.opacity || 1}
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={block.props.opacity || 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateBlockProps(block.id, {
                        opacity: parseFloat(e.target.value),
                      })
                    }
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Logo Size</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.logoSize || "md"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { logoSize: e.target.value })
                    }
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Hover Effect</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.hoverEffect || "lift"}
                    onChange={(e) =>
                      updateBlockProps(block.id, {
                        hoverEffect: e.target.value,
                      })
                    }
                  >
                    <option value="scale">Scale</option>
                    <option value="lift">Lift</option>
                    <option value="glow">Glow</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px]">Layout Style</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.layout || "grid"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { layout: e.target.value })
                    }
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Alignment</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.alignment || "left"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { alignment: e.target.value })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Products":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Product Filtering</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Filter Type</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={block.props.filter || "trending"}
                  onChange={(e) => updateBlockProps(block.id, { filter: e.target.value })}
                >
                  <option value="trending">Trending Products</option>
                  <option value="new">New Arrivals</option>
                </select>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Card Aesthetic</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Card Style</Label>
                <div className="grid grid-cols-3 gap-1">
                  {["default", "luxury", "glass"].map((s) => (
                    <Button
                      key={s}
                      variant={block.props.cardStyle === s ? "default" : "outline"}
                      size="sm"
                      className="text-[9px] capitalize h-8"
                      onClick={() => updateBlockProps(block.id, { cardStyle: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) => updateBlockProps(block.id, { styles: newStyles })}
            />
          </div>
        );

      case "Deal":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Section title"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
                placeholder="Section subtitle"
              />
            </div>
            <div className="space-y-4 pt-4 border-t">
              <BlockStyleControls
                styles={block.props.styles}
                onChange={(newStyles) =>
                  updateBlockProps(block.id, { styles: newStyles })
                }
              />
            </div>
          </div>
        );

      case "Newsletter":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Newsletter title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={block.props.description || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { description: e.target.value })
                }
                placeholder="Subscribe description"
                rows={2}
              />
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Testimonials":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Testimonials</Label>
              <div className="space-y-3">
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-3 space-y-2 bg-muted/30">
                    <Input
                      value={item.author || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          author: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Author name"
                      className="text-sm"
                    />
                    <Input
                      value={item.role || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          role: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Role (e.g. Designer)"
                      className="text-sm"
                    />
                    <Textarea
                      value={item.text || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          text: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Testimonial text"
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const newItems = (block.props.items || []).filter(
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { items: newItems });
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
                        author: "New Client",
                        role: "Client",
                        text: "Great service!",
                        rating: 5,
                      },
                    ];
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Testimonial
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "FAQ":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>FAQ Items</Label>
              <div className="space-y-3">
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-3 space-y-2 bg-muted/30">
                    <Input
                      value={item.question || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = {
                          ...newItems[idx],
                          question: e.target.value,
                        };
                        updateBlockProps(block.id, { items: newItems });
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
                        updateBlockProps(block.id, { items: newItems });
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
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { items: newItems });
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
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add FAQ Item
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "FlexLayout":
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { layout: e.target.value })
                    }
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
                    onChange={(e) =>
                      updateBlockProps(block.id, { gap: e.target.value })
                    }
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
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card
                    key={idx}
                    className="p-4 space-y-3 bg-muted/20 border-dashed"
                  >
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold">
                        Item #{idx + 1}
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => {
                          const newItems = (block.props.items || []).filter(
                            (_: any, i: number) => i !== idx
                          );
                          updateBlockProps(block.id, { items: newItems });
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
                        updateBlockProps(block.id, { items: newItems });
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
                        updateBlockProps(block.id, { items: newItems });
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
                            updateBlockProps(block.id, { items: newItems });
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
                            updateBlockProps(block.id, { items: newItems });
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
                          updateBlockProps(block.id, { items: newItems });
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
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Flex Item
                </Button>
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "VideoHero":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Video Content
              </Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Video URL (MP4)</Label>
                <Input
                  value={block.props.videoUrl || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { videoUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Hero Title</Label>
                <Input
                  value={block.props.title || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { title: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Subtitle</Label>
                <Textarea
                  value={block.props.subtitle || ""}
                  onChange={(e) =>
                    updateBlockProps(block.id, { subtitle: e.target.value })
                  }
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Visuals & Design
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Overlay Opacity</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={block.props.overlayOpacity ?? 0.5}
                    onChange={(e) =>
                      updateBlockProps(block.id, {
                        overlayOpacity: parseFloat(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Theme Style</Label>
                  <select
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    value={block.props.theme || "luxury"}
                    onChange={(e) =>
                      updateBlockProps(block.id, { theme: e.target.value })
                    }
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Section Height</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  value={block.props.height || "large"}
                  onChange={(e) =>
                    updateBlockProps(block.id, { height: e.target.value })
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full">Fullscreen</option>
                </select>
              </div>
            </div>

            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Header":
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
                  onCheckedChange={(checked: boolean) => {
                    // Update legacy and new style prop for compatibility
                    updateBlockProps(block.id, {
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
                  onCheckedChange={(checked: boolean) =>
                    updateBlockProps(block.id, { fullWidth: checked })
                  }
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
                    updateBlockProps(block.id, {
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
                        (block.props.customHeight || 80) === h
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() =>
                        updateBlockProps(block.id, { customHeight: h })
                      }
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
                      (block.props.alignment || "right") === a
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="text-[10px] capitalize h-8"
                    onClick={() => updateBlockProps(block.id, { alignment: a })}
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
                {(block.props.utils || []).map((util: any, idx: number) => (
                  <Card
                    key={idx}
                    className="p-3 space-y-2 bg-muted/20 border-dashed"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px]">
                            Lucide Icon Name
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
                        <div className="relative">
                          <Input
                            value={util.icon || ""}
                            onChange={(e) => {
                              const newUtils = [...(block.props.utils || [])];
                              newUtils[idx] = {
                                ...newUtils[idx],
                                icon: e.target.value,
                              };
                              updateBlockProps(block.id, { utils: newUtils });
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
                            updateBlockProps(block.id, { utils: newUtils });
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
                          updateBlockProps(block.id, { utils: newUtils });
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
                            (_: any, i: number) => i !== idx
                          );
                          updateBlockProps(block.id, { utils: newUtils });
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
                    updateBlockProps(block.id, { utils: newUtils });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Utility
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Navigation Links</Label>
              <div className="space-y-3">
                {(block.props.links || []).map((link: any, idx: number) => (
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
                            updateBlockProps(block.id, { links: newLinks });
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
                            updateBlockProps(block.id, { links: newLinks });
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
                              updateBlockProps(block.id, { links: newLinks });
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
                          (_: any, i: number) => i !== idx
                        );
                        updateBlockProps(block.id, { links: newLinks });
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
                    updateBlockProps(block.id, { links: newLinks });
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
                </Button>
              </div>
            </div>
            <BlockStyleControls
              styles={block.props.styles}
              onChange={(newStyles) =>
                updateBlockProps(block.id, { styles: newStyles })
              }
            />
          </div>
        );

      case "Footer":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {["dark", "minimal", "brushed"].map((t) => (
                  <Button
                    key={t}
                    variant={
                      (block.props.theme || "dark") === t
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="text-[10px] capitalize"
                    onClick={() => updateBlockProps(block.id, { theme: t })}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Design Customization - Moved to BlockStyleControls */}
            <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20 mt-4">
              <Label className="text-xs">Show Contact Info</Label>
              <Switch
                checked={block.props.showContact !== false}
                onCheckedChange={(checked: boolean) =>
                  updateBlockProps(block.id, { showContact: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={block.props.companyName || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { companyName: e.target.value })
                }
                placeholder="Luxe Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={block.props.description || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { description: e.target.value })
                }
                placeholder="Footer description text..."
                rows={3}
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <Label className="text-xs uppercase opacity-50 font-bold">
                Navigation Columns
              </Label>
              <div className="space-y-4">
                {(block.props.columns || []).map((col: any, colIdx: number) => (
                  <Card
                    key={colIdx}
                    className="p-3 space-y-3 bg-muted/30 border-dashed"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={col.title || ""}
                        onChange={(e) => {
                          const newCols = [...(block.props.columns || [])];
                          newCols[colIdx] = {
                            ...newCols[colIdx],
                            title: e.target.value,
                          };
                          updateBlockProps(block.id, { columns: newCols });
                        }}
                        placeholder="Column Title (e.g. Products)"
                        className="font-bold h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          const newCols = (block.props.columns || []).filter(
                            (_: any, i: number) => i !== colIdx
                          );
                          updateBlockProps(block.id, { columns: newCols });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2">
                      {(col.links || []).map((link: any, linkIdx: number) => (
                        <div key={linkIdx} className="flex gap-2">
                          <Input
                            value={link.label || ""}
                            onChange={(e) => {
                              const newCols = [...(block.props.columns || [])];
                              const newLinks = [
                                ...(newCols[colIdx].links || []),
                              ];
                              newLinks[linkIdx] = {
                                ...newLinks[linkIdx],
                                label: e.target.value,
                              };
                              newCols[colIdx] = {
                                ...newCols[colIdx],
                                links: newLinks,
                              };
                              updateBlockProps(block.id, { columns: newCols });
                            }}
                            placeholder="Label"
                            className="h-7 text-xs"
                          />
                          <Input
                            value={link.href || ""}
                            onChange={(e) => {
                              const newCols = [...(block.props.columns || [])];
                              const newLinks = [
                                ...(newCols[colIdx].links || []),
                              ];
                              newLinks[linkIdx] = {
                                ...newLinks[linkIdx],
                                href: e.target.value,
                              };
                              newCols[colIdx] = {
                                ...newCols[colIdx],
                                links: newLinks,
                              };
                              updateBlockProps(block.id, { columns: newCols });
                            }}
                            placeholder="/url"
                            className="h-7 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => {
                              const newCols = [...(block.props.columns || [])];
                              const newLinks = (
                                newCols[colIdx].links || []
                              ).filter((_: any, i: number) => i !== linkIdx);
                              newCols[colIdx] = {
                                ...newCols[colIdx],
                                links: newLinks,
                              };
                              updateBlockProps(block.id, { columns: newCols });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-full text-[10px] border-dashed"
                        onClick={() => {
                          const newCols = [...(block.props.columns || [])];
                          const newLinks = [
                            ...(newCols[colIdx].links || []),
                            { label: "New Link", href: "/" },
                          ];
                          newCols[colIdx] = {
                            ...newCols[colIdx],
                            links: newLinks,
                          };
                          updateBlockProps(block.id, { columns: newCols });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Link
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => {
                    const newCols = [
                      ...(block.props.columns || []),
                      { title: "New Column", links: [] },
                    ];
                    updateBlockProps(block.id, { columns: newCols });
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Column
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Social Links</Label>
              <div className="space-y-2">
                {(block.props.socialLinks || []).map(
                  (social: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={social.platform || ""}
                        onChange={(e) => {
                          const newSocials = [
                            ...(block.props.socialLinks || []),
                          ];
                          newSocials[idx] = {
                            ...newSocials[idx],
                            platform: e.target.value,
                          };
                          updateBlockProps(block.id, {
                            socialLinks: newSocials,
                          });
                        }}
                        placeholder="Platform"
                        className="flex-1 h-8 text-xs"
                      />
                      <Input
                        value={social.url || ""}
                        onChange={(e) => {
                          const newSocials = [
                            ...(block.props.socialLinks || []),
                          ];
                          newSocials[idx] = {
                            ...newSocials[idx],
                            url: e.target.value,
                          };
                          updateBlockProps(block.id, {
                            socialLinks: newSocials,
                          });
                        }}
                        placeholder="URL"
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          const newSocials = (
                            block.props.socialLinks || []
                          ).filter((_: any, i: number) => i !== idx);
                          updateBlockProps(block.id, {
                            socialLinks: newSocials,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => {
                    const newSocials = [
                      ...(block.props.socialLinks || []),
                      { platform: "Instagram", url: "#" },
                    ];
                    updateBlockProps(block.id, { socialLinks: newSocials });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Social Link
                </Button>
              </div>

              <BlockStyleControls
                styles={block.props.styles}
                onChange={(newStyles) =>
                  updateBlockProps(block.id, { styles: newStyles })
                }
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground italic py-4">
            No editor available for this block type.
          </div>
        );
    }
  };

  return (
    <LayoutVisibilityProvider>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Header */}
        <div className="flex-none flex items-center justify-between border-b bg-card px-6 py-4 h-[70px]">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/pages">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{page.title}</h1>
                <Badge variant={page.isPublished ? "default" : "secondary"}>
                  {page.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Device Preview Toggles */}
            <div className="flex items-center border rounded-lg p-1 bg-muted/50">
              {[
                { device: "desktop" as const, icon: Monitor },
                { device: "tablet" as const, icon: Tablet },
                { device: "mobile" as const, icon: Smartphone },
              ].map(({ device, icon: Icon }) => (
                <Button
                  key={device}
                  variant={previewDevice === device ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewDevice(device)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Main Builder Area - Using Fixed Flex for Stability */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar: Block List & Settings */}
          <aside className="w-[360px] flex-none bg-background border-r border-border shadow-[10px_0_30px_rgba(0,0,0,0.1)] relative z-100 flex flex-col overflow-hidden">
            <div className="h-full overflow-y-auto flex flex-col custom-scrollbar bg-background">
              {/* Block List */}
              <div className="p-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Blocks</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddBlockOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {blocks.map((block, index) => {
                    const blockInfo = getBlockTypeInfo(block.type);
                    return (
                      <Card
                        key={block.id}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedBlockId === block.id
                            ? "ring-2 ring-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {block.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {block.props.title ||
                                blockInfo?.label ||
                                block.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(block.id, "up");
                              }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(block.id, "down");
                              }}
                              disabled={index === blocks.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBlock(block.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {blocks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-3">
                        No blocks yet
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddBlockOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add your first block
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Block Editor */}
              {selectedBlock && (
                <div className="flex-1 p-4 border-t bg-muted/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Edit{" "}
                      {getBlockTypeInfo(selectedBlock.type)?.label ||
                        selectedBlock.type}
                    </h3>
                  </div>
                  {renderBlockEditor(selectedBlock)}
                </div>
              )}
            </div>
          </aside>

          {/* Real-time Preview Area */}
          <main className="flex-1 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden z-10">
            {/* Explicit Containment Wrapper with hard clipping and new stacking context */}
            <div
              className="h-full w-full relative isolate overflow-hidden"
              style={{
                isolation: "isolate",
                transform: "translateZ(0)",
                clipPath: "inset(0)",
              }}
            >
              <div
                id="preview-viewport"
                className="h-full overflow-y-auto p-4 md:p-8 relative z-0 scroll-smooth bg-muted/20"
              >
                <div className="absolute top-6 right-6 z-20">
                  <Badge
                    variant="secondary"
                    className="flex gap-2 items-center px-4 py-2 bg-white/70 backdrop-blur-xl shadow-lg border-white/20 text-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Live Preview
                  </Badge>
                </div>

                {/* Preview Container - Scaled viewport preview */}
                <div
                  className="bg-background border shadow-xl max-w-7xl! rounded-lg overflow-hidden mx-auto flex flex-col min-h-full"
                  style={{
                    width: deviceWidths[previewDevice],
                    maxWidth: "100%",
                  }}
                >
                  {/* Header Preview - Show default ONLY if page has content but no custom header */}
                  {blocks.length > 0 &&
                    !blocks.some((b) => b.type === "Header") && (
                      <div className="pointer-events-none opacity-80 border-b">
                        <Header isInline />
                      </div>
                    )}

                  {/* Block Content with gap matching public page */}
                  <div className="flex-1 flex flex-col gap-16 py-12">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className={`relative group cursor-pointer transition-all overflow-hidden ${
                          selectedBlockId === block.id
                            ? "ring-2 ring-primary ring-inset"
                            : ""
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <BlockRenderer block={block as any} data={null} />
                        {/* Selection overlay */}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none z-50" />
                      </div>
                    ))}
                    {blocks.length === 0 && (
                      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                        <Plus className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Start building</p>
                        <p className="text-sm mt-1">
                          Add blocks from the sidebar to create your page
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Preview - Show default ONLY if page has content but no custom footer */}
                  {blocks.length > 0 &&
                    !blocks.some((b) => b.type === "Footer") && (
                      <div className="pointer-events-none opacity-80 border-t">
                        <Footer />
                      </div>
                    )}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Dialogs */}
        <AddBlockDialog
          open={isAddBlockOpen}
          onOpenChange={setIsAddBlockOpen}
          onAddBlock={handleAddBlock}
        />

        <PageSettingsSheet
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          page={page}
          onSave={handleSettingsSave}
          onDelete={() => {
            setIsSettingsOpen(false);
            setIsDeleteOpen(true);
          }}
          isSaving={isPending}
        />

        <DeleteConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Delete Page"
          description={`Are you sure you want to delete "${page.title}"? This action cannot be undone.`}
          action={handleDelete}
          confirmLabel="Delete Page"
          successMessage="Page deleted successfully"
        />
      </div>
    </LayoutVisibilityProvider>
  );
}
