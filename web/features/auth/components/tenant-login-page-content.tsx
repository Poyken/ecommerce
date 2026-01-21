"use client";

import { AnimatedError } from "@/components/shared/animated-error";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { login2FAAction, loginAction } from "@/features/auth/actions";
import { mergeGuestCartAction } from "@/features/cart/actions";
import { mergeGuestWishlistAction } from "@/features/wishlist/actions";
import { Link, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/schemas";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

export function TenantLoginPageContent() {
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

  // 2FA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying2FA, start2FATransition] = useTransition();

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !tempUserId) return;

    start2FATransition(async () => {
      const res = await login2FAAction(tempUserId, otpCode);
      if (res.success) {
        toast({
          variant: "success",
          title: tToast("success"),
          description: t("success"),
        });

        // Redirect logic
        const permissions = (res as any).permissions || [];
        const isSuperAdmin =
          permissions.includes("superAdmin:read") ||
          permissions.includes("dashboard:read");
        const isAdmin = permissions.includes("admin:read");

        let targetUrl = isSuperAdmin
          ? "/super-admin"
          : isAdmin
          ? "/admin"
          : callbackUrl || "/";

        const localePrefix = `/${locale}`;
        if (!targetUrl.startsWith(localePrefix) && !targetUrl.startsWith("http")) {
             targetUrl = `${localePrefix}${targetUrl === "/" ? "" : targetUrl}`;
        }
        
        router.refresh();
        window.location.href = targetUrl;
      } else {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: res.error || t("twoFactor.invalidCode"),
        });
      }
    });
  };

  const handleAction = (formData: FormData) => {
    submissionCount.current++;
    action(formData);
  };

  useEffect(() => {
    if (state && submissionCount.current > lastProcessedCount.current) {
      lastProcessedCount.current = submissionCount.current;
      
      console.log('[CLIENT DEBUG] Login State Return:', state); // Log full state

      if (state.errors) {
        setLocalErrors(state.errors);
      }

      if (state.error && !state.mfaRequired) {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: state.error,
        });
      }

      if (state.mfaRequired && state.userId) {
        setMfaRequired(true);
        setTempUserId(state.userId);
        return;
      }

      if (state.success) {
        toast({
          variant: "success",
          title: tToast("success"),
          description: t("success"),
        });

        const syncToCloud = async () => {
          // Sync Wishlist & Cart (Same logic as standard login)
          try {
             // ... (Simplified sync for brevity, logic handled server side mostly or via actions)
             // Executing the actions in background
             const guestWishlist = localStorage.getItem("guest_wishlist");
             if (guestWishlist) {
                 const pids = JSON.parse(guestWishlist);
                 if(Array.isArray(pids)) await mergeGuestWishlistAction(pids);
                 localStorage.removeItem("guest_wishlist");
             }
             const guestCart = localStorage.getItem("guest_cart");
             if(guestCart){
                 const items = JSON.parse(guestCart);
                 if(Array.isArray(items)) await mergeGuestCartAction(items);
                 localStorage.removeItem("guest_cart");
             }
          } catch (e) { console.error(e) }

          // Redirect
          const permissions = state.permissions || [];
          console.log('[LOGIN DEBUG] Permissions received:', permissions);
          
          const isSuperAdmin = permissions.includes("superAdmin:read");
          const isAdmin = permissions.includes("admin:read");
          console.log('[LOGIN DEBUG] Checks:', { isSuperAdmin, isAdmin });
          
          let targetUrl = isSuperAdmin ? "/super-admin" : isAdmin ? "/admin" : callbackUrl || "/";
          
          const localePrefix = `/${locale}`;
          if (!targetUrl.startsWith(localePrefix) && !targetUrl.startsWith("http")) {
            targetUrl = `${localePrefix}${targetUrl === "/" ? "" : targetUrl}`;
          }
          router.refresh();
          window.location.href = targetUrl;
        };

        syncToCloud();
      }
    }
  }, [state, toast, router, callbackUrl, locale, t, tToast]);

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel: Visuals (Hidden on mobile) */}
      <m.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 relative bg-black text-white overflow-hidden flex-col justify-between p-12"
      >
        <div className="absolute inset-0 z-0">
          {/* Enhanced Background Image or Gradient */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 mix-blend-overlay transition-transform duration-[20s] hover:scale-110" />
          <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest mb-6 text-white/80">
            <Sparkles className="size-3" />
            <span>Member Benefits</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-serif leading-tight mb-4">
            Experience the Art <br /> of <span className="italic text-white/80">Modern Living</span>
          </h2>
          <p className="text-white/60 max-w-md font-light">
             Join our exclusive community to unlock premium collections, personalized design consultations, and early access to sales.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
            {[
                "Free Interior Design Consultation",
                "Exclusive Member-Only Discounts (up to 20%)",
                "Extended Warranty on All Furniture",
                "Priority 24/7 Concierge Support"
            ].map((item, i) => (
                <m.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-center gap-3"
                >
                    <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check className="size-3.5" />
                    </div>
                    <span className="text-sm font-medium text-white/90">{item}</span>
                </m.div>
            ))}
        </div>
        
         {/* Abstract glow */}
         <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />
      </m.div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-background relative">
        <m.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground">
              Please sign in to your account
            </p>
          </div>

          <form action={handleAction} className="space-y-6">
            {mfaRequired ? (
               <div className="space-y-6">
                  {/* 2FA UI similar to standard login but cleaner */}
                  <div className="text-center space-y-2">
                      <div className="bg-primary/10 size-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                          <ShieldCheck className="size-8" />
                      </div>
                      <h3 className="font-semibold text-lg">{t("twoFactor.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("twoFactor.description")}</p>
                  </div>
                  <div className="space-y-2">
                      <Input 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        className="text-center text-3xl tracking-widest h-14 font-mono"
                        maxLength={6}
                      />
                  </div>
                  <Button onClick={handle2FASubmit} disabled={isVerifying2FA} className="w-full h-12 text-lg">
                      {isVerifying2FA ? "Verifying..." : "Verify Identity"}
                  </Button>
               </div>
            ) : (
                <>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="name@example.com"
                            className="h-12 bg-muted/30"
                            onChange={(e) => {
                                // Clear error on change logic
                                if(localErrors.email) setLocalErrors({...localErrors, email: []}) 
                            }}
                        />
                        <AnimatedError message={localErrors.email?.[0]} />
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
                         </div>
                        <PasswordInput 
                            id="password" 
                            name="password"
                            placeholder="••••••••"
                            className="h-12 bg-muted/30"
                            onChange={(e) => {
                                if(localErrors.password) setLocalErrors({...localErrors, password: []})
                            }}
                        />
                        <AnimatedError message={localErrors.password?.[0]} />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                    disabled={isPending}
                >
                    {isPending ? "Signing in..." : (
                        <span className="flex items-center gap-2">
                            Sign In <ArrowRight className="size-4" />
                        </span>
                    )}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" type="button" className="h-12 rounded-xl" onClick={() => window.location.href = `${env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8080"}/auth/google`}>
                         <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                         Google
                    </Button>
                    <Button variant="outline" type="button" className="h-12 rounded-xl" onClick={() => window.location.href = `${env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8080"}/auth/facebook`}>
                         <svg className="mr-2 h-4 w-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                         Facebook
                    </Button>
                </div>
                </>
            )}

            <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"} className="font-semibold text-primary hover:underline">
                    Sign up
                </Link>
            </div>
          </form>
        </m.div>

        {/* Floating gradient orb for decoration */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
}
