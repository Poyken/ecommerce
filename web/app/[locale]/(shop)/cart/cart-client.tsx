/**
 * =====================================================================
 * CART CLIENT - Giao diện giỏ hàng chi tiết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID CART LOGIC (User & Guest):
 * - Nếu user đã đăng nhập: Dữ liệu lấy từ `cart` prop (Server Action).
 * - Nếu là khách (Guest): Dữ liệu lấy từ `localStorage` ('guest_cart').
 * - `useEffect` lắng nghe event `guest_cart_updated` để đồng bộ UI khi có thay đổi.
 *
 * 2. OPTIMISTIC UPDATES & DEBOUNCING:
 * - Khi thay đổi số lượng, UI cập nhật ngay lập tức (`localItems`).
 * - Sau đó dùng `setTimeout` (Debounce 500ms) để gọi API, tránh spam request.
 * - Nếu API lỗi, UI sẽ tự động rollback về dữ liệu cũ từ Server.
 *
 * 3. SELECTION SYSTEM:
 * - Cho phép user chọn từng món để thanh toán (`selectedItems`).
 * - Tự động tính toán lại tổng tiền dựa trên các món đã chọn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Dynamic Cart Orchestration: Quản lý tập trung toàn bộ logic giỏ hàng ở phía Client, cho phép xử lý đồng thời cả giỏ hàng định danh (Login) và giỏ hàng ẩn danh (Guest) một cách nhất quán.
 * - Optimistic Quantity Adjustments: Tăng tốc độ phản hồi của giao diện bằng cách cập nhật ngay lập tức số lượng sản phẩm và tổng tiền, sau đó mới đồng bộ với database qua cơ chế Debouncing thông minh.

 * =====================================================================
 */

"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearCartAction,
  getGuestCartDetailsAction,
  removeFromCartAction,
  updateCartItemAction,
} from "@/features/cart/actions";
import { Link } from "@/i18n/routing";
import { Cart, CartItem, Sku } from "@/types/models";
import { m } from "@/lib/animations";
import {
  Lock,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { getProductImage } from "@/lib/product-helper";
import { useFormatter, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

// Extend shared types for stricter UI requirements (we know SKU must exist here)
interface PopulatedCartItem extends Omit<CartItem, "sku"> {
  sku: Sku & {
    product: {
      id: string;
      name: string;
      images?: string[] | { url: string }[];
    };
    optionValues?: {
      optionValueId: string;
      optionValue: {
        id: string;
        value: string;
        option: { name: string };
      };
    }[];
  };
}

// Helper interface for Guest Cart Local Storage
interface LocalGuestItem {
  skuId: string;
  quantity: number;
}

interface CartClientProps {
  cart: Cart | null;
}

export function CartClient({ cart }: CartClientProps) {
  const t = useTranslations("cart");
  const format = useFormatter();
  const [guestItems, setGuestItems] = useState<PopulatedCartItem[]>([]);
  const [totalGuest, setTotalGuest] = useState(0);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const debouncedUpdateRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [isInitializing, setIsInitializing] = useState(!cart);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const isGuest = !cart;
  const items = useMemo(() => {
    if (isGuest) return guestItems;
    return (cart?.items || []) as unknown as PopulatedCartItem[];
  }, [isGuest, guestItems, cart]);

  const total = isGuest ? totalGuest : Number(cart?.totalAmount) || 0;

  useEffect(() => {
    if (isGuest) {
      const fetchGuestCart = async () => {
        // Delay to ensure hydration
        await new Promise((resolve) => setTimeout(resolve, 100));

        const guestCartStr = localStorage.getItem("guest_cart");
        if (guestCartStr) {
          try {
            const parsed = JSON.parse(guestCartStr) as LocalGuestItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              const skuIds = parsed
                .map((p) => p.skuId)
                .filter((id): id is string => !!id);
              const res = await getGuestCartDetailsAction(skuIds);

              if (res.success && res.data) {
                // Check for invalid items (present in local storage but not returned by API)
                const validSkuIds = new Set(res.data.map((sku: Sku) => sku.id));
                const validLocalItems = parsed.filter((p) =>
                  validSkuIds.has(p.skuId)
                );

                if (validLocalItems.length < parsed.length) {
                  // Some items are invalid/inactive/deleted, remove them
                  localStorage.setItem(
                    "guest_cart",
                    JSON.stringify(validLocalItems)
                  );
                  window.dispatchEvent(new Event("guest_cart_updated"));
                }

                let t = 0;
                // Map API response to PopulatedCartItem
                // We use 'any' briefly here because mapping from SkuDetail to PopulatedCartItem is complex to strictly type without mapped types
                // but the result is strongly typed.
                const mappedItems: PopulatedCartItem[] = res.data.map(
                  (sku: Sku) => {
                    const q =
                      parsed.find((p) => p.skuId === sku.id)?.quantity || 1;
                    const price = Number(sku.salePrice || sku.price || 0);
                    t += price * q;

                    // Construct PopulatedCartItem structure from SkuDetail
                    return {
                      id: `guest-${sku.id}`,
                      cartId: "guest",
                      skuId: sku.id,
                      quantity: q,
                      price: price,
                      sku: {
                        ...sku,
                        price: Number(sku.price), // Ensure number
                        salePrice: sku.salePrice ? Number(sku.salePrice) : null,
                        stock: sku.stock,
                        product: sku.product,
                        // Ensure optionValues structure matches what we expect from shared types
                        // API returns: { optionValueId, optionValue: { id, value, option: { name } } }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        optionValues: (sku.optionValues as any)?.map(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (ov: any) => ({
                            optionValueId:
                              ov.optionValueId ||
                              ov.optionValue?.id ||
                              "guest-opt-val",
                            optionValue: {
                              id:
                                ov.optionValue?.id || ov.id || "guest-opt-val",
                              value: ov.optionValue?.value || ov.value || "",
                              option: {
                                name:
                                  ov.optionValue?.option?.name ||
                                  ov.option?.name ||
                                  "Option",
                              },
                            },
                          })
                        ),
                      },
                    } as unknown as PopulatedCartItem;
                  }
                );
                setGuestItems(mappedItems);
                setTotalGuest(t);
              }
            } else {
              setGuestItems([]);
              setTotalGuest(0);
            }
          } catch {
            setGuestItems([]);
          } finally {
            setIsInitializing(false);
          }
        } else {
          setGuestItems([]);
          setTotalGuest(0);
          setIsInitializing(false);
        }
      };

      fetchGuestCart();
      window.addEventListener("guest_cart_updated", fetchGuestCart);
      return () => {
        window.removeEventListener("guest_cart_updated", fetchGuestCart);
      };
    } else {
      setIsInitializing(false);
    }
  }, [isGuest]);

  // Replace useOptimistic with local state to handle debounce stability
  const [localItems, setLocalItems] = useState<PopulatedCartItem[]>(items);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const isCheckoutBlocked = isPending || pendingUpdates.size > 0;

  // Sync local items with props
  useEffect(() => {
    setLocalItems((prev) => {
      const updatingIds = Object.keys(debouncedUpdateRef.current);
      if (isGuest) return [...items];

      const newItems = items.map((serverItem) => {
        if (updatingIds.includes(serverItem.id)) {
          const local = prev.find((p) => p.id === serverItem.id);
          return local
            ? { ...serverItem, quantity: local.quantity }
            : serverItem;
        }
        return serverItem;
      });
      return newItems;
    });
  }, [items, isGuest]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current && localItems.length > 0) {
      setSelectedItems(localItems.map((item) => item.id));
      isFirstRender.current = false;
    }
  }, [localItems, localItems.length]);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleClearCart = () => {
    startTransition(async () => {
      if (isGuest) {
        localStorage.removeItem("guest_cart");
        setGuestItems([]);
        setTotalGuest(0);
        window.dispatchEvent(new Event("guest_cart_updated"));
        window.dispatchEvent(new Event("cart_clear")); // Immediate badge update
      } else {
        const res = await clearCartAction();
        if (res.success) {
          window.dispatchEvent(new Event("cart_clear")); // Immediate badge update
          toast({
            variant: "success",
            title: t("cleared"),
            description: t("clearedDesc"),
          });
        }
      }
    });
  };

  const handleRemoveItem = (id: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== id));

    startTransition(async () => {
      if (isGuest) {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        );
        const updatedCart = guestCart.filter(
          (i: LocalGuestItem) => i.skuId !== id.replace("guest-", "")
        );
        localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("guest_cart_updated"));
      } else {
        const res = await removeFromCartAction({ itemId: id });
        if (res.success) {
          toast({
            variant: "success",
            title: t("removed"),
            description: t("removedDesc"),
          });
        }
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;

    // Find item to check stock
    const targetItem = localItems.find((i) => i.id === id);
    if (targetItem && quantity > targetItem.sku.stock) {
      toast({
        title: t("updateFailed"),
        description: t("onlyAvailable", { count: targetItem.sku.stock }),
        variant: "warning",
      });
      return;
    }

    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

    setPendingUpdates((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    if (debouncedUpdateRef.current[id]) {
      clearTimeout(debouncedUpdateRef.current[id]);
    }

    debouncedUpdateRef.current[id] = setTimeout(() => {
      startTransition(async () => {
        try {
          if (isGuest) {
            const guestCart = JSON.parse(
              localStorage.getItem("guest_cart") || "[]"
            );
            const updatedCart = guestCart.map((item: LocalGuestItem) =>
              item.skuId === id.replace("guest-", "")
                ? { ...item, quantity }
                : item
            );
            localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
            window.dispatchEvent(new Event("guest_cart_updated"));
          } else {
            const res = await updateCartItemAction({ itemId: id, quantity });
            if (!res.success) {
              const availableStock = (res as { availableStock?: number })
                .availableStock;

              if (typeof availableStock === "number") {
                toast({
                  title: t("updateFailed"),
                  description: `${t("onlyAvailable", {
                    count: availableStock,
                  })} ${t("quantityMax")}`,
                  variant: "warning",
                });
                setLocalItems((prev) =>
                  prev.map((item) =>
                    item.id === id
                      ? { ...item, quantity: availableStock }
                      : item
                  )
                );
                await updateCartItemAction({
                  itemId: id,
                  quantity: availableStock,
                });
              } else {
                toast({
                  title: t("updateFailed"),
                  description: res.error || t("updateFailedDesc"),
                  variant: "destructive",
                });
                setLocalItems((prev) => {
                  const serverItem = items.find((i) => i.id === id);
                  return prev.map((item) =>
                    item.id === id ? serverItem || item : item
                  );
                });
              }
            }
          }
        } catch {
          setLocalItems((prev) => {
            const serverItem = items.find((i) => i.id === id);
            return prev.map((item) =>
              item.id === id ? serverItem || item : item
            );
          });
        } finally {
          setPendingUpdates((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          delete debouncedUpdateRef.current[id];
        }
      });
    }, 500);
  };

  const shippingThreshold = 2000000;
  const remainingForFreeShipping = Math.max(0, shippingThreshold - total);
  const isFreeShipping = total >= shippingThreshold;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30 pb-24">
      {/* Cinematic Background & Aurora Glow */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-cinematic pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--aurora-blue)/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-(--aurora-orange)/10 rounded-full blur-[100px] animate-float pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10 pt-32">
        <m.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <ShoppingBag className="size-3" />
              {t("title")}
            </m.div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tighter">
              {t("title").split(" ")[0]}{" "}
              <span className="font-serif italic font-normal text-muted-foreground/60">
                {t("title").split(" ").slice(1).join(" ")}
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg font-medium">
              {localItems.length} {t("items")} {t("inCart")}
            </p>
          </div>

          {localItems.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <GlassButton
                  variant="ghost"
                  className="rounded-full px-6 py-3 text-destructive hover:text-destructive/90 hover:bg-destructive/10 border-destructive/20 font-bold text-xs uppercase tracking-widest"
                >
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("clearCart")}
                  </span>
                </GlassButton>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-4xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-bold tracking-tighter">{t("clearConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground font-medium">
                    {t("clearConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="rounded-full border-border font-bold">
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCart}
                    className="bg-destructive hover:bg-destructive/90 text-white rounded-full font-bold px-8"
                  >
                    {t("clearCart")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </m.div>

        {isInitializing ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 glass-card rounded-4xl flex gap-6 border-none">
                  <Skeleton className="w-24 h-40 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[400px] w-full rounded-4xl" />
            </div>
          </div>
        ) : localItems.length === 0 ? (
          <m.div
            className="flex flex-col items-center justify-center py-32 px-4 text-center space-y-8 glass-card rounded-4xl border-none shadow-2xl relative overflow-hidden group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 group-hover:text-accent transition-all animate-pulse" />
            </div>

            <div className="space-y-3 relative z-10">
              <h2 className="text-3xl font-bold tracking-tighter">{t("empty")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto font-medium">
                {t("emptyDesc")}
              </p>
            </div>

            <Link href="/shop" className="relative z-10">
              <GlassButton
                size="lg"
                className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs px-12 py-8 rounded-full shadow-xl hover:shadow-primary/20 transition-all"
              >
                {t("startShopping")}
              </GlassButton>
            </Link>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Free Shipping Bar */}
              <div className="p-8 rounded-4xl glass-card border-none shadow-xl overflow-hidden relative group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground/60">
                      {isFreeShipping
                        ? t("freeShippingUnlocked")
                        : t("addForFree", {
                            amount: format.number(remainingForFreeShipping, {
                              style: "currency",
                              currency: "VND",
                            }),
                          })}
                    </span>
                  </div>
                  <span className="text-xs font-black text-primary">
                    {Math.min(
                      100,
                      Math.round((total / shippingThreshold) * 100)
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <m.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (total / shippingThreshold) * 100
                      )}%`,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <m.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center justify-between px-6 py-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        localItems.length > 0 && 
                        selectedItems.length === localItems.length
                      }
                      onCheckedChange={() => {
                        if (selectedItems.length === localItems.length) {
                          setSelectedItems([]);
                        } else {
                          setSelectedItems(localItems.map((i) => i.id));
                        }
                      }}
                      className="rounded-md"
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {t("selectAll")}
                    </span>
                  </div>
                </div>

                {localItems.map((item) => (
                  <m.div key={item.id} variants={itemVariants}>
                    <div className="p-6 md:p-8 rounded-4xl glass-card border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      <div className="flex gap-6 md:gap-8">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                            className="rounded-md"
                          />
                        </div>

                        <Link
                          href={`/products/${item.sku.product.id}`}
                          className="relative w-28 h-36 md:w-40 md:h-52 rounded-3xl overflow-hidden bg-muted shrink-0 border border-white/10 block group/img shadow-lg"
                        >
                          <OptimizedImage
                            src={
                              item.sku.imageUrl ||
                              getProductImage(item.sku.product as any) ||
                              ""
                            }
                            alt={item.sku.product.name}
                            fill
                            sizes="(max-width: 768px) 112px, 160px"
                            className="object-cover transition-transform duration-1000 group-hover/img:scale-110"
                          />
                        </Link>

                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <Link
                                href={`/products/${item.sku.product.id}`}
                                className="font-bold text-2xl md:text-3xl text-foreground hover:text-accent transition-colors tracking-tighter line-clamp-2"
                              >
                                {item.sku.product.name}
                              </Link>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-muted-foreground/40 hover:text-destructive transition-colors p-2 glass-premium rounded-full"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                              {item.sku.optionValues?.map((ov) => (
                                <span
                                  key={ov.optionValue.id}
                                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                >
                                  {ov.optionValue.option.name}:{" "}
                                  <span className="text-foreground">{ov.optionValue.value}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-8">
                            <div className="flex items-center glass-premium rounded-full border border-white/10 p-1.5 w-fit">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1 || isPending}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 shadow-sm disabled:opacity-30 transition-all text-foreground"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-12 text-center font-black text-lg text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  isPending || item.quantity >= item.sku.stock
                                }
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 shadow-sm transition-all text-foreground"
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            <div className="text-right">
                               <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-1">
                                 {t("subtotal")}
                               </p>
                              <p className="text-2xl md:text-4xl font-bold text-primary tracking-tighter leading-none">
                                {format.number(
                                  Number(item.sku.salePrice || item.sku.price) *
                                    item.quantity,
                                  {
                                    style: "currency",
                                    currency: "VND",
                                  }
                                )}
                              </p>
                              {item.sku.salePrice && (
                                <p className="text-xs text-muted-foreground/60 line-through font-bold mt-1">
                                  {format.number(
                                    Number(item.sku.price) * item.quantity,
                                    {
                                      style: "currency",
                                      currency: "VND",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </m.div>
                ))}
              </m.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-8 md:p-10 sticky top-24 rounded-4xl glass-premium border-none shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 text-accent">
                  {t("orderSummary")}
                </h2>
                
                <div className="space-y-6 mb-12 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span className="font-bold text-foreground">
                      {format.number(total, {
                        style: "currency",
                        currency: "VND",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">
                      {t("shipping")}
                    </span>
                    <span className="font-bold uppercase tracking-widest text-[#10b981] text-[10px]">
                      {isFreeShipping ? t("free") : t("calculatedAtCheckout")}
                    </span>
                  </div>
                  
                  <div className="h-px bg-white/10" />
                  
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                      {t("totalAmount")}
                    </span>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-primary tracking-tighter leading-none">
                        {format.number(total, {
                          style: "currency",
                          currency: "VND",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {isGuest ? (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(
                        `/checkout${
                          selectedItems.length > 0
                            ? `?items=${selectedItems
                                .map((id) => id.replace("guest-", ""))
                                .join(",")}`
                            : ""
                        }`
                      )}`}
                    >
                      <GlassButton
                        size="lg"
                        className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                      >
                        {t("checkout")}
                      </GlassButton>
                    </Link>
                  ) : (
                    <Link
                      href={`/checkout${
                        selectedItems.length > 0
                          ? `?items=${selectedItems.join(",")}`
                          : ""
                      }`}
                    >
                      <GlassButton
                        size="lg"
                        disabled={isCheckoutBlocked || localItems.length === 0}
                        className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t("processing")}
                          </span>
                        ) : (
                          t("checkout")
                        )}
                      </GlassButton>
                    </Link>
                  )}
                  <p className="text-[10px] text-center text-muted-foreground mt-4">
                    {t("checkoutSecureDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
