import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { http } from "@/lib/http";
import Image from "next/image";
import Link from "next/link";

interface OrderItem {
  id: string;
  sku: {
    id: string;
    product: {
      id: string;
      name: string;
      images: string[];
    };
    price: number;
    specs?: any;
    optionValues?: any[];
  };
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  orderDate: string;
  items: OrderItem[];
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order: Order | null = null;
  let error = null;

  try {
    const res = await http<{ data: Order }>(`/orders/${id}`);
    order = res.data;
  } catch (e: any) {
    error = e.message || "Failed to load order";
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Order Detail</h1>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || "Order not found"}
        </div>
        <Link
          href="/orders"
          className="text-primary hover:underline mt-4 inline-block"
        >
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}...</h1>
        <Link href="/orders" className="text-primary hover:underline">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order Items</CardTitle>
                <Badge
                  variant={
                    order.status === "COMPLETED" ? "default" : "secondary"
                  }
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden relative">
                      {item.sku.product.images?.[0] ? (
                        <Image
                          src={item.sku.product.images[0]}
                          alt={item.sku.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <Link
                        href={`/products/${item.sku.product.id}?skuId=${item.sku.id}`}
                        className="hover:underline"
                      >
                        <h3 className="font-semibold text-primary">
                          {item.sku.product.name}
                        </h3>
                      </Link>
                      {item.sku.optionValues &&
                        item.sku.optionValues.length > 0 && (
                          <div className="text-sm text-gray-500 mb-1">
                            {item.sku.optionValues
                              .map((ov: any) => ov.optionValue?.value)
                              .join(" / ")}
                          </div>
                        )}
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity} &times;{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(item.priceAtPurchase))}
                      </div>
                      <div className="text-right font-medium">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(item.priceAtPurchase) * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(
                    Number(order.totalAmount) - Number(order.shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(order.shippingFee))}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(order.totalAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-semibold">{order.recipientName}</p>
              <p>{order.phoneNumber}</p>
              <p className="text-gray-600 whitespace-pre-wrap">
                {order.shippingAddress}
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Placed on{" "}
                {new Date(order.orderDate).toLocaleDateString("vi-VN")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
