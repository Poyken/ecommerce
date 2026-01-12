"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import { LazyRichTextEditor as RichTextEditor } from "@/components/shared/lazy-rich-text-editor";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategoriesAction,
  getProductsAction,
} from "@/features/admin/actions";
import { createBlogAction, updateBlogAction } from "@/features/blog/actions";
import { m } from "@/lib/animations";
import { BlogWithProducts, Category, Product } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * BLOG FORM DIALOG - Form tạo/sửa bài viết (Modal)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTROLLED COMPONENTS:
 * - Form này không dùng libraries như React Hook Form mà dùng Local State (`formData`).
 * - Ưu điểm: Dễ hiểu luồng dữ liệu, dễ custom logic phức tạp (như auto-slug, related products).
 * - Nhược điểm: Re-render nhiều mỗi khi gõ phím (nhưng với form nhỏ/dialog thì không đáng kể).
 *
 * 2. USE TRANSITION:
 * - `startTransition`: Đánh dấu việc submit form là "việc phụ" (low priority).
 * - Giúp UI không bị đơ (freeze) nếu logic submit quá nặng, đồng thời cung cấp biến `isPending` để hiện loading spinner.
 *
 * 3. CLIENT-SIDE VALIDATION:
 * - Hàm `validate()` kiểm tra dữ liệu trước khi gọi API.
 * - Giúp giảm tải cho Server và phản hồi tức thì cho User (Better UX).
 *
 * 4. DYNAMIC SELECTS:
 * - Categories và Products được fetch ngay khi mở Dialog (`useEffect`) để đảm bảo dữ liệu mới nhất. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
interface BlogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog?: BlogWithProducts | null;
  categories: Category[]; // Passed from parent or fetched? Admin passes it. User might need fetch.
  // Actually, to make it shared self-contained, fetching inside is better if we want to avoid prop drilling,
  // but AdminPage fetches categories server-side/client-side efficiently.
  // Let's keep categories prop for flexibility, or make it optional and fetch if missing.
  // Admin passes it. Profile will pass it (fetched inside ProfileTab).
  onSuccess?: () => void;
  isUserMode?: boolean;
  defaultAuthor?: string;
}

export function BlogFormDialog({
  open,
  onOpenChange,
  blog,
  categories: initialCategories = [],
  onSuccess,
  isUserMode = false,
  defaultAuthor = "",
}: BlogFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useTranslations("admin.blogs");
  const isEditing = !!blog;

  // Local categories state if we need to fetch them
  const [categories, setCategories] = useState<Category[]>(
    Array.isArray(initialCategories) ? initialCategories : []
  );

  const [formData, setFormData] = useState({
    title: blog?.title || "",
    slug: blog?.slug || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    category: blog?.category || "",
    author: blog?.author || defaultAuthor,
    language: blog?.language || "en",
    readTime: blog?.readTime ? blog.readTime.replace(/[^0-9]/g, "") : "",
    image: blog?.image || "",
    productIds: blog?.products?.map((p) => p.id) || ([] as string[]),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products and categories when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      const productsRes = await getProductsAction({ page: 1, limit: 100 });
      if ("data" in productsRes) {
        setProducts(productsRes.data || []);
      }

      if (categories.length === 0) {
        const catsRes = await getCategoriesAction(1, 100);
        if (catsRes.success && catsRes.data) {
          const fetchedCats = catsRes.data;
          setCategories(fetchedCats);
          // Set default category if creating
          if (!blog && !formData.category && fetchedCats.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category: fetchedCats[0].name,
            }));
          }
        }
      }
    };

    fetchData();
    // Reset/Init local state like imageFile and errors
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageFile(null);

    setErrors({});
  }, [open, blog, categories.length, formData.category]);

  // Update categories if initialCategories prop changes
  useEffect(() => {
    if (
      initialCategories &&
      Array.isArray(initialCategories) &&
      initialCategories.length > 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Update default author if changed in UserMode
  useEffect(() => {
    if (!isEditing && isUserMode && defaultAuthor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({ ...prev, author: defaultAuthor }));
    }
  }, [defaultAuthor, isUserMode, isEditing]);

  const isDirty = useMemo(() => {
    const isBasicInfoDirty =
      formData.title !== (blog?.title || "") ||
      formData.slug !== (blog?.slug || "") ||
      formData.excerpt !== (blog?.excerpt || "") ||
      formData.content !== (blog?.content || "") ||
      formData.category !== (blog?.category || "") ||
      formData.author !== (blog?.author || defaultAuthor) ||
      formData.language !== (blog?.language || "en") ||
      formData.readTime !==
        (blog?.readTime ? blog.readTime.replace(/[^0-9]/g, "") : "");

    if (isBasicInfoDirty) return true;

    if (imageFile !== null) return true;

    // Check products
    const originalProductIds = blog?.products?.map((p) => p.id).sort() || [];
    const currentProductIds = [...formData.productIds].sort();
    if (
      JSON.stringify(originalProductIds) !== JSON.stringify(currentProductIds)
    )
      return true;

    return false;
  }, [formData, imageFile, blog, defaultAuthor]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title)
      newErrors.title = t("validation.titleRequired") || "Title is required";
    if (!formData.slug)
      newErrors.slug = t("validation.slugRequired") || "Slug is required";
    if (!formData.excerpt)
      newErrors.excerpt =
        t("validation.excerptRequired") || "Excerpt is required";
    if (!formData.content || formData.content === "<p></p>")
      newErrors.content =
        t("validation.contentRequired") || "Content is required";
    if (!formData.category)
      newErrors.category =
        t("validation.categoryRequired") || "Category is required";
    if (!formData.author && !isUserMode)
      newErrors.author = t("validation.authorRequired") || "Author is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      let data: any;

      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("slug", formData.slug);
        formDataToSend.append("excerpt", formData.excerpt);
        formDataToSend.append("content", formData.content);
        formDataToSend.append("category", formData.category);
        formDataToSend.append("author", formData.author);
        formDataToSend.append("language", formData.language);
        formDataToSend.append(
          "readTime",
          formData.readTime ? `${formData.readTime} min read` : ""
        );
        formDataToSend.append("image", imageFile);
        formData.productIds.forEach((id) =>
          formDataToSend.append("productIds[]", id)
        );
        data = formDataToSend;
      } else {
        data = {
          ...formData,
          readTime: formData.readTime ? `${formData.readTime} min read` : "",
        };
      }

      const result = isEditing
        ? await updateBlogAction(blog.id, data)
        : await createBlogAction(data);

      if (result.success) {
        toast({
          variant: "success",
          title: t(isEditing ? "updated" : "created"),
          description: t(isEditing ? "updateSuccess" : "createSuccess"),
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: t("error"),
          description: result.error || t("errorMessage"),
          variant: "destructive",
        });
      }
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t("editPost") : t("createPost")}
      description={isEditing ? t("editDescription") : t("createDescription")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={isEditing ? t("updateBlog") : t("createBlog")}
      maxWidth="max-w-4xl"
      disabled={isPending || !isDirty}
    >
      <div className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("fields.title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  title,
                  slug: !isEditing ? generateSlug(title) : prev.slug,
                }));
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              disabled={isPending}
              className={errors.title ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.title && (
                <m.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.title}
                </m.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("fields.slug")} *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, slug: e.target.value }));
                if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
              }}
              disabled={isPending} // Allowed to edit slug? Yes, same as Admin.
              placeholder="auto-generated-from-title"
              className={errors.slug ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.slug && (
                <m.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.slug}
                </m.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">{t("fields.excerpt")} *</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, excerpt: e.target.value }));
              if (errors.excerpt)
                setErrors((prev) => ({ ...prev, excerpt: "" }));
            }}
            disabled={isPending}
            rows={2}
            placeholder={t("placeholders.excerpt")}
            className={errors.excerpt ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.excerpt && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.excerpt}
              </m.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.content")} *</Label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => {
              setFormData((prev) => ({ ...prev, content }));
              if (errors.content)
                setErrors((prev) => ({ ...prev, content: "" }));
            }}
            placeholder={t("placeholders.content")}
          />
          <AnimatePresence>
            {errors.content && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.content}
              </m.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t("fields.category")} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, category: value }));
                if (errors.category)
                  setErrors((prev) => ({ ...prev, category: "" }));
              }}
              disabled={isPending}
            >
              <SelectTrigger
                className={errors.category ? "border-destructive" : ""}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(categories) &&
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <AnimatePresence>
              {errors.category && (
                <m.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.category}
                </m.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t("fields.language")} *</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, language: value }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("languages.en")}</SelectItem>
                <SelectItem value="vi">{t("languages.vi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author">{t("fields.author")} *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, author: e.target.value }));
                if (errors.author)
                  setErrors((prev) => ({ ...prev, author: "" }));
              }}
              disabled={isPending || isUserMode} // Disabled in User Mode
              autoComplete="off"
              placeholder="John Doe"
              className={errors.author ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.author && (
                <m.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.author}
                </m.p>
              )}
              {isUserMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  Author name will be automatically set to your name.
                </p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="readTime">{t("fields.readTime")}</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="readTime"
                type="number"
                min="1"
                value={formData.readTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    readTime: e.target.value,
                  }))
                }
                disabled={isPending}
                placeholder="5"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {t("minutes")}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.relatedProducts")}</Label>
          <ScrollArea className="h-48 border rounded-md p-4 bg-white/5">
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={formData.productIds.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                    disabled={isPending}
                  />
                  <label
                    htmlFor={`product-${product.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
                  >
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.featuredImage")}</Label>
          <ImageUpload
            value={imageFile ? undefined : formData.image}
            onChange={(file) => setImageFile(file)}
            onRemove={() => {
              setImageFile(null);
              setFormData((prev) => ({ ...prev, image: "" }));
            }}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
