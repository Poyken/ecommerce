

"use client";

import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/features/address/actions";
import { AddressDisplay } from "@/features/address/components/address-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { AddAddressDialog } from "@/features/admin/components/users/add-address-dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";
import { Edit, MapPin, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Address } from "@/types/models";
// ... imports

export function ProfileAddressesTab({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteAddress = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const res = await deleteAddressAction(deleteId);
      if (res.success) {
        toast({ variant: "success", title: t("addresses.deleteSuccess") });
        router.refresh();
      } else {
        toast({
          title: tCommon("toast.error"),
          description: res.error,
          variant: "destructive",
        });
      }
      setDeleteId(null);
    });
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if (res.success) {
        toast({ variant: "success", title: t("addresses.defaultSuccess") });
        router.refresh();
      } else {
        toast({
          title: tCommon("toast.error"),
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const openEdit = (address: Address) => {
    setEditingAddress(address);
    setAddAddressOpen(true);
  };

  return (
    <>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="p-6 md:p-8 backdrop-blur-md border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {t("addresses.title")}
              </h2>
              <p className="text-base text-muted-foreground">
                {t("addresses.subtitle")}
              </p>
            </div>
            <GlassButton
              onClick={() => {
                setEditingAddress(null);
                setAddAddressOpen(true);
              }}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 border-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addresses.addNew")}
            </GlassButton>
          </div>

          <div className="space-y-4">
            {addresses && addresses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((addr: Address) => (
                  <div
                    key={addr.id}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col justify-between transition-all duration-300",
                      addr.isDefault
                        ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <div>
                      <AddressDisplay
                        name={addr.recipientName}
                        phone={addr.phoneNumber}
                        address={`${addr.street}, ${
                          addr.ward ? `${addr.ward}, ` : ""
                        }${addr.district}, ${addr.city}`}
                        isDefault={addr.isDefault}
                        defaultLabel={t("addresses.default")}
                        className="mb-4"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                      {!addr.isDefault && (
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={isPending}
                        >
                          {t("addresses.setDefault")}
                        </GlassButton>
                      )}
                      <GlassButton
                        variant="glass"
                        size="icon"
                        className="h-8 w-8 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 shadow-sm"
                        onClick={() => openEdit(addr)}
                        disabled={isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton
                        variant="glass"
                        size="icon"
                        className="h-8 w-8 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/30 shadow-sm"
                        onClick={() => setDeleteId(addr.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-xl border border-white/5 border-dashed">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{t("addresses.noAddresses")}</p>
              </div>
            )}
          </div>
        </GlassCard>
      </m.div>

      <AddAddressDialog
        open={addAddressOpen}
        onOpenChange={setAddAddressOpen}
        onSuccess={() => router.refresh()}
        address={editingAddress}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("addresses.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t("addresses.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/10">
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              {isPending ? tCommon("deleting") : t("addresses.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
