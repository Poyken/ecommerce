"use client";

import {
  getProductTranslationsAction,
  updateProductTranslationAction,
  translateTextAction,
} from "@/features/admin/actions";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/use-toast";
import { Product } from "@/types/models";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

/**
 * =====================================================================
 * PRODUCT TRANSLATION DIALOG - Đa ngôn ngữ cho sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-LANGUAGE SUPPORT:
 * - Cho phép dịch Tên và Mô tả sản phẩm sang các ngôn ngữ khác (EN/VI).
 * - Giúp website tiếp cận được khách hàng quốc tế.
 *
 * 2. DYNAMIC LOADING:
 * - Khi chọn một ngôn ngữ, hệ thống sẽ fetch bản dịch tương ứng từ database.
 * - Nếu chưa có bản dịch, sẽ hiển thị trống hoặc lấy dữ liệu mặc định.
 * =====================================================================
 */

interface ProductTranslation {
  locale: string;
  name: string;
  description: string;
}

export function ProductTranslationDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("products.translateTitle", { name: product.name })}
          </DialogTitle>
        </DialogHeader>
        {open && <ProductTranslationForm key={product.id} product={product} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductTranslationForm({ product }: { product: Product }) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocale] = useState("en");
  const [translations, setTranslations] = useState<ProductTranslation[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      // 1. Dịch tên
      const nameRes = await translateTextAction({
        text: product.name,
        targetLocale: locale,
      });

      // 2. Dịch mô tả (nếu có)
      let descRes: {
        success?: boolean;
        data?: { text: string };
        error?: string;
      } = {
        success: true,
        data: { text: product.description || "" },
      };
      if (product.description) {
        descRes = await translateTextAction({
          text: product.description,
          targetLocale: locale,
        });
      }

      if (nameRes.success && descRes.success) {
        setForm({
          name: nameRes.data?.text || form.name,
          description: descRes.data?.text || form.description,
        });
        toast({
          variant: "success",
          title: "AI Translate",
          description: "Content translated successfully!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Translation failed",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const loadTranslations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProductTranslationsAction(product.id);
      if (response.success && response.data) {
        setTranslations(response.data as ProductTranslation[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  useEffect(() => {
    const translation = translations.find((tr) => tr.locale === locale);
    if (translation) {
      setForm({
        name: translation.name || "",
        description: translation.description || "",
      });
    } else {
      setForm({
        name: locale === "en" ? product.name : "",
        description: locale === "en" ? product.description || "" : "",
      });
    }
  }, [locale, translations, product.name, product.description]);

  const isDirty = useMemo(() => {
    const existing = translations.find((tr) => tr.locale === locale);
    const original = existing || {
      name: locale === "en" ? product.name : "",
      description: locale === "en" ? product.description || "" : "",
    };
    return (
      form.name !== original.name || form.description !== original.description
    );
  }, [form, locale, translations, product.name, product.description]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProductTranslationAction(product.id, {
        locale,
        ...form,
      } as any);

      if (result.success) {
        toast({
          title: t("success"),
          description: t("products.translateSuccess"),
        });
        loadTranslations();
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="flex items-end gap-3">
        <div className="space-y-2 flex-1">
          <Label>{t("products.selectLocale")}</Label>
          <Select value={locale} onValueChange={(val) => setLocale(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("languages.en")}</SelectItem>
              <SelectItem value="vi">{t("languages.vi")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAutoTranslate}
          disabled={isTranslating || locale === "en"}
          className="mb-0.5 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isTranslating ? "Translating..." : "Auto-Translate"}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{t("name")}</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t("description")}</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? t("loading") : t("save")}
        </Button>
      </div>
    </form>
  );
}
