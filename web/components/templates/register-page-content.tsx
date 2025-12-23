"use client";

import { registerAction } from "@/actions/auth";
import { mergeGuestCartAction } from "@/actions/cart";
import { mergeGuestWishlistAction } from "@/actions/wishlist";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { PasswordInput } from "@/components/atoms/password-input";
import { useToast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/routing";
import { registerSchema } from "@/lib/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * REGISTER PAGE CONTENT - Xử lý UI Đăng ký
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REGISTRATION FLOW:
 * - Sử dụng `registerAction` (Server Action) để tạo tài khoản mới.
 * - Form được validate ở cả Client (HTML5) và Server (Zod).
 *
 * 2. ERROR HANDLING:
 * - `state.errors` chứa các lỗi validation chi tiết cho từng field (firstName, email, password...).
 * - Hiển thị lỗi ngay dưới input tương ứng để user dễ dàng sửa đổi.
 *
 * 3. UI CONSISTENCY:
 * - Sử dụng chung bộ `GlassCard` và `GlassButton` để đảm bảo tính thẩm mỹ đồng nhất với trang Login.
 * =====================================================================
 */

export function RegisterPageContent() {
  const t = useTranslations("auth.register");
  const tToast = useTranslations("common.toast");
  const [state, action, isPending] = useActionState(registerAction, null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const locale = useLocale();

  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const submissionCount = useRef(0);
  const lastProcessedCount = useRef(0);

  const handleAction = (formData: FormData) => {
    submissionCount.current++;
    action(formData);
  };

  useEffect(() => {
    if (state && submissionCount.current > lastProcessedCount.current) {
      lastProcessedCount.current = submissionCount.current;

      if (state.errors) {
        setLocalErrors(state.errors);
      }

      if (state.error) {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: state.error,
        });
      }

      if (state.success) {
        toast({
          variant: "success",
          title: tToast("success"),
          description: t("success"),
        });

        const syncToCloud = async () => {
          // 1. Sync Wishlist
          try {
            const guestWishlist = localStorage.getItem("guest_wishlist");
            if (guestWishlist) {
              const productIds = JSON.parse(guestWishlist);
              if (Array.isArray(productIds) && productIds.length > 0) {
                await mergeGuestWishlistAction(productIds);
              }
              localStorage.removeItem("guest_wishlist");
              window.dispatchEvent(new Event("wishlist_updated"));
            }
          } catch {
            console.error("Failed to sync wishlist");
          }

          // 2. Sync Cart
          try {
            const guestCart = localStorage.getItem("guest_cart");
            if (guestCart) {
              const items = JSON.parse(guestCart);
              if (Array.isArray(items) && items.length > 0) {
                const minimalItems = items.map(
                  (item: { skuId: string; quantity: number }) => ({
                    skuId: item.skuId,
                    quantity: item.quantity,
                  })
                );
                const mergeRes = await mergeGuestCartAction(minimalItems);

                if (mergeRes.success && Array.isArray(mergeRes.results)) {
                  const results = mergeRes.results as {
                    success: boolean;
                    data?: { capped?: boolean };
                  }[];
                  const cappedCount = results.filter(
                    (r) => r.data?.capped
                  ).length;
                  const failedCount = results.filter((r) => !r.success).length;

                  if (cappedCount > 0 || failedCount > 0) {
                    toast({
                      title: tToast("info"),
                      description: `${
                        cappedCount > 0
                          ? "Some items were adjusted to available stock. "
                          : ""
                      }${
                        failedCount > 0
                          ? `${failedCount} items failed to merge.`
                          : ""
                      }`,
                      variant: "warning",
                    });
                  }
                }
              }
              localStorage.removeItem("guest_cart");
            }
            window.dispatchEvent(new Event("cart_updated"));
          } catch {
            console.error("Failed to sync cart");
          } finally {
            let targetUrl = callbackUrl || "/";
            try {
              const url = new URL(targetUrl, window.location.origin);
              if (url.origin === window.location.origin) {
                targetUrl = url.pathname + url.search + url.hash;
              }
            } catch {
              // Ignore invalid URL
            }
            const localePrefix = `/${locale}`;
            if (!targetUrl.startsWith(localePrefix)) {
              targetUrl = `${localePrefix}${
                targetUrl === "/" ? "" : targetUrl
              }`;
            }
            window.location.href = targetUrl;
          }
        };

        syncToCloud();
      }
    }
  }, [state, toast, tToast, router, callbackUrl, locale, t]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted relative overflow-hidden h-full">
        <Image
          src="/images/auth/auth-bg-original.webp"
          unoptimized
          alt="Authentication Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
        <div className="relative z-10 text-white p-10 max-w-lg text-center space-y-6">
          <h2 className="text-5xl font-black tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="text-xl text-white/90 font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 h-full relative">
        {/* Background Gradients for Right Side */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none opacity-50" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="w-full max-w-md relative z-10"
        >
          <GlassCard
            className="p-8 border-none shadow-none bg-transparent"
            variant="default"
          >
            <div className="mb-8 text-center space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-muted-foreground/70 font-medium">
                {t("subtitle")}
              </p>
            </div>

            <motion.form
              layout
              action={handleAction}
              className="space-y-5"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-foreground/80 font-bold"
                  >
                    {t("firstNameLabel")}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder={t("firstNamePlaceholder")}
                    className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-11 rounded-2xl ${
                      localErrors.firstName ? "border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (localErrors.firstName) {
                        const result =
                          registerSchema.shape.firstName.safeParse(value);
                        if (result.success) {
                          const newErrors = { ...localErrors };
                          delete newErrors.firstName;
                          setLocalErrors(newErrors);
                        } else {
                          setLocalErrors({
                            ...localErrors,
                            firstName: result.error.flatten().formErrors,
                          });
                        }
                      }
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {localErrors.firstName && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-red-500 text-sm mt-1">
                          {localErrors.firstName[0]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-foreground/80 font-bold"
                  >
                    {t("lastNameLabel")}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder={t("lastNamePlaceholder")}
                    className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-11 rounded-2xl ${
                      localErrors.lastName ? "border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (localErrors.lastName) {
                        const result =
                          registerSchema.shape.lastName.safeParse(value);
                        if (result.success) {
                          const newErrors = { ...localErrors };
                          delete newErrors.lastName;
                          setLocalErrors(newErrors);
                        } else {
                          setLocalErrors({
                            ...localErrors,
                            lastName: result.error.flatten().formErrors,
                          });
                        }
                      }
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {localErrors.lastName && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-red-500 text-sm mt-1">
                          {localErrors.lastName[0]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 font-bold">
                  {t("emailLabel")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                    localErrors.email ? "border-red-500" : ""
                  }`}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (localErrors.email) {
                      const result =
                        registerSchema.shape.email.safeParse(value);
                      if (result.success) {
                        const newErrors = { ...localErrors };
                        delete newErrors.email;
                        setLocalErrors(newErrors);
                      } else {
                        setLocalErrors({
                          ...localErrors,
                          email: result.error.flatten().formErrors,
                        });
                      }
                    }
                  }}
                />
                <AnimatePresence initial={false}>
                  {localErrors.email && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-red-500 text-sm mt-1">
                        {localErrors.email[0]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground/80 font-bold"
                >
                  {t("passwordLabel")}
                </Label>
                <PasswordInput
                  id="password"
                  name="password"
                  className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                    localErrors.password ? "border-red-500" : ""
                  }`}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (localErrors.password) {
                      const result =
                        registerSchema.shape.password.safeParse(value);
                      if (result.success) {
                        const newErrors = { ...localErrors };
                        delete newErrors.password;
                        setLocalErrors(newErrors);
                      } else {
                        setLocalErrors({
                          ...localErrors,
                          password: result.error.flatten().formErrors,
                        });
                      }
                    }
                  }}
                />
                <AnimatePresence initial={false}>
                  {localErrors.password && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-red-500 text-sm mt-1">
                        {localErrors.password[0]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <GlassButton
                type="submit"
                className="w-full h-12 text-base font-black bg-primary hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/20"
                loading={isPending}
              >
                {t("submit")}
              </GlassButton>

              <div className="text-center text-sm text-muted-foreground/70 font-medium">
                {t("hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 transition-colors font-bold"
                >
                  {t("signIn")}
                </Link>
              </div>
            </motion.form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
