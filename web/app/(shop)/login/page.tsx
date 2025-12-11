"use client";

import { loginAction } from "@/actions/auth";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { addToCartAction } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const syncCart = async () => {
        try {
          const guestCart = localStorage.getItem("guest_cart");
          if (guestCart) {
            const items = JSON.parse(guestCart);
            if (Array.isArray(items)) {
              await Promise.all(
                items.map((item: any) =>
                  addToCartAction(item.skuId, item.quantity || 1)
                )
              );
            }
            localStorage.removeItem("guest_cart");
          }
        } catch (e) {
          console.error("Failed to sync cart", e);
        } finally {
          router.push("/");
          router.refresh();
        }
      };
      syncCart();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <GlassCard className="w-full max-w-md p-8 relative z-10" variant="heavy">
        <div className="mb-8 text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to access your exclusive collection</p>
        </div>

        <form action={action} className="space-y-6">
            {state?.error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ex. your@email.com"
                required
                className="bg-black/5 dark:bg-black/20 border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-xl"
              />
              {state?.errors?.email && (
                <p className="text-destructive text-xs">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <Label htmlFor="password" classname="text-foreground/80">Password</Label>
                  <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot Password?</a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-black/5 dark:bg-black/20 border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/50 h-12 rounded-xl"
              />
            </div>

            <GlassButton type="submit" className="w-full h-12 text-base font-bold bg-foreground text-background hover:bg-foreground/90" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </GlassButton>

            <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">Create Account</a>
            </div>
        </form>
      </GlassCard>
    </div>
  );
}
