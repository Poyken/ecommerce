"use client";

import { loginAction } from "@/actions/auth";
import { mergeGuestCartAction } from "@/actions/cart";
import { mergeGuestWishlistAction } from "@/actions/wishlist";
import { BackgroundBlob } from "@/components/atoms/background-blob";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { PasswordInput } from "@/components/atoms/password-input";
import { useToast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/routing";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

/**
 * =====================================================================
 * LOGIN PAGE CONTENT - Xử lý UI Đăng nhập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REACT 19 `useActionState`:
 * - Hook mới để quản lý trạng thái của Server Actions.
 * - `state`: Chứa dữ liệu trả về (success, error, validation errors).
 * - `isPending`: Trạng thái loading tự động khi form đang submit.
 *
 * 2. GUEST CART SYNC:
 * - Sau khi login thành công, hệ thống kiểm tra `localStorage` xem có giỏ hàng khách không.
 * - Nếu có, gọi `mergeGuestCartAction` để đồng bộ sản phẩm vào tài khoản user.
 *
 * 3. ANIMATED ERRORS:
 * - Sử dụng `AnimatePresence` và `motion.p` để thông báo lỗi xuất hiện mượt mà, không làm "nhảy" layout đột ngột.
 * =====================================================================
 */
export function LoginPageContent() {
  const t = useTranslations("auth.login");
  const tToast = useTranslations("common.toast");
  const [state, action, isPending] = useActionState(loginAction, null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { toast } = useToast();
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
  }, [state, toast, router, callbackUrl, locale, t, tToast]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted relative overflow-hidden h-full">
        <Image
          src="/images/auth/auth-hero.webp"
          alt="Authentication Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
        <div className="relative z-10 text-white p-10 max-w-lg text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="text-lg text-white/80">{t("heroSubtitle")}</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 h-full relative">
        {/* Background Gradients for Right Side */}
        <BackgroundBlob
          variant="primary"
          position="center-right"
          className="top-0 bottom-auto w-[500px] h-[500px] blur-[120px]"
        />
        <BackgroundBlob
          variant="info"
          position="center-left"
          className="w-[500px] h-[500px] blur-[120px]"
        />

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
            <div className="mb-8 text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <motion.form
              layout
              action={handleAction}
              className="space-y-6"
              noValidate
            >
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
                    // Validate on input
                    const result = loginSchema.shape.email.safeParse(value);
                    if (result.success) {
                      const newErrors = { ...localErrors };
                      delete newErrors.email;
                      setLocalErrors(newErrors);
                    } else {
                      if (localErrors.email) {
                        const result = loginSchema.shape.email.safeParse(value);
                        if (result.success) {
                          const newErrors = { ...localErrors };
                          delete newErrors.email;
                          setLocalErrors(newErrors);
                        } else {
                          // Update error message to reflect current state?
                          setLocalErrors({
                            ...localErrors,
                            email: result.error.flatten().formErrors,
                          });
                        }
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
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-foreground/80 font-bold"
                  >
                    {t("passwordLabel")}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-bold"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder={t("passwordPlaceholder")}
                  className={`bg-foreground/3 border-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-2xl ${
                    localErrors.password ? "border-red-500" : ""
                  }`}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (localErrors.password) {
                      const result =
                        loginSchema.shape.password.safeParse(value);
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

              <div className="flex items-center gap-4 my-6">
                <span className="flex-1 border-t border-black/10 dark:border-white/10" />
                <span className="text-xs uppercase text-muted-foreground font-medium tracking-wider">
                  {t("orContinueWith")}
                </span>
                <span className="flex-1 border-t border-black/10 dark:border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassButton
                  type="button"
                  variant="ghost"
                  whileHover={{
                    scale: 1.02,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() =>
                    (window.location.href = `${
                      env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
                      "http://localhost:8080"
                    }/auth/google`)
                  }
                  className="bg-white/5 hover:bg-white/10 text-foreground border border-black/10 dark:border-white/10 h-12 rounded-xl flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">{t("google")}</span>
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="ghost"
                  whileHover={{
                    scale: 1.02,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() =>
                    (window.location.href = `${
                      env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
                      "http://localhost:8080"
                    }/auth/facebook`)
                  }
                  className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 h-12 rounded-xl flex items-center justify-center gap-3"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="font-medium">{t("facebook")}</span>
                </GlassButton>
              </div>

              <div className="text-center text-sm text-muted-foreground/70 font-medium">
                {t("noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 transition-colors font-bold"
                >
                  {t("createAccount")}
                </Link>
              </div>
            </motion.form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
