/**
 * =====================================================================
 * PROFILE ACCOUNT TAB - Tab quản lý thông tin tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AVATAR MANAGEMENT:
 * - Hỗ trợ xem trước ảnh (preview) ngay khi chọn file.
 * - Cho phép xóa avatar hiện tại hoặc tải lên ảnh mới.
 *
 * 2. FORM STATE (`isDirty`):
 * - Nút "Save Changes" chỉ sáng lên khi người dùng thực sự có thay đổi thông tin (tên hoặc ảnh).
 * - Giúp tránh việc gọi API không cần thiết.
 *
 * 3. SERVER ACTIONS:
 * - Sử dụng `updateProfileAction` để cập nhật thông tin lên server một cách an toàn.
 * =====================================================================
 */

"use client";

import { updateProfileAction } from "@/actions/profile";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Trash2, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export function ProfileAccountTab({ user }: { user: User }) {
  const { toast } = useToast();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl || null
  );
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [initialName] = useState(`${user.firstName} ${user.lastName}`);
  const [name, setName] = useState(initialName);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const nameChanged = name !== initialName;
    const avatarChanged = avatarPreview && avatarPreview !== user.avatarUrl;
    const dirty = nameChanged || deleteAvatar || !!avatarChanged;
    requestAnimationFrame(() => setIsDirty(dirty));
  }, [name, deleteAvatar, avatarPreview, initialName, user.avatarUrl]);

  const handleUpdateProfile = (formData: FormData) => {
    if (deleteAvatar) {
      formData.append("deleteAvatar", "true");
    }
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res.success) {
        toast({
          variant: "success",
          title: tCommon("toast.success"),
          description: t("account.success"),
        });
        setDeleteAvatar(false);
        setIsDirty(false);
      } else {
        toast({
          title: tCommon("toast.error"),
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setDeleteAvatar(false);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setDeleteAvatar(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 md:p-8 backdrop-blur-md border-white/10">
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("account.title")}
          </h2>
          <p className="text-base text-muted-foreground">
            {t("account.subtitle")}
          </p>
        </div>
        <form action={handleUpdateProfile} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center relative shadow-lg shadow-primary/10">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                ) : avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-muted-foreground/50" />
                )}
                <label
                  htmlFor="avatar-upload"
                  className={cn(
                    "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity cursor-pointer",
                    isUploading
                      ? "opacity-0 pointer-events-none"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Plus className="w-8 h-8 text-white" />
                </label>
              </div>
              {avatarPreview && !isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              id="avatar-upload"
              name="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isPending || isUploading}
            />
            <p className="text-xs text-muted-foreground">
              {t("account.avatar.hint")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                {t("account.name")}
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-base text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                {t("account.email")}
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-base text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 opacity-60"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <GlassButton
              type="submit"
              disabled={isPending || isUploading || !isDirty}
              size="lg"
              className="bg-primary text-primary-foreground hover:opacity-90 font-black shadow-xl shadow-primary/20 border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? t("account.saving") : t("account.save")}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}
