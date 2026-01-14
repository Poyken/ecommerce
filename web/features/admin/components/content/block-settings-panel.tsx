"use client";

/**
 * =====================================================================
 * BLOCK SETTINGS PANEL - Panel cấu hình block với 4 tabs
 * =====================================================================
 *
 * Tabs:
 * 1. Content - Cấu hình nội dung block
 * 2. Style - Cấu hình styles (spacing, colors, shadows)
 * 3. Animation - Cấu hình animation effects
 * 4. Visibility - Cấu hình hiển thị theo device/user
 *
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Eye,
  Monitor,
  Palette,
  Play,
  Settings,
  Smartphone,
  Tablet,
  Type,
} from "lucide-react";
import { useState } from "react";
import type {
  BlockAnimation,
  BlockStyles,
  BlockVisibility,
} from "@/features/home/types/block-types";

interface BlockSettingsPanelProps {
  blockType: string;
  props: Record<string, any>;
  onPropsChange: (newProps: Record<string, any>) => void;
  className?: string;
}

export function BlockSettingsPanel({
  blockType,
  props,
  onPropsChange,
  className,
}: BlockSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState("content");

  const styles: BlockStyles = props.styles || {};
  const visibility: BlockVisibility = props.visibility || {
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
  };
  const animation: BlockAnimation = props.animation || {
    type: "none",
    duration: 500,
    delay: 0,
    trigger: "scroll",
  };

  const updateStyles = (updates: Partial<BlockStyles>) => {
    onPropsChange({
      ...props,
      styles: { ...styles, ...updates },
    });
  };

  const updateVisibility = (updates: Partial<BlockVisibility>) => {
    onPropsChange({
      ...props,
      visibility: { ...visibility, ...updates },
    });
  };

  const updateAnimation = (updates: Partial<BlockAnimation>) => {
    onPropsChange({
      ...props,
      animation: { ...animation, ...updates },
    });
  };

  return (
    <div className={cn("bg-card border rounded-xl", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          <TabsTrigger
            value="content"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Type className="size-4 mr-2" />
            Nội dung
          </TabsTrigger>
          <TabsTrigger
            value="style"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Palette className="size-4 mr-2" />
            Style
          </TabsTrigger>
          <TabsTrigger
            value="animation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Play className="size-4 mr-2" />
            Animation
          </TabsTrigger>
          <TabsTrigger
            value="visibility"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Eye className="size-4 mr-2" />
            Hiển thị
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Cấu hình nội dung cho block <strong>{blockType}</strong>
          </div>

          {/* Dynamic content fields would be rendered here based on blockType */}
          <div className="space-y-4">
            {props.title !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={props.title || ""}
                  onChange={(e) =>
                    onPropsChange({ ...props, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề..."
                />
              </div>
            )}

            {props.subtitle !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="subtitle">Phụ đề</Label>
                <Input
                  id="subtitle"
                  value={props.subtitle || ""}
                  onChange={(e) =>
                    onPropsChange({ ...props, subtitle: e.target.value })
                  }
                  placeholder="Nhập phụ đề..."
                />
              </div>
            )}

            {props.content !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <textarea
                  id="content"
                  value={props.content || ""}
                  onChange={(e) =>
                    onPropsChange({ ...props, content: e.target.value })
                  }
                  placeholder="Nhập nội dung..."
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background"
                />
              </div>
            )}

            {props.ctaText !== undefined && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Nút CTA</Label>
                  <Input
                    id="ctaText"
                    value={props.ctaText || ""}
                    onChange={(e) =>
                      onPropsChange({ ...props, ctaText: e.target.value })
                    }
                    placeholder="Text nút..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaLink">Link CTA</Label>
                  <Input
                    id="ctaLink"
                    value={props.ctaLink || ""}
                    onChange={(e) =>
                      onPropsChange({ ...props, ctaLink: e.target.value })
                    }
                    placeholder="/path..."
                  />
                </div>
              </div>
            )}

            {props.columns !== undefined && (
              <div className="space-y-2">
                <Label>Số cột</Label>
                <Select
                  value={String(props.columns)}
                  onValueChange={(val) =>
                    onPropsChange({ ...props, columns: Number(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 cột</SelectItem>
                    <SelectItem value="3">3 cột</SelectItem>
                    <SelectItem value="4">4 cột</SelectItem>
                    <SelectItem value="5">5 cột</SelectItem>
                    <SelectItem value="6">6 cột</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {props.layout !== undefined && (
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={props.layout}
                  onValueChange={(val) =>
                    onPropsChange({ ...props, layout: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {props.alignment !== undefined && (
              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select
                  value={props.alignment}
                  onValueChange={(val) =>
                    onPropsChange({ ...props, alignment: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Trái</SelectItem>
                    <SelectItem value="center">Giữa</SelectItem>
                    <SelectItem value="right">Phải</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="p-4 space-y-6">
          {/* Container Width */}
          <div className="space-y-2">
            <Label>Chiều rộng container</Label>
            <Select
              value={styles.containerWidth || "container"}
              onValueChange={(val) =>
                updateStyles({ containerWidth: val as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full width</SelectItem>
                <SelectItem value="container">Container</SelectItem>
                <SelectItem value="narrow">Narrow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Padding */}
          <div className="space-y-3">
            <Label>Padding</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Top</span>
                <Input
                  value={styles.padding?.top || ""}
                  onChange={(e) =>
                    updateStyles({
                      padding: { ...styles.padding, top: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Bottom</span>
                <Input
                  value={styles.padding?.bottom || ""}
                  onChange={(e) =>
                    updateStyles({
                      padding: { ...styles.padding, bottom: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Left</span>
                <Input
                  value={styles.padding?.left || ""}
                  onChange={(e) =>
                    updateStyles({
                      padding: { ...styles.padding, left: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Right</span>
                <Input
                  value={styles.padding?.right || ""}
                  onChange={(e) =>
                    updateStyles({
                      padding: { ...styles.padding, right: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-3">
            <Label>Margin</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Top</span>
                <Input
                  value={styles.margin?.top || ""}
                  onChange={(e) =>
                    updateStyles({
                      margin: { ...styles.margin, top: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Bottom</span>
                <Input
                  value={styles.margin?.bottom || ""}
                  onChange={(e) =>
                    updateStyles({
                      margin: { ...styles.margin, bottom: e.target.value },
                    })
                  }
                  placeholder="0px"
                />
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <Label>Background</Label>
            <div className="flex gap-3">
              <Input
                value={styles.backgroundColor || ""}
                onChange={(e) =>
                  updateStyles({ backgroundColor: e.target.value })
                }
                placeholder="#ffffff hoặc rgba(...)"
                className="flex-1"
              />
              <input
                type="color"
                value={styles.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  updateStyles({ backgroundColor: e.target.value })
                }
                className="w-10 h-10 rounded-md border cursor-pointer"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label>Border Radius</Label>
            <Select
              value={styles.borderRadius || ""}
              onValueChange={(val) => updateStyles({ borderRadius: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="0.5rem">Small</SelectItem>
                <SelectItem value="1rem">Medium</SelectItem>
                <SelectItem value="1.5rem">Large</SelectItem>
                <SelectItem value="2rem">XLarge</SelectItem>
                <SelectItem value="9999px">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Box Shadow */}
          <div className="space-y-2">
            <Label>Box Shadow</Label>
            <Select
              value={styles.boxShadow || "none"}
              onValueChange={(val) => updateStyles({ boxShadow: val as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">XLarge</SelectItem>
                <SelectItem value="2xl">2XLarge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Classes */}
          <div className="space-y-2">
            <Label>Custom CSS Classes</Label>
            <Input
              value={styles.customClasses || ""}
              onChange={(e) => updateStyles({ customClasses: e.target.value })}
              placeholder="class1 class2 class3"
            />
          </div>
        </TabsContent>

        {/* Animation Tab */}
        <TabsContent value="animation" className="p-4 space-y-6">
          {/* Animation Type */}
          <div className="space-y-2">
            <Label>Loại Animation</Label>
            <Select
              value={animation.type}
              onValueChange={(val) => updateAnimation({ type: val as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                <SelectItem value="fade">Fade In</SelectItem>
                <SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="slide-down">Slide Down</SelectItem>
                <SelectItem value="slide-left">Slide Left</SelectItem>
                <SelectItem value="slide-right">Slide Right</SelectItem>
                <SelectItem value="zoom">Zoom In</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Thời gian (ms)</Label>
              <span className="text-sm text-muted-foreground">
                {animation.duration || 500}ms
              </span>
            </div>
            <Slider
              value={[animation.duration || 500]}
              min={100}
              max={2000}
              step={100}
              onValueChange={([val]) => updateAnimation({ duration: val })}
            />
          </div>

          {/* Delay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Delay (ms)</Label>
              <span className="text-sm text-muted-foreground">
                {animation.delay || 0}ms
              </span>
            </div>
            <Slider
              value={[animation.delay || 0]}
              min={0}
              max={1000}
              step={50}
              onValueChange={([val]) => updateAnimation({ delay: val })}
            />
          </div>

          {/* Trigger */}
          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select
              value={animation.trigger || "scroll"}
              onValueChange={(val) => updateAnimation({ trigger: val as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="load">Khi trang load</SelectItem>
                <SelectItem value="scroll">Khi scroll vào view</SelectItem>
                <SelectItem value="hover">Khi hover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Trigger animation preview
              }}
            >
              <Play className="size-4 mr-2" />
              Xem trước Animation
            </Button>
          </div>
        </TabsContent>

        {/* Visibility Tab */}
        <TabsContent value="visibility" className="p-4 space-y-6">
          <div className="text-sm text-muted-foreground mb-4">
            Chọn thiết bị và điều kiện hiển thị block
          </div>

          {/* Device Visibility */}
          <div className="space-y-4">
            <Label>Hiển thị trên thiết bị</Label>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Monitor className="size-5 text-muted-foreground" />
                <span>Desktop</span>
              </div>
              <Switch
                checked={visibility.showOnDesktop !== false}
                onCheckedChange={(checked) =>
                  updateVisibility({ showOnDesktop: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Tablet className="size-5 text-muted-foreground" />
                <span>Tablet</span>
              </div>
              <Switch
                checked={visibility.showOnTablet !== false}
                onCheckedChange={(checked) =>
                  updateVisibility({ showOnTablet: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-muted-foreground" />
                <span>Mobile</span>
              </div>
              <Switch
                checked={visibility.showOnMobile !== false}
                onCheckedChange={(checked) =>
                  updateVisibility({ showOnMobile: checked })
                }
              />
            </div>
          </div>

          {/* User Visibility */}
          <div className="space-y-4 pt-4 border-t">
            <Label>Điều kiện người dùng</Label>

            <div className="flex items-center justify-between py-2">
              <div>
                <span>Chỉ hiển thị khi đã đăng nhập</span>
                <p className="text-xs text-muted-foreground">
                  Ẩn block với khách vãng lai
                </p>
              </div>
              <Switch
                checked={visibility.showWhenLoggedIn === true}
                onCheckedChange={(checked) =>
                  updateVisibility({ showWhenLoggedIn: checked })
                }
              />
            </div>
          </div>

          {/* User Groups */}
          <div className="space-y-2">
            <Label>Nhóm người dùng</Label>
            <Input
              value={visibility.showForUserGroups?.join(", ") || ""}
              onChange={(e) =>
                updateVisibility({
                  showForUserGroups: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="VIP, Wholesale, Premium (phân cách bằng dấu phẩy)"
            />
            <p className="text-xs text-muted-foreground">
              Để trống để hiển thị với tất cả. Nhập tên group để giới hạn.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
