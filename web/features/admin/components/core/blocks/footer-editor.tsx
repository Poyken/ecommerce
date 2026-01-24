
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { BlockEditorProps } from "./types";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  url: string;
}

export function FooterEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {["dark", "minimal", "brushed"].map((t) => (
            <Button
              key={t}
              variant={
                (block.props.theme || "dark") === t ? "default" : "outline"
              }
              size="sm"
              className="text-[10px] capitalize"
              onClick={() => onChange({ theme: t })}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border p-2 rounded-lg bg-muted/20 mt-4">
        <Label className="text-xs">Show Contact Info</Label>
        <Switch
          checked={block.props.showContact !== false}
          onCheckedChange={(checked) => onChange({ showContact: checked })}
        />
      </div>
      <div className="space-y-2">
        <Label>Company Name</Label>
        <Input
          value={block.props.companyName || ""}
          onChange={(e) => onChange({ companyName: e.target.value })}
          placeholder="Luxe Premium"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={block.props.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Footer description text..."
          rows={3}
        />
      </div>

      <div className="pt-4 border-t space-y-4">
        <Label className="text-xs uppercase opacity-50 font-bold">
          Navigation Columns
        </Label>
        <div className="space-y-4">
          {(block.props.columns || []).map(
            (col: FooterColumn, colIdx: number) => (
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
                      onChange({ columns: newCols });
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
                        (_: unknown, i: number) => i !== colIdx
                      );
                      onChange({ columns: newCols });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 pl-4 border-l-2">
                  {(col.links || []).map((link: FooterLink, linkIdx: number) => (
                    <div key={linkIdx} className="flex gap-2">
                      <Input
                        value={link.label || ""}
                        onChange={(e) => {
                          const newCols = [...(block.props.columns || [])];
                          const newLinks = [...(newCols[colIdx].links || [])];
                          newLinks[linkIdx] = {
                            ...newLinks[linkIdx],
                            label: e.target.value,
                          };
                          newCols[colIdx] = {
                            ...newCols[colIdx],
                            links: newLinks,
                          };
                          onChange({ columns: newCols });
                        }}
                        placeholder="Label"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={link.href || ""}
                        onChange={(e) => {
                          const newCols = [...(block.props.columns || [])];
                          const newLinks = [...(newCols[colIdx].links || [])];
                          newLinks[linkIdx] = {
                            ...newLinks[linkIdx],
                            href: e.target.value,
                          };
                          newCols[colIdx] = {
                            ...newCols[colIdx],
                            links: newLinks,
                          };
                          onChange({ columns: newCols });
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
                          ).filter((_: unknown, i: number) => i !== linkIdx);
                          newCols[colIdx] = {
                            ...newCols[colIdx],
                            links: newLinks,
                          };
                          onChange({ columns: newCols });
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
                      onChange({ columns: newCols });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Link
                  </Button>
                </div>
              </Card>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => {
              const newCols = [
                ...(block.props.columns || []),
                { title: "New Column", links: [] },
              ];
              onChange({ columns: newCols });
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
            (social: SocialLink, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={social.platform || ""}
                  onChange={(e) => {
                    const newSocials = [...(block.props.socialLinks || [])];
                    newSocials[idx] = {
                      ...newSocials[idx],
                      platform: e.target.value,
                    };
                    onChange({
                      socialLinks: newSocials,
                    });
                  }}
                  placeholder="Platform"
                  className="flex-1 h-8 text-xs"
                />
                <Input
                  value={social.url || ""}
                  onChange={(e) => {
                    const newSocials = [...(block.props.socialLinks || [])];
                    newSocials[idx] = {
                      ...newSocials[idx],
                      url: e.target.value,
                    };
                    onChange({
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
                    const newSocials = (block.props.socialLinks || []).filter(
                      (_: unknown, i: number) => i !== idx
                    );
                    onChange({
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
              onChange({ socialLinks: newSocials });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Social Link
          </Button>
        </div>
      </div>
    </div>
  );
}
