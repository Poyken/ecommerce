"use client";

import { BlockRenderer } from "@/components/cms/block-renderer";
import { useToast } from "@/components/shared/use-toast";
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
} from "@/features/admin/components/add-block-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
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
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { v4 as uuidv4 } from "uuid";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Image from "next/image";

interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
}

const FlexibleIcon = ({ source, size = 18, className }: { source?: string, size?: number, className?: string }) => {
    if (!source) return null;

    // Check if source is a URL (contains / or .)
    if (source.includes("/") || source.includes(".")) {
        return (
            <div className={cn("relative overflow-hidden", className)} style={{ width: size, height: size }}>
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
    const IconComponent = (LucideIcons as any)[source];
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} />;
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

export function PageBuilderClient({ page: initialPage }: PageBuilderClientProps) {
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

  const handleDelete = async (): Promise<{ success?: boolean; error?: string }> => {
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
    const blockInfo = getBlockTypeInfo(block.type);
    
    switch (block.type) {
      case "Hero":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="grid grid-cols-2 gap-2">
                    {["left", "center"].map((a) => (
                        <Button
                            key={a}
                            variant={block.props.alignment === a ? "default" : "outline"}
                            size="sm"
                            className="text-[10px] capitalize"
                            onClick={() => updateBlockProps(block.id, { alignment: a })}
                        >
                            {a}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { title: e.target.value })
                }
                placeholder="Enter hero title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={block.props.subtitle || ""}
                onChange={(e) =>
                  updateBlockProps(block.id, { subtitle: e.target.value })
                }
                placeholder="Enter hero subtitle"
                rows={3}
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
                  placeholder="/shop"
                />
              </div>
            </div>
            
            {block.props.alignment === "left" && (
                <div className="pt-4 border-t space-y-4">
                    <Label className="text-xs uppercase opacity-50 font-bold">Featured Look Details</Label>
                    <div className="space-y-2">
                        <Label>Background Image URL</Label>
                        <Input
                            value={block.props.bgImage || ""}
                            onChange={(e) => updateBlockProps(block.id, { bgImage: e.target.value })}
                            placeholder="/images/..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Featured Title</Label>
                            <Input
                                value={block.props.featuredTitle || ""}
                                onChange={(e) => updateBlockProps(block.id, { featuredTitle: e.target.value })}
                                placeholder="Silk Evening Dress"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Featured Price</Label>
                            <Input
                                value={block.props.featuredPrice || ""}
                                onChange={(e) => updateBlockProps(block.id, { featuredPrice: e.target.value })}
                                placeholder="$1,299"
                            />
                        </div>
                    </div>
                </div>
            )}
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
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
                        newItems[idx] = { ...newItems[idx], title: e.target.value };
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      /* ... (Others remain same, skip for brevity in this specific tool call or replace fully) ... */

      case "PromoGrid":
        return (
          <div className="space-y-4">
            <Label>Promo Items (Max 2)</Label>
            <div className="space-y-4">
                {(block.props.items || []).map((item: any, idx: number) => (
                  <Card key={idx} className="p-4 space-y-3 bg-muted/30 border-dashed">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-60">Tag</Label>
                            <Input
                                value={item.tag || ""}
                                onChange={(e) => {
                                    const newItems = [...(block.props.items || [])];
                                    newItems[idx] = { ...newItems[idx], tag: e.target.value };
                                    updateBlockProps(block.id, { items: newItems });
                                }}
                                className="h-8 text-xs"
                                placeholder="Exclusive"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-60">Button Text</Label>
                            <Input
                                value={item.buttonText || ""}
                                onChange={(e) => {
                                    const newItems = [...(block.props.items || [])];
                                    newItems[idx] = { ...newItems[idx], buttonText: e.target.value };
                                    updateBlockProps(block.id, { items: newItems });
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
                            newItems[idx] = { ...newItems[idx], title: e.target.value };
                            updateBlockProps(block.id, { items: newItems });
                            }}
                            className="h-9 font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-60">Subtitle</Label>
                        <Textarea
                            value={item.subtitle || ""}
                            onChange={(e) => {
                            const newItems = [...(block.props.items || [])];
                            newItems[idx] = { ...newItems[idx], subtitle: e.target.value };
                            updateBlockProps(block.id, { items: newItems });
                            }}
                            className="h-16 text-sm"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-60">Image URL</Label>
                        <Input
                            value={item.imageUrl || ""}
                            onChange={(e) => {
                            const newItems = [...(block.props.items || [])];
                            newItems[idx] = { ...newItems[idx], imageUrl: e.target.value };
                            updateBlockProps(block.id, { items: newItems });
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
                            newItems[idx] = { ...newItems[idx], link: e.target.value };
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
                                buttonText: "Discover"
                            },
                            ];
                            updateBlockProps(block.id, { items: newItems });
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Promo Item
                    </Button>
                )}
            </div>
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
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
                            newItems[idx] = { ...newItems[idx], label: e.target.value };
                            updateBlockProps(block.id, { items: newItems });
                        }}
                        placeholder="Label"
                        className="text-sm"
                        />
                        <Input
                        value={item.value || ""}
                        onChange={(e) => {
                            const newItems = [...(block.props.items || [])];
                            newItems[idx] = { ...newItems[idx], value: e.target.value };
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "Products":
        return (
          <div className="space-y-4">
             <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                    value={block.props.title || ""}
                    onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                    placeholder="Section title"
                />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Product List Type</Label>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant={block.props.type === 'trending' ? 'default' : 'outline'}
                            onClick={() => updateBlockProps(block.id, { type: 'trending' })}
                            className="flex-1"
                        >
                            Trending
                        </Button>
                        <Button 
                            size="sm" 
                            variant={block.props.type === 'new_arrivals' ? 'default' : 'outline'}
                            onClick={() => updateBlockProps(block.id, { type: 'new_arrivals' })}
                            className="flex-1"
                        >
                            New
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Display Count</Label>
                    <Input
                        type="number"
                        min="4"
                        max="12"
                        step="4"
                        value={block.props.count || 4}
                        onChange={(e) => updateBlockProps(block.id, { count: parseInt(e.target.value) })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Columns</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[3, 4, 5].map((c) => (
                            <Button
                                key={c}
                                variant={block.props.columns === c ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateBlockProps(block.id, { columns: c })}
                            >
                                {c}
                            </Button>
                        ))}
                    </div>
                </div>
             </div>
              {/* Design Customization */}
              <div className="space-y-4 pt-4 border-t">
                 <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Background Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.backgroundColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, backgroundColor: e.target.value }
                                 })}
                                 placeholder="Transparent"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.backgroundColor || "#ffffff"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, backgroundColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                             </div>
                             {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
           </div>
         );

      case "Categories":
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
                <Label>Grid Columns</Label>
                <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((c) => (
                        <Button
                            key={c}
                            variant={block.props.columns === c ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateBlockProps(block.id, { columns: c })}
                        >
                            {c}
                        </Button>
                    ))}
                </div>
             </div>
             {/* Design Customization */}
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "Brands":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                placeholder="Section title"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => updateBlockProps(block.id, { subtitle: e.target.value })}
                placeholder="Section subtitle"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
                    <Label className="text-xs">Grayscale</Label>
                    <Switch
                        checked={block.props.grayscale !== false}
                        onCheckedChange={(checked: boolean) =>
                            updateBlockProps(block.id, { grayscale: checked })
                        }
                    />
                </div>
                <div className="p-2 border rounded-lg bg-muted/20 space-y-2">
                     <Label className="text-xs">Opacity: {block.props.opacity ? Math.round(block.props.opacity * 100) : 100}%</Label>
                     <Input 
                        type="range"
                        min="20"
                        max="100"
                        value={block.props.opacity ? block.props.opacity * 100 : 100}
                        onChange={(e) => updateBlockProps(block.id, { opacity: parseInt(e.target.value) / 100 })}
                        className="h-2"
                     />
                </div>
            </div>
             {/* Design Customization */}
              <div className="space-y-4 pt-4 border-t">
                 <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Background Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.backgroundColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, backgroundColor: e.target.value }
                                 })}
                                 placeholder="Transparent"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.backgroundColor || "#ffffff"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, backgroundColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                             </div>
                             {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "Deal":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                placeholder="Section title"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => updateBlockProps(block.id, { subtitle: e.target.value })}
                placeholder="Section subtitle"
              />
            </div>
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "Testimonials":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => updateBlockProps(block.id, { subtitle: e.target.value })}
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
                        newItems[idx] = { ...newItems[idx], author: e.target.value };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Author name"
                      className="text-sm"
                    />
                    <Input
                      value={item.role || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = { ...newItems[idx], role: e.target.value };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Role (e.g. Designer)"
                      className="text-sm"
                    />
                    <Textarea
                      value={item.text || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = { ...newItems[idx], text: e.target.value };
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
                      { author: "New Client", role: "Client", text: "Great service!", rating: 5 },
                    ];
                    updateBlockProps(block.id, { items: newItems });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Testimonial
                </Button>
              </div>
            </div>
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "FAQ":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subtitle</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => updateBlockProps(block.id, { subtitle: e.target.value })}
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
                        newItems[idx] = { ...newItems[idx], question: e.target.value };
                        updateBlockProps(block.id, { items: newItems });
                      }}
                      placeholder="Question"
                      className="text-sm"
                    />
                    <Textarea
                      value={item.answer || ""}
                      onChange={(e) => {
                        const newItems = [...(block.props.items || [])];
                        newItems[idx] = { ...newItems[idx], answer: e.target.value };
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
             <div className="space-y-4 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Transparent"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-bold">Text Color</Label>
                     <div className="flex gap-2 items-center">
                         <div className="relative flex-1">
                             <Input 
                                 value={block.props.styles?.textColor || ""}
                                 onChange={(e) => updateBlockProps(block.id, { 
                                     styles: { ...block.props.styles, textColor: e.target.value }
                                 })}
                                 placeholder="Inherit"
                                 className="h-8 text-xs font-mono pl-8"
                             />
                              <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                 <Input 
                                     type="color" 
                                     value={block.props.styles?.textColor || "#000000"}
                                     onChange={(e) => updateBlockProps(block.id, { 
                                         styles: { ...block.props.styles, textColor: e.target.value }
                                     })}
                                     className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                 />
                             </div>
                             <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                 <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                             </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
        );

      case "Header":
        return (
          <div className="space-y-4">
            {/* Design Settings */}
                <div className="space-y-4 pt-2 pb-4 border-b">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design</Label>
                
                {/* Transparency Toggle */}
                <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-bold opacity-70">Transparent</Label>
                        <p className="text-[9px] text-muted-foreground leading-tight">No background initially</p>
                    </div>
                    <Switch
                        checked={block.props.styles?.transparent !== undefined ? block.props.styles.transparent : (block.props.transparent || false)}
                        onCheckedChange={(checked: boolean) => {
                            // Update legacy and new style prop for compatibility
                            updateBlockProps(block.id, { 
                                transparent: checked,
                                styles: { ...block.props.styles, transparent: checked }
                            });
                        }}
                    />
                </div>

                {/* Only show Colors if NOT transparent */}
                {!(block.props.styles?.transparent || block.props.transparent) && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Label className="text-[10px] font-bold">Background Color</Label>
                        <div className="flex gap-2 items-center">
                            <div className="relative w-8 h-8 rounded-full border shadow-sm overflow-hidden flex-none pointer-events-none" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                            <div className="relative flex-1">
                                <Input 
                                    value={block.props.styles?.backgroundColor || ""}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    placeholder="#ffffff"
                                    className="h-8 text-xs font-mono pl-8"
                                />
                                <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                     <Input 
                                        type="color" 
                                        value={block.props.styles?.backgroundColor || "#ffffff"}
                                        onChange={(e) => updateBlockProps(block.id, { 
                                            styles: { ...block.props.styles, backgroundColor: e.target.value }
                                        })}
                                        className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                    <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#ffffff" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Text Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                             <Input 
                                value={block.props.styles?.textColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, textColor: e.target.value }
                                })}
                                placeholder="Inherit"
                                className="h-8 text-xs font-mono pl-8"
                            />
                            <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.textColor || "#000000"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#000000" }} />
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-bold opacity-70">Full Width</Label>
                        <p className="text-[9px] text-muted-foreground leading-tight">Edge-to-edge layout</p>
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
                        onChange={(e) => updateBlockProps(block.id, { customHeight: parseInt(e.target.value) || 80 })}
                        className="w-24 h-9"
                    />
                    <div className="flex gap-2">
                        {[64, 80, 100].map(h => (
                            <Button 
                                key={h} 
                                variant={(block.props.customHeight || 80) === h ? "default" : "outline"} 
                                size="sm" 
                                className="h-7 px-2 text-[10px]"
                                onClick={() => updateBlockProps(block.id, { customHeight: h })}
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
                            variant={(block.props.alignment || "right") === a ? "default" : "outline"}
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
                <Label className="text-[10px] uppercase font-bold opacity-50">Utilities (Search, Cart, etc.)</Label>
                <div className="space-y-3">
                    {(block.props.utils || []).map((util: any, idx: number) => (
                        <Card key={idx} className="p-3 space-y-2 bg-muted/20 border-dashed">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px]">Lucide Icon Name</Label>
                                        <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:underline">Browse Icons ↗</a>
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            value={util.icon || ""}
                                            onChange={(e) => {
                                                const newUtils = [...(block.props.utils || [])];
                                                newUtils[idx] = { ...newUtils[idx], icon: e.target.value };
                                                updateBlockProps(block.id, { utils: newUtils });
                                            }}
                                            placeholder="Search, User, ShoppingCart..."
                                            className="h-8 text-xs pr-8"
                                        />
                                        <div className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center p-1 pointer-events-none opacity-50">
                                            <FlexibleIcon source={util.icon} size={14} className="text-foreground" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Label</Label>
                                    <Input 
                                        value={util.label || ""}
                                        onChange={(e) => {
                                            const newUtils = [...(block.props.utils || [])];
                                            newUtils[idx] = { ...newUtils[idx], label: e.target.value };
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
                                        newUtils[idx] = { ...newUtils[idx], href: e.target.value };
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
                                        const newUtils = (block.props.utils || []).filter((_: any, i: number) => i !== idx);
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
                                { icon: "Search", label: "Search", href: "/search" }
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
                                newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                                updateBlockProps(block.id, { links: newLinks });
                                }}
                                placeholder="Label"
                                className="text-sm h-8"
                            />
                            <Input
                                value={link.href || ""}
                                onChange={(e) => {
                                const newLinks = [...(block.props.links || [])];
                                newLinks[idx] = { ...newLinks[idx], href: e.target.value };
                                updateBlockProps(block.id, { links: newLinks });
                                }}
                                placeholder="URL"
                                className="text-sm h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px]">Icon (Lucide Name or Image URL)</Label>
                                <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:underline">Browse Icons ↗</a>
                            </div>
                            <div className="flex gap-2 relative">
                                <div className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center p-1 pointer-events-none opacity-50">
                                   <FlexibleIcon source={link.icon} size={14} className="text-foreground" />
                                </div>
                                <Input
                                    value={link.icon || ""}
                                    onChange={(e) => {
                                        const newLinks = [...(block.props.links || [])];
                                        newLinks[idx] = { ...newLinks[idx], icon: e.target.value };
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
                            variant={(block.props.theme || "dark") === t ? "default" : "outline"}
                            size="sm"
                            className="text-[10px] capitalize"
                            onClick={() => updateBlockProps(block.id, { theme: t })}
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>
            
             {/* Design Customization */}
            <div className="space-y-4 pt-2 pb-4 border-b">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Design Override</Label>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Input 
                                value={block.props.styles?.backgroundColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, backgroundColor: e.target.value }
                                })}
                                placeholder="Default Theme"
                                className="h-8 text-xs font-mono pl-8"
                            />
                             <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.backgroundColor || "#000000"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.backgroundColor || "#000000" }} />
                            </div>
                            {block.props.styles?.backgroundColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, backgroundColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-bold">Text Color</Label>
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                             <Input 
                                value={block.props.styles?.textColor || ""}
                                onChange={(e) => updateBlockProps(block.id, { 
                                    styles: { ...block.props.styles, textColor: e.target.value }
                                })}
                                placeholder="Default Theme"
                                className="h-8 text-xs font-mono pl-8"
                            />
                            <div className="absolute left-2 top-1.5 w-4 h-5 opacity-0 overflow-hidden">
                                <Input 
                                    type="color" 
                                    value={block.props.styles?.textColor || "#ffffff"}
                                    onChange={(e) => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: e.target.value }
                                    })}
                                    className="w-[200%] h-[200%] -m-2 cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: block.props.styles?.textColor || "#ffffff" }} />
                            </div>
                             {block.props.styles?.textColor && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                                    onClick={() => updateBlockProps(block.id, { 
                                        styles: { ...block.props.styles, textColor: undefined }
                                    })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20">
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
                <Label className="text-xs uppercase opacity-50 font-bold">Navigation Columns</Label>
                <div className="space-y-4">
                    {(block.props.columns || []).map((col: any, colIdx: number) => (
                        <Card key={colIdx} className="p-3 space-y-3 bg-muted/30 border-dashed">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={col.title || ""}
                                    onChange={(e) => {
                                        const newCols = [...(block.props.columns || [])];
                                        newCols[colIdx] = { ...newCols[colIdx], title: e.target.value };
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
                                        const newCols = (block.props.columns || []).filter((_: any, i: number) => i !== colIdx);
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
                                                const newLinks = [...(newCols[colIdx].links || [])];
                                                newLinks[linkIdx] = { ...newLinks[linkIdx], label: e.target.value };
                                                newCols[colIdx] = { ...newCols[colIdx], links: newLinks };
                                                updateBlockProps(block.id, { columns: newCols });
                                            }}
                                            placeholder="Label"
                                            className="h-7 text-xs"
                                        />
                                        <Input
                                            value={link.href || ""}
                                            onChange={(e) => {
                                                const newCols = [...(block.props.columns || [])];
                                                const newLinks = [...(newCols[colIdx].links || [])];
                                                newLinks[linkIdx] = { ...newLinks[linkIdx], href: e.target.value };
                                                newCols[colIdx] = { ...newCols[colIdx], links: newLinks };
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
                                                const newLinks = (newCols[colIdx].links || []).filter((_: any, i: number) => i !== linkIdx);
                                                newCols[colIdx] = { ...newCols[colIdx], links: newLinks };
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
                                        const newLinks = [...(newCols[colIdx].links || []), { label: "New Link", href: "/" }];
                                        newCols[colIdx] = { ...newCols[colIdx], links: newLinks };
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
                                { title: "New Column", links: [] }
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Social Link
                </Button>
              </div>
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
          
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
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
        <aside 
          className="w-[360px] flex-none bg-background border-r border-border shadow-[10px_0_30px_rgba(0,0,0,0.1)] relative z-[100] flex flex-col overflow-hidden"
        >
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
                            {block.props.title || blockInfo?.label || block.type}
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
                    Edit {getBlockTypeInfo(selectedBlock.type)?.label || selectedBlock.type}
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
          <div className="h-full w-full relative isolate overflow-hidden" style={{ isolation: 'isolate', transform: 'translateZ(0)', clipPath: 'inset(0)' }}>
            <div id="preview-viewport" className="h-full overflow-y-auto p-4 md:p-8 relative z-0 scroll-smooth bg-muted/20">
            <div className="absolute top-6 right-6 z-20">
              <Badge variant="secondary" className="flex gap-2 items-center px-4 py-2 bg-white/70 backdrop-blur-xl shadow-lg border-white/20 text-foreground">
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </Badge>
            </div>

            {/* Preview Container - Scaled viewport preview */}
            <div
              className="bg-background border shadow-xl rounded-lg overflow-hidden mx-auto flex flex-col min-h-full"
              style={{
                width: deviceWidths[previewDevice],
                maxWidth: "100%",
              }}
            >
              {/* Header Preview - Show default ONLY if page has content but no custom header */}
              {blocks.length > 0 && !blocks.some((b) => b.type === "Header") && (
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
              {blocks.length > 0 && !blocks.some((b) => b.type === "Footer") && (
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
