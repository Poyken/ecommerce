import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { http } from "@/lib/http";
import { format } from "date-fns";
import { Loader2, Package, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: "PRODUCT" | "ORDER", data: any) => void;
  accessToken?: string;
  userId?: string; // Optional: fetch orders for this user instead of "me"
}

export function ChatSelector({
  isOpen,
  onClose,
  onSelect,
  accessToken,
  userId,
}: ChatSelectorProps) {
  /**
   * =====================================================================
   * CHAT SELECTOR - Modal chọn Sản phẩm/Đơn hàng để gửi
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. CONTEXT AWARENESS:
   * - Trong Support Chat, user thường cần hỏi về "Đơn hàng này" hoặc "Sản phẩm kia".
   * - Modal này giúp user chọn nhanh đối tượng cần hỗ trợ.
   *
   * 2. INFINITE SCROLL:
   * - Dùng `IntersectionObserver` để load thêm Product/Order khi scroll xuống đáy.
   * - Giảm tải ban đầu, chỉ fetch 20 items mỗi lần.
   * =====================================================================
   */
  const [activeTab, setActiveTab] = useState<string>("product");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pagination
  const [productPage, setProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [orderPage, setOrderPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const productBottomRef = useRef<HTMLDivElement>(null);
  const orderBottomRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const debouncedSearch = useDebounce(search, 500);

  // Fetch Products
  const fetchProducts = useCallback(
    async (page: number, currentSearch: string, isNew: boolean = false) => {
      if (!accessToken || isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const resData = await http<any>(
          `/products?search=${currentSearch}&page=${page}&limit=20`
        );
        const newProducts = resData.data || [];
        setProducts((prev) => {
          const combined = isNew ? newProducts : [...prev, ...newProducts];
          // Deduplicate by ID
          const uniqueMap = new Map();
          combined.forEach((p: any) => uniqueMap.set(p.id, p));
          return Array.from(uniqueMap.values());
        });
        setHasMoreProducts(newProducts.length === 20);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [accessToken]
  );

  // Fetch Orders
  const fetchOrders = useCallback(
    async (page: number, isNew: boolean = false) => {
      if (!accessToken || isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      const url = userId
        ? `/orders?userId=${userId}&page=${page}&limit=20`
        : `/orders/my-orders?page=${page}&limit=20`;

      try {
        const resData = await http<any>(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const newOrders = resData.data || [];
        setOrders((prev) => {
          const combined = isNew ? newOrders : [...prev, ...newOrders];
          // Deduplicate by ID
          const uniqueMap = new Map();
          combined.forEach((o: any) => uniqueMap.set(o.id, o));
          return Array.from(uniqueMap.values());
        });
        setHasMoreOrders(newOrders.length === 20);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [accessToken, userId]
  );

  // Initial load or search change
  useEffect(() => {
    if (isOpen && activeTab === "product") {
      setProductPage(1);
      fetchProducts(1, debouncedSearch, true);
    }
  }, [isOpen, activeTab, debouncedSearch, fetchProducts]);

  useEffect(() => {
    if (isOpen && activeTab === "order") {
      setOrderPage(1);
      fetchOrders(1, true);
    }
  }, [isOpen, activeTab, fetchOrders]);

  // Infinite Scroll Observers
  useEffect(() => {
    if (isLoading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          if (activeTab === "product" && hasMoreProducts) {
            setProductPage((prev) => {
              const next = prev + 1;
              fetchProducts(next, debouncedSearch);
              return next;
            });
          } else if (activeTab === "order" && hasMoreOrders) {
            setOrderPage((prev) => {
              const next = prev + 1;
              fetchOrders(next);
              return next;
            });
          }
        }
      },
      { threshold: 0.5 }
    );

    const target =
      activeTab === "product"
        ? productBottomRef.current
        : orderBottomRef.current;
    if (target) observerRef.current.observe(target);

    return () => observerRef.current?.disconnect();
  }, [
    isLoading,
    activeTab,
    hasMoreProducts,
    hasMoreOrders,
    debouncedSearch,
    fetchProducts,
    fetchOrders,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select content to send</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="product"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="product" className="gap-2">
                <ShoppingBag size={14} /> Products
              </TabsTrigger>
              <TabsTrigger value="order" className="gap-2">
                <Package size={14} /> Orders
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="product" className="mt-0">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 gap-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        const productImg =
                          p.images?.[0]?.url ||
                          p.skus?.[0]?.imageUrl ||
                          p.thumbnailUrl;
                        onSelect("PRODUCT", {
                          id: p.id,
                          skuId: p.skus?.[0]?.id,
                          name: p.name,
                          price: p.skus?.[0]?.price || p.minPrice || 0,
                          imageUrl: productImg,
                          slug: p.slug,
                        });
                        onClose();
                      }}
                    >
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100 border">
                        <Image
                          src={
                            p.images?.[0]?.url ||
                            p.skus?.[0]?.imageUrl ||
                            "/placeholder.jpg"
                          }
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-primary font-bold">
                          ${p.skus?.[0]?.price || p.minPrice}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Sentinel for Product Infinite Scroll */}
                  <div ref={productBottomRef} className="h-4 w-full" />

                  {isLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="animate-spin text-primary size-5" />
                    </div>
                  )}

                  {!isLoading && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <ShoppingBag size={32} className="opacity-20 mb-2" />
                      <p className="text-sm">No products found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="order" className="mt-0">
            <div className="p-4 space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 gap-2">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-col p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        onSelect("ORDER", {
                          id: o.orderCode || o.id,
                          status: o.status,
                          total: o.totalAmount,
                          itemCount: o.items?.length || 0,
                        });
                        onClose();
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold">
                          #{o.orderCode || o.id}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {o.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{o.items?.length || 0} items</span>
                        <span className="font-semibold text-foreground">
                          ${o.totalAmount}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(o.createdAt), "dd/MM/yyyy")}
                      </div>
                    </div>
                  ))}

                  {/* Sentinel for Order Infinite Scroll */}
                  <div ref={orderBottomRef} className="h-4 w-full" />

                  {isLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="animate-spin text-primary size-5" />
                    </div>
                  )}

                  {!isLoading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <Package size={32} className="opacity-20 mb-2" />
                      <p className="text-sm">No orders found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
