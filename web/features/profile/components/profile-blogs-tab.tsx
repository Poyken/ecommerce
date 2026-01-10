"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import { DeleteConfirmDialog } from "@/features/admin/components/dialogs/delete-confirm-dialog";
import { deleteBlogAction, getMyBlogsAction } from "@/features/blog/actions";
import { BlogFormDialog } from "@/features/blog/components/blog-form-dialog";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { BlogWithProducts } from "@/types/models";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { Calendar, Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * PROFILE BLOGS TAB - Quản lý bài viết cá nhân
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER GENERATED CONTENT (UGC):
 * - Cho phép người dùng tự tạo bài viết (Blog) để chia sẻ trên cộng đồng.
 * - API `getMyBlogsAction` sẽ chỉ trả về các bài viết do user hiện tại tạo (`where: { authorId: user.id }`).
 *
 * 2. REUSABLE COMPONENTS:
 * - Sử dụng lại `BlogFormDialog` của trang Admin.
 *   + Prop `isUserMode={true}` giúp ẩn các trường chỉ dành cho Admin (như Featured, Tags nâng cao).
 *
 * 3. STATE MANAGEMENT:
 * - `selectedBlog`: Lưu bài viết đang được chọn để Edit. Nếu null -> Mode Create.
 * - `itemToDelete`: Lưu item đang chờ xóa để hiện Confirm Dialog.
 * =====================================================================
 */
export function ProfileBlogsTab() {
  const t = useTranslations("admin.blogs");
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogWithProducts | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<BlogWithProducts | null>(
    null
  );

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const res = await getMyBlogsAction();
      if (res.success && res.data) {
        setBlogs(res.data);
      } else if (res.error) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: res.error,
        });
      }
    } catch (error) {
      console.error("Failed to fetch my blogs", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCreate = () => {
    setSelectedBlog(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (blog: BlogWithProducts) => {
    setSelectedBlog(blog);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return { error: "No item selected" };

    try {
      const res = await deleteBlogAction(itemToDelete.id);
      if (res.success) {
        fetchBlogs();
      }
      return res;
    } catch (error) {
      console.error("Delete error:", error);
      return { error: t("errorMessage") };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <>
        <GlassCard className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">{t("noPosts")}</h3>
          <p className="text-muted-foreground mb-6">{t("createDescription")}</p>
          <GlassButton
            className="bg-primary text-primary-foreground"
            onClick={handleCreate}
          >
            {t("createButton")}
          </GlassButton>
        </GlassCard>
        <BlogFormDialog
          key={selectedBlog?.id || (isCreateDialogOpen ? "new" : "closed")}
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setSelectedBlog(null);
          }}
          onSuccess={fetchBlogs}
          blog={selectedBlog}
          isUserMode={true}
          defaultAuthor=""
          categories={[]}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("totalPosts", { count: blogs.length })}
          </p>
        </div>
        <GlassButton
          onClick={handleCreate}
          className="bg-primary text-primary-foreground gap-2"
        >
          <Plus size={16} />
          {t("createButton")}
        </GlassButton>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {blogs.map((blog, index) => {
            const isPublished = !!blog.publishedAt;
            return (
              <m.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 transition-all hover:bg-white/10 group border border-transparent hover:border-primary/20">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-lg text-foreground truncate max-w-md">
                          {blog.title}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            isPublished
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          )}
                        >
                          {isPublished ? t("published") : t("draft")}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {blog.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {format(new Date(blog.createdAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                            {blog.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="ghost"
                        onClick={() => handleEdit(blog)}
                      >
                        <Edit size={16} />
                      </GlassButton>

                      <GlassButton
                        variant="ghost"
                        className="group-hover:bg-destructive/10 group-hover:text-destructive text-muted-foreground"
                        onClick={() => setItemToDelete(blog)}
                      >
                        <Trash2 size={16} />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
      <BlogFormDialog
        key={selectedBlog?.id || (isCreateDialogOpen ? "new" : "closed")}
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setSelectedBlog(null);
        }}
        onSuccess={fetchBlogs}
        blog={selectedBlog}
        isUserMode={true}
        defaultAuthor=""
        categories={[]}
      />
      <DeleteConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        action={handleDelete}
        title={t("deleteTitle")}
        description={t("deleteConfirm", { title: itemToDelete?.title || "" })}
      />
    </div>
  );
}
