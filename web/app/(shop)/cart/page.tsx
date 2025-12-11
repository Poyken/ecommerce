import { removeFromCartAction } from "@/actions/cart";
import { getProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Separator } from "@/components/ui/separator";
import { http } from "@/lib/http";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CartItemControl } from "./cart-item-control";
import { CheckoutButton } from "./checkout-button";

interface CartItem {
  id: string;
  skuId: string;
  quantity: number;
  price: number;
  sku: {
    price: number;
    salePrice?: number;
    product: {
      id: string;
      name: string;
      images: string[];
    };
    specs?: any;
    optionValues?: {
      optionValue: {
        value: string;
        option: {
          name: string;
        };
      };
    }[];
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export default async function CartPage() {
  let cart: Cart | null = null;
  let hasAddress = false;

  try {
    const [cartRes, profileRes] = await Promise.all([
      http<{ data: Cart }>("/cart"),
      getProfileAction(),
    ]);
    cart = cartRes.data;

    if (
      profileRes.data &&
      profileRes.data.addresses &&
      profileRes.data.addresses.length > 0
    ) {
      hasAddress = true;
    }
  } catch (e) {
    // Giỏ hàng có thể là 404 nếu trống hoặc chưa được tạo
    console.log("Lỗi khi lấy giỏ hàng (có thể do trống)", e);
  }

  const items = cart?.items || [];
  const total = cart?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground tracking-tight">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {items.length > 0 ? (
              items.map((item) => (
                <GlassCard key={item.id} className="p-6 transition-all hover:bg-white/10 group">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      {item.sku?.product?.images?.[0] ? (
                        <Image
                          src={item.sku.product.images[0]}
                          alt={item.sku.product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          No Img
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link
                            href={`/products/${item.sku?.product?.id}`}
                            className="text-lg font-bold hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.sku?.product?.name || "Unknown Product"}
                          </Link>
                          
                          {item.sku?.optionValues && item.sku.optionValues.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.sku.optionValues.map((ov, index) => (
                                <span key={index} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md text-muted-foreground">
                                  {ov.optionValue.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <form action={removeFromCartAction.bind(null, item.id)}>
                          <button
                            type="submit"
                            className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </form>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <CartItemControl item={item} />
                        <div className="font-bold text-lg text-primary">
                          {item.sku &&
                            new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(
                              Number(item.sku.salePrice ?? item.sku.price ?? 0) *
                                item.quantity
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="text-center py-20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <Trash2 size={32} />
                </div>
                <p className="text-xl font-medium text-foreground">Your cart is empty.</p>
                <p className="text-muted-foreground mt-2 mb-6">
                  Looks like you haven't added any items yet.
                </p>
                <Link href="/">
                    <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">Start Shopping</Button>
                </Link>
              </GlassCard>
            )}
          </div>

          <div className="lg:col-span-4">
            {items.length > 0 && (
              <GlassCard className="p-6 sticky top-24 space-y-6">
                <h3 className="text-xl font-bold">Order Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(total)}
                    </span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-400">Calculated at next step</span>
                  </div>
                </div>
                
                <Separator className="bg-white/10" />
                
                <div className="flex justify-between text-xl font-bold items-center">
                  <span>Total</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(total)}
                  </span>
                </div>
                
                <CheckoutButton hasAddress={hasAddress} />
                
                 <p className="text-xs text-center text-muted-foreground mt-4">
                    Taxes and shipping calculated at checkout
                 </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
