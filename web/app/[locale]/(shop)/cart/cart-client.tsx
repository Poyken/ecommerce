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
 * - Tự động tính toán lại tổng tiền dựa trên các món đã chọn.
 * =====================================================================
 */

"use client";

import {
  clearCartAction,
  getGuestCartDetailsAction,
  removeFromCartAction,
  updateCartItemAction,
} from "@/actions/cart";
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
} from "@/components/atoms/alert-dialog";
import { Checkbox } from "@/components/atoms/checkbox";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Separator } from "@/components/atoms/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/routing";
import { Cart, CartItem, Sku } from "@/types/models";
import { motion } from "framer-motion";
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
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

// Extend shared types for stricter UI requirements (we know SKU must exist here)
interface PopulatedCartItem extends Omit<CartItem, "sku"> {
  sku: Sku & {
    product: {
      id: string;
      name: string;
      images?: string[];
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
  // Cast server items to PopulatedCartItem assuming server returns valid structure
  // In a real app we might validate this, but for now we trust the server layout fetch
  const items = isGuest
    ? guestItems
    : ((cart?.items || []) as unknown as PopulatedCartItem[]);
  const total = isGuest ? totalGuest : Number(cart?.totalAmount) || 0;

  useEffect(() => {
    if (isGuest) {
      const fetchGuestCart = async () => {
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
                        optionValues: (sku.optionValues as any)?.map(
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
            }
          } catch (e) {
            console.error("Error loading guest cart", e);
          }
        }
      };

      fetchGuestCart();
      window.addEventListener("guest_cart_updated", fetchGuestCart);
      return () => {
        window.removeEventListener("guest_cart_updated", fetchGuestCart);
      };
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
  }, [localItems.length]);

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
      } else {
        const res = await clearCartAction();
        if (res.success) {
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
        const res = await removeFromCartAction(id);
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
            const res = await updateCartItemAction(id, quantity);
            if (!res.success) {
              const availableStock = (res as { availableStock?: number })
                .availableStock;

              if (typeof availableStock === "number") {
                toast({
                  title: t("updateFailed"),
                  description: `Only ${availableStock} items available. Quantity updated to maximum.`,
                  variant: "warning",
                });
                setLocalItems((prev) =>
                  prev.map((item) =>
                    item.id === id
                      ? { ...item, quantity: availableStock }
                      : item
                  )
                );
                await updateCartItemAction(id, availableStock);
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
        } catch (error) {
          console.error("Failed to update cart item", error);
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
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans selection:bg-primary/30 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-success/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-info/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {localItems.length} {t("items")} {t("inCart")}
            </p>
          </div>

          {localItems.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <GlassButton
                  variant="ghost"
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("clearCart")}
                  </span>
                </GlassButton>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("clearConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    {t("clearConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/10">
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCart}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none"
                  >
                    {t("clearCart")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </motion.div>

        {localItems.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t("empty")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("emptyDesc")}
              </p>
            </div>
            <Link href="/shop">
              <GlassButton
                size="lg"
                className="bg-primary text-primary-foreground font-bold px-8"
              >
                {t("startShopping")}
              </GlassButton>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <GlassCard className="p-6 mb-6 overflow-hidden relative group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Truck className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-medium text-sm md:text-base">
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
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {Math.min(
                      100,
                      Math.round((total / shippingThreshold) * 100)
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-linear-to-r from-success to-info"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (total / shippingThreshold) * 100
                      )}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </GlassCard>

              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        selectedItems.length === localItems.length &&
                        localItems.length > 0
                      }
                      onCheckedChange={() => {
                        if (selectedItems.length === localItems.length) {
                          setSelectedItems([]);
                        } else {
                          setSelectedItems(localItems.map((i) => i.id));
                        }
                      }}
                    />
                    <span>{t("selectAll")}</span>
                  </div>
                </div>

                {localItems.map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <GlassCard className="p-4 md:p-6 group hover:bg-white/10 transition-all duration-300">
                      <div className="flex gap-4 md:gap-6">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                          />
                        </div>

                        <Link
                          href={`/products/${item.sku.product.id}`}
                          className="relative w-24 h-32 md:w-32 md:h-40 rounded-xl overflow-hidden bg-muted shrink-0 border border-white/5 block group/img"
                        >
                          {item.sku.imageUrl ? (
                            <Image
                              src={item.sku.imageUrl}
                              alt={item.sku.product.name}
                              fill
                              sizes="(max-width: 768px) 96px, 128px"
                              className="object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                          ) : item.sku.product.images?.[0] ? (
                            <Image
                              src={item.sku.product.images[0]}
                              alt={item.sku.product.name}
                              fill
                              sizes="(max-width: 768px) 96px, 128px"
                              className="object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                          ) : (
                            <Image
                              src={`https://picsum.photos/seed/${
                                item.sku.product.id || "fallback"
                              }/400/600`}
                              alt={item.sku.product.name}
                              fill
                              sizes="(max-width: 768px) 96px, 128px"
                              className="object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                          )}
                        </Link>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <Link
                                href={`/products/${item.sku.product.id}`}
                                className="font-bold text-lg md:text-xl hover:text-primary transition-colors line-clamp-2"
                              >
                                {item.sku.product.name}
                              </Link>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              >
                                <X size={20} />
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.sku.optionValues?.map((ov) => (
                                <span
                                  key={ov.optionValue.id}
                                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] md:text-xs font-medium text-muted-foreground"
                                >
                                  {ov.optionValue.option.name}:{" "}
                                  {ov.optionValue.value}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                            <div className="flex items-center bg-black/20 rounded-full border border-white/10 p-1 w-fit">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1 || isPending}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-10 text-center font-bold text-sm">
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
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
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
                                <p className="text-xs text-muted-foreground line-through">
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
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GlassCard className="p-6 md:p-8 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">{t("orderSummary")}</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("subtotal")}</span>
                    <span className="font-medium text-foreground">
                      {format.number(total, {
                        style: "currency",
                        currency: "VND",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("shipping")}</span>
                    <span className="text-success font-medium">
                      {isFreeShipping ? t("free") : t("calculatedAtCheckout")}
                    </span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold">{t("total")}</span>
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary tracking-tight">
                        {format.number(total, {
                          style: "currency",
                          currency: "VND",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
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
                        className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-2xl shadow-xl shadow-primary/20"
                        size="lg"
                      >
                        {t("loginToCheckout")}
                      </GlassButton>
                    </Link>
                  ) : (
                    <Link
                      href={
                        selectedItems.length > 0 && !isCheckoutBlocked
                          ? `/checkout?items=${selectedItems.join(",")}`
                          : "#"
                      }
                      onClick={(e) => isCheckoutBlocked && e.preventDefault()}
                    >
                      <GlassButton
                        className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-2xl shadow-xl shadow-primary/20"
                        size="lg"
                        disabled={
                          localItems.length === 0 ||
                          selectedItems.length === 0 ||
                          isCheckoutBlocked
                        }
                      >
                        {isCheckoutBlocked ? (
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Lock className="w-4 h-4 mr-2" />
                        )}
                        {isCheckoutBlocked
                          ? t("checkingStock")
                          : t("secureCheckout")}
                      </GlassButton>
                    </Link>
                  )}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-success" />
                      <span>{t("securePayments")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <RefreshCcw className="w-4 h-4 text-info" />
                      <span>{t("freeReturns")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>{t("fastShipping")}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
