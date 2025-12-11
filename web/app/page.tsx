import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { http } from "@/lib/http";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Kiểu giả lập dựa trên phản hồi API
interface Product {
  id: string;
  name: string;
  description: string;
  skus: { price: number; imageUrl?: string }[];
}

export default async function Home() {
  let products: Product[] = [];
  try {
    const res = await http<{ data: { items: Product[] } | Product[] }>(
      "/products"
    );
    // Xử lý phản hồi phân trang hoặc mảng
    if ("items" in res.data) {
      products = res.data.items;
    } else if (Array.isArray(res.data)) {
      products = res.data;
    }
  } catch (e) {
    console.error("Lấy danh sách sản phẩm thất bại", e);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8 font-sans">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Featured Products
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col h-full hover:shadow-xl transition-all duration-300 overflow-hidden group border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="flex-grow flex flex-col"
                >
                  <div className="relative w-full pt-[100%] bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    {product.skus?.[0]?.imageUrl ? (
                      <Image
                        src={product.skus[0].imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-xs mt-2 font-medium">
                          No Image
                        </span>
                      </div>
                    )}
                    {/* Badge giả lập (ví dụ: New) */}
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Quick View
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 h-10 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {product.skus?.[0]?.price &&
                        Number(product.skus[0].price) > 0
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(Number(product.skus[0].price))
                          : "Liên hệ"}
                      </p>
                      {/* Giả lập giá gốc nếu có sale (ẩn tạm) */}
                      {/* <span className="text-sm text-gray-400 line-through">1.000.000 ₫</span> */}
                    </div>
                  </CardContent>
                </Link>
                <CardFooter className="pt-0">
                  <Link href={`/products/${product.id}`} className="w-full">
                    <Button className="w-full bg-gray-900 hover:bg-blue-600 text-white dark:bg-gray-100 dark:text-black dark:hover:bg-blue-400 transition-colors">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500">
              <p>No products found or failed to load.</p>
              <p className="text-xs mt-2">
                Check console for API connection errors.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
