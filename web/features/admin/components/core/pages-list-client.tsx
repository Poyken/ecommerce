"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deletePageAction } from "@/features/admin/actions";
import { AdminActionBadge, AdminEmptyState, AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";
import { Link } from "@/i18n/routing";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Edit, ExternalLink, Plus, Trash2, Layout, Clock, Globe } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
import { m } from "framer-motion";

const CreatePageDialog = dynamic(
  () =>
    import("@/features/admin/components/content/create-page-dialog").then(
      (mod) => mod.CreatePageDialog
    ),
  { ssr: false }
);

const DeleteConfirmDialog = dynamic(
  () =>
    import("@/features/admin/components/shared/delete-confirm-dialog").then(
      (mod) => mod.DeleteConfirmDialog
    ),
  { ssr: false }
);

interface PagesListClientProps {
  initialPages: any[];
}

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const t = useTranslations("admin.pages");
  const { isPending } = useAdminTable("/admin/pages");

  const pages = initialPages;

  const handleDelete = async () => {
    if (!selectedPage) return { success: false, error: "No page selected" };
    const res = await deletePageAction(selectedPage.id);
    return res;
  };

  const openDelete = (page: any) => {
    setSelectedPage(page);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white">{t("allPages")}</h3>
                <p className="text-xs text-muted-foreground font-medium">{pages.length} pages total in your CMS</p>
            </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          variant="aurora"
          size="lg"
          className="rounded-2xl px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t("createNew")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page: any, index) => (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={page.id}
            className="group relative glass-premium rounded-3xl border border-white/5 p-6 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <AdminActionBadge 
                    label={page.isPublished ? t("status.published") : t("status.draft")} 
                    variant={page.isPublished ? "success" : "default"}
                />
                <code className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded-lg text-muted-foreground">
                    {page.slug}
                </code>
              </div>

              <h4 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {page.title}
              </h4>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {format(new Date(page.updatedAt), "MMM dd, yyyy")}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    {page.slug === "/" ? "Main Entrance" : "Landing Page"}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-white/10">
                        <Link href={page.slug === "home" || page.slug === "/" ? "/" : `/${page.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDelete(page)}
                        className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive/70 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                
                <Button variant="premium" className="rounded-xl px-6 group/btn" asChild>
                    <Link href={`/admin/pages/${page.id}`}>
                        <Edit className="mr-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                        {t("actions.build")}
                    </Link>
                </Button>
              </div>
            </div>
          </m.div>
        ))}
      </div>

      {pages.length === 0 && (
        <AdminEmptyState 
            icon={Layout} 
            title={t("table.noPages")} 
            description="Start building your digital presence by creating your first custom page."
            action={
                <Button onClick={() => setIsCreateOpen(true)} variant="aurora">
                    Create First Page
                </Button>
            }
        />
      )}

      <CreatePageDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {selectedPage && (
        <DeleteConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title={t("delete.title")}
          description={t("delete.description", { title: selectedPage.title })}
          action={handleDelete}
          confirmLabel={t("delete.confirm")}
        />
      )}
    </div>
  );
}
