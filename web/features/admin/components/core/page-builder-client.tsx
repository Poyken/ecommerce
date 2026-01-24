"use client";

import dynamic from "next/dynamic";

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
import { Page, Block } from "@/types/cms";

const HeroEditor = dynamic(() =>
  import("./blocks/hero-editor").then((mod) => mod.HeroEditor)
);

const FeaturedCollectionEditor = dynamic(() =>
  import("./blocks/featured-collection-editor").then(
    (mod) => mod.FeaturedCollectionEditor
  )
);

const PromoBannerEditor = dynamic(() =>
  import("./blocks/promo-banner-editor").then((mod) => mod.PromoBannerEditor)
);

const FeaturesEditor = dynamic(() =>
  import("./blocks/features-editor").then((mod) => mod.FeaturesEditor)
);

const PromoGridEditor = dynamic(() =>
  import("./blocks/promo-grid-editor").then((mod) => mod.PromoGridEditor)
);

const BannerEditor = dynamic(() =>
  import("./blocks/banner-editor").then((mod) => mod.BannerEditor)
);

const TextBlockEditor = dynamic(() =>
  import("./blocks/text-block-editor").then((mod) => mod.TextBlockEditor)
);

const CTASectionEditor = dynamic(() =>
  import("./blocks/cta-section-editor").then((mod) => mod.CTASectionEditor)
);

const StatsEditor = dynamic(() =>
  import("./blocks/stats-editor").then((mod) => mod.StatsEditor)
);

const PricingEditor = dynamic(() =>
  import("./blocks/pricing-editor").then((mod) => mod.PricingEditor)
);

const NewsletterEditor = dynamic(() =>
  import("./blocks/newsletter-editor").then((mod) => mod.NewsletterEditor)
);

const TestimonialsEditor = dynamic(() =>
  import("./blocks/testimonials-editor").then((mod) => mod.TestimonialsEditor)
);

const FaqEditor = dynamic(() =>
  import("./blocks/faq-editor").then((mod) => mod.FaqEditor)
);

const CategoriesEditor = dynamic(() =>
  import("./blocks/categories-editor").then((mod) => mod.CategoriesEditor)
);

const BrandsEditor = dynamic(() =>
  import("./blocks/brands-editor").then((mod) => mod.BrandsEditor)
);

const ProductsEditor = dynamic(() =>
  import("./blocks/products-editor").then((mod) => mod.ProductsEditor)
);

const DealEditor = dynamic(() =>
  import("./blocks/deal-editor").then((mod) => mod.DealEditor)
);

const FlexLayoutEditor = dynamic(() =>
  import("./blocks/flex-layout-editor").then((mod) => mod.FlexLayoutEditor)
);

const VideoHeroEditor = dynamic(() =>
  import("./blocks/video-hero-editor").then((mod) => mod.VideoHeroEditor)
);

const HeaderEditor = dynamic(() =>
  import("./blocks/header-editor").then((mod) => mod.HeaderEditor)
);

const FooterEditor = dynamic(() =>
  import("./blocks/footer-editor").then((mod) => mod.FooterEditor)
);



// Local components use types from types/cms



// FlexibleIcon moved to @/components/shared/flexible-icon.tsx

// Page interface moved to @/types/cms

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
          <HeroEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );
      case "FeaturedCollection":
        return (
          <FeaturedCollectionEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );
      case "PromoBanner":
        return (
          <PromoBannerEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Features":
        return (
          <FeaturesEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "PromoGrid":
        return (
          <PromoGridEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Banner":
        return (
          <BannerEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "TextBlock":
        return (
          <TextBlockEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "CTASection":
        return (
          <CTASectionEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Stats":
        return (
          <StatsEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
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
                          (_: unknown, i: number) => i !== idx
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
          <CategoriesEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Brands":
        return (
          <BrandsEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Products":
        return (
          <ProductsEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Deal":
        return (
          <DealEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Pricing":
        return (
          <PricingEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Newsletter":
        return (
          <NewsletterEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Testimonials":
        return (
          <TestimonialsEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "FAQ":
        return (
          <FaqEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "FlexLayout":
        return (
          <FlexLayoutEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "VideoHero":
        return (
          <VideoHeroEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Header":
        return (
          <HeaderEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
        );

      case "Footer":
        return (
          <FooterEditor
            block={block}
            onChange={(newProps) => updateBlockProps(block.id, newProps)}
          />
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
