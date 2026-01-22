"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deletePageAction } from "@/features/admin/actions";
import { AdminActionBadge, AdminEmptyState, AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { Link } from "@/i18n/routing";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Edit, ExternalLink, Plus, Trash2, Layout, Clock, Globe } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
import { m } from "framer-motion";
import { Page } from "@/types/cms";

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
  initialPages: Page[];
}

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const t = useTranslations("admin.pages");
  const { isPending } = useAdminTable("/admin/pages");

  const pages = initialPages;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedPage) return { success: false, error: "No page selected" };
    console.log("Deleting page with ID:", selectedPage.id);
    const res = await deletePageAction(selectedPage.id);
    if (!res.success) {
        console.error("Delete failed:", res.error);
    }
    return res;
  };

  const openDelete = (page: Page) => {
    setSelectedPage(page);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-80">
            <AdminSearchInput
                placeholder={t("searchPlaceholder") || "Search pages..."}
                value={searchTerm}
                onChange={setSearchTerm}
            />
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createNew")}
        </Button>
      </div>

      {filteredPages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page: Page, index) => (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={page.id}
              className="group relative bg-card rounded-3xl border border-border/50 p-6 hover:border-sky-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-colors" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <AdminActionBadge 
                      label={page.isPublished ? t("status.published") : t("status.draft")} 
                      variant={page.isPublished ? "success" : "default"}
                  />
                  <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded-lg text-muted-foreground border border-border/50">
                      {page.slug}
                  </code>
                </div>

                <h4 className="text-xl font-black text-foreground mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">
                  {page.title}
                </h4>
                
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      Updated {page.updatedAt ? format(new Date(page.updatedAt), "MMM dd, yyyy") : "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Globe className="h-3.5 w-3.5" />
                      {page.slug === "/" ? "Main Entrance" : "Landing Page"}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-muted hover:text-sky-600">
                          <Link href={page.slug === "home" || page.slug === "/" ? "/" : `/${page.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                          </Link>
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDelete(page)}
                          className="h-10 w-10 rounded-xl hover:bg-rose-500/10 text-rose-500/70 hover:text-rose-500"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                  
                  <Button variant="outline" className="rounded-xl px-6 group/btn border-sky-200 hover:bg-sky-50 hover:text-sky-700" asChild>
                      <Link href={`/admin/pages/${page.id}`}>
                          <Edit className="mr-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform text-sky-500" />
                          {t("actions.build")}
                      </Link>
                  </Button>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      )}

      {filteredPages.length === 0 && (
        <AdminEmptyState 
            icon={Layout} 
            title={t("table.noPages")} 
            description="Start building your digital presence by creating your first custom page."
            action={
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
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
