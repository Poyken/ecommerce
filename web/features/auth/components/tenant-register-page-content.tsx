"use client";

import { AnimatedError } from "@/components/shared/animated-error";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { registerAction } from "@/features/auth/actions";
import { mergeGuestCartAction } from "@/features/cart/actions";
import { mergeGuestWishlistAction } from "@/features/wishlist/actions";
import { Link, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { registerSchema } from "@/lib/schemas";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

export function TenantRegisterPageContent() {
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
          // Sync logic (simplified)
          try {
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

          let targetUrl = callbackUrl || "/";
          const localePrefix = `/${locale}`;
          if (!targetUrl.startsWith(localePrefix) && !targetUrl.startsWith("http")) {
            targetUrl = `${localePrefix}${targetUrl === "/" ? "" : targetUrl}`;
          }
          window.location.href = targetUrl;
        };

        syncToCloud();
      }
    }
  }, [state, toast, tToast, router, callbackUrl, locale, t]);

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
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 mix-blend-overlay transition-transform duration-[20s] hover:scale-110" />
          <div className="absolute inset-0 bg-linear-to-tr from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest mb-6 text-white/80">
            <Sparkles className="size-3" />
            <span>Join Exclusive Club</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-serif leading-tight mb-4">
            Design Your <span className="italic text-white/80">Dream Space</span>
          </h2>
           <p className="text-white/60 max-w-md font-light">
             Create an account today to access our full catalog, save your favorite items, and receive personalized design advice.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
            {[
                "Save unlimited items to Wishlist",
                "Track orders in real-time",
                "Faster checkout process",
                "Receive exclusive offers"
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
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <form action={handleAction} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                        id="firstName" name="firstName" placeholder="John" className="h-11 bg-muted/30"
                        onChange={() => localErrors.firstName && setLocalErrors({...localErrors, firstName: []})}
                    />
                    <AnimatedError message={localErrors.firstName?.[0]} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                        id="lastName" name="lastName" placeholder="Doe" className="h-11 bg-muted/30" 
                        onChange={() => localErrors.lastName && setLocalErrors({...localErrors, lastName: []})}
                    />
                    <AnimatedError message={localErrors.lastName?.[0]} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                    id="email" name="email" type="email" placeholder="name@example.com" className="h-12 bg-muted/30"
                    onChange={() => localErrors.email && setLocalErrors({...localErrors, email: []})}
                />
                <AnimatedError message={localErrors.email?.[0]} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput 
                    id="password" name="password" className="h-12 bg-muted/30" placeholder="••••••••"
                    onChange={() => localErrors.password && setLocalErrors({...localErrors, password: []})}
                />
                <AnimatedError message={localErrors.password?.[0]} />
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                disabled={isPending}
            >
                {isPending ? "Creating Account..." : (
                    <span className="flex items-center gap-2">
                        Create Account <ArrowRight className="size-4" />
                    </span>
                )}
            </Button>

            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} className="font-semibold text-primary hover:underline">
                    Sign in
                </Link>
            </div>
          </form>
        </m.div>
      </div>
    </div>
  );
}
