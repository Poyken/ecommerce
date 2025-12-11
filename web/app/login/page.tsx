"use client";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                // defaultValue="admin@example.com"
              />
              {state?.errors?.email && (
                <p className="text-red-500 text-xs">{state.errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                // defaultValue="123456"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
