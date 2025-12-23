"use client";

import { getProductsAction } from "@/actions/admin";
import { createBlogAction, updateBlogAction } from "@/actions/blog";
import { Checkbox } from "@/components/atoms/checkbox";
import { FormDialog } from "@/components/atoms/form-dialog";
import { ImageUpload } from "@/components/atoms/image-upload";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ScrollArea } from "@/components/atoms/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { RichTextEditor } from "@/components/molecules/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { BlogWithProducts, Category, Product } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

interface BlogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog?: BlogWithProducts | null;
  categories: Category[];
}

export function BlogFormDialog({
  open,
  onOpenChange,
  blog,
  categories,
}: BlogFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useTranslations("admin.blogs");
  const isEditing = !!blog;

  const [formData, setFormData] = useState({
    title: blog?.title || "",
    slug: blog?.slug || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    category: blog?.category || "",
    author: blog?.author || "",
    language: blog?.language || "en",
    readTime: blog?.readTime ? blog.readTime.replace(/[^0-9]/g, "") : "",
    image: blog?.image || "",
    productIds: blog?.products?.map((p) => p.id) || ([] as string[]),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await getProductsAction(1, 100);
      if ("data" in response) {
        setProducts(response.data || []);
      }
    };
    if (open) {
      fetchProducts();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (blog) {
        setFormData({
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          author: blog.author,
          language: blog.language,
          readTime: blog.readTime ? blog.readTime.replace(/[^0-9]/g, "") : "",
          image: blog.image || "",
          productIds: blog.products?.map((p) => p.id) || [],
        });
      } else {
        setFormData({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          category: categories[0]?.name || "",
          author: "",
          language: "en",
          readTime: "",
          image: "",
          productIds: [],
        });
      }
      setImageFile(null);
      setErrors({});
    }
  }, [blog, open, categories]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title)
      newErrors.title = t("titleRequired") || "Title is required";
    if (!formData.slug)
      newErrors.slug = t("slugRequired") || "Slug is required";
    if (!formData.excerpt)
      newErrors.excerpt = t("excerptRequired") || "Excerpt is required";
    if (!formData.content || formData.content === "<p></p>")
      newErrors.content = t("contentRequired") || "Content is required";
    if (!formData.category)
      newErrors.category = t("categoryRequired") || "Category is required";
    if (!formData.author)
      newErrors.author = t("authorRequired") || "Author is required";

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
    >
      <div className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("title")} *</Label>
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
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.title}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")} *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, slug: e.target.value }));
                if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
              }}
              disabled={isPending}
              placeholder="auto-generated-from-title"
              className={errors.slug ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.slug && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.slug}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">{t("excerpt")} *</Label>
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
            placeholder={t("excerptPlaceholder")}
            className={errors.excerpt ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.excerpt && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.excerpt}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Label>{t("content")} *</Label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => {
              setFormData((prev) => ({ ...prev, content }));
              if (errors.content)
                setErrors((prev) => ({ ...prev, content: "" }));
            }}
            placeholder={t("contentPlaceholder")}
          />
          <AnimatePresence>
            {errors.content && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.content}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t("category")} *</Label>
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
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AnimatePresence>
              {errors.category && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.category}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t("language")} *</Label>
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
            <Label htmlFor="author">{t("author")} *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, author: e.target.value }));
                if (errors.author)
                  setErrors((prev) => ({ ...prev, author: "" }));
              }}
              disabled={isPending}
              placeholder="John Doe"
              className={errors.author ? "border-destructive" : ""}
            />
            <AnimatePresence>
              {errors.author && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.author}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="readTime">{t("readTime")}</Label>
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
          <Label>{t("relatedProducts")}</Label>
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
          <Label>{t("featuredImage")}</Label>
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
