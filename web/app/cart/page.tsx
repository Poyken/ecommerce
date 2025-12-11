import { removeFromCartAction } from "@/actions/cart";
import { getProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex gap-4">
                  <div className="flex-shrink-0">
                    {item.sku?.product?.images?.[0] ? (
                      <Image
                        src={item.sku.product.images[0]}
                        alt={item.sku.product.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                        No Img
                      </div>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          href={`/products/${item.sku?.product?.id}`}
                          className="font-semibold hover:underline"
                        >
                          {item.sku?.product?.name || "Unknown Product"}
                        </Link>
                        {item.sku?.optionValues &&
                          item.sku.optionValues.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.sku.optionValues.map((ov, index) => (
                                <span key={index} className="mr-3">
                                  {ov.optionValue.option.name}:{" "}
                                  {ov.optionValue.value}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <form action={removeFromCartAction.bind(null, item.id)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </form>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <CartItemControl item={item} />
                      <div className="font-semibold">
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
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">Your cart is empty.</p>
              <p className="text-sm text-gray-400 mt-2">
                Start shopping to add items.
              </p>
            </div>
          )}
        </div>

        <div>
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(total)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(total)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <CheckoutButton hasAddress={hasAddress} />
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
