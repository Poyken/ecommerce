"use client";

import { deleteBlogAction } from "@/actions/blog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { BlogWithProducts, Category } from "@/types/models";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BlogFormDialog } from "./blog-form-dialog";
// import { DeleteBlogDialog } from "./delete-blog-dialog";

interface BlogsClientProps {
  blogs: BlogWithProducts[];
  categories: Category[];
}

export function BlogsClient({ blogs, categories }: BlogsClientProps) {
  const t = useTranslations("admin.blogs");
  const { hasPermission } = useAuth();
  const [selectedBlog, setSelectedBlog] = useState<BlogWithProducts | null>(
    null
  );
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canCreate = hasPermission("blog:create");
  const canUpdate = hasPermission("blog:update");
  const canDelete = hasPermission("blog:delete");

  const handleCreate = () => {
    setSelectedBlog(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (blog: BlogWithProducts) => {
    setSelectedBlog(blog);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (blog: BlogWithProducts) => {
    setSelectedBlog(blog);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{t("allPosts")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("totalPosts", { count: blogs.length })}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createButton")}
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead>{t("table.language")}</TableHead>
                <TableHead>{t("table.author")}</TableHead>
                <TableHead>{t("table.published")}</TableHead>
                {(canUpdate || canDelete) && (
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canUpdate || canDelete ? 6 : 5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    {t("noPosts")}
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {blog.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{blog.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          blog.language === "en" ? "default" : "secondary"
                        }
                      >
                        {blog.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{blog.author}</TableCell>
                    <TableCell>
                      {blog.publishedAt ? (
                        formatDate(blog.publishedAt)
                      ) : (
                        <StatusBadge status="DRAFT" label={t("draft")} />
                      )}
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(blog)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(blog)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {canCreate || canUpdate ? (
        <BlogFormDialog
          key={selectedBlog?.id || "new"}
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          blog={selectedBlog}
          categories={categories}
        />
      ) : null}

      {canDelete && selectedBlog && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t("deleteTitle")}
          description={t("deleteConfirm", { title: selectedBlog.title })}
          action={() => deleteBlogAction(selectedBlog.id)}
          confirmLabel={t("delete")}
          successMessage={t("deleteSuccess")}
        />
      )}
    </>
  );
}
