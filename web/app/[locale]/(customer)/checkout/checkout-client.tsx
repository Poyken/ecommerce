

"use client";

import { GlassButton } from "@/components/shared/glass-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  validateCouponAction,
  getAvailableCouponsAction,
} from "@/features/coupons/actions";
import { placeOrderAction } from "@/features/orders/actions";
import { calculateShippingFeeAction } from "@/features/shipping/actions";
// import { AddAddressDialog } from "@/features/admin/components/dialogs/add-address-dialog"; // Replaced with dynamic import
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getGuestCartDetailsAction } from "@/features/cart/actions";
import { AddressSelector } from "@/features/checkout/components/address-selector";
import { CouponInput } from "@/features/checkout/components/coupon-input";
import { OrderSummary } from "@/features/checkout/components/order-summary";
import {
  PaymentMethodSelector,
  PaymentMethodType,
} from "@/features/checkout/components/payment-method-selector";
import { Link, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import { Address, Cart, CartItem, Coupon, Sku } from "@/types/models";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

const AddAddressDialog = dynamic(
  () =>
    import("@/features/admin/components/users/add-address-dialog").then(
      (m) => m.AddAddressDialog
    ),
  { ssr: false }
);

const BankTransferQR = dynamic(
  () =>
    import("@/features/orders/components/bank-transfer-qr").then(
      (m) => m.BankTransferQR
    ),
  { ssr: false }
);

interface CheckoutClientProps {
  cart: Cart | null;
  addresses: Address[];
}

export function CheckoutClient({ cart, addresses = [] }: CheckoutClientProps) {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("COD");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(!cart);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tempOrderData, setTempOrderData] = useState<{
    id: string;
    totalAmount: number;
    createdAt: string;
    qrUrl?: string;
  } | null>(null);

  // Derived State
  const itemIdsParam = searchParams.get("items");
  const selectedItemIds = useMemo(
    () => (itemIdsParam ? itemIdsParam.split(",") : []),
    [itemIdsParam]
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  useEffect(() => {
    if (!cart) {
      const fetchGuestCart = async () => {
        // Delay to ensure hydration
        await new Promise((resolve) => setTimeout(resolve, 100));

        const guestCartStr = localStorage.getItem("guest_cart");
        if (guestCartStr) {
          try {
            const parsed = JSON.parse(guestCartStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const skuIds = parsed
                .map((p) => p.skuId)
                .filter((id): id is string => !!id);
              const res = await getGuestCartDetailsAction(skuIds);

              if (res.success && res.data) {
                // Map API response to CartItem structure
                const mappedItems: CartItem[] = res.data.map((sku: Sku) => {
                  const q =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    parsed.find((p: any) => p.skuId === sku.id)?.quantity || 1;
                  return {
                    id: `guest-${sku.id}`,
                    cartId: "guest",
                    skuId: sku.id,
                    quantity: q,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    sku: {
                      ...sku,
                      price: Number(sku.price),
                      salePrice: sku.salePrice ? Number(sku.salePrice) : null,
                      stock: sku.stock,
                      product: sku.product,
                    },
                  } as unknown as CartItem;
                });
                setGuestItems(mappedItems);
              }
            }
          } catch {
            // Silently fail
          } finally {
            setIsInitializing(false);
          }
        } else {
          setIsInitializing(false);
        }
      };

      fetchGuestCart();
    } else {
      setIsInitializing(false);
    }
  }, [cart]);

  const allItems = useMemo(
    () => (cart?.items || guestItems) as unknown as CartItem[],
    [cart, guestItems]
  );

  const items = useMemo(
    () =>
      selectedItemIds.length > 0
        ? allItems.filter(
            (item) =>
              selectedItemIds.includes(item.id) ||
              (item.skuId && selectedItemIds.includes(item.skuId)) ||
              (item.sku?.id && selectedItemIds.includes(item.sku.id))
          )
        : allItems,
    [allItems, selectedItemIds]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.sku?.salePrice || item.sku?.price || 0) * item.quantity,
        0
      ),
    [items]
  );

  const discount = appliedCoupon?.discount || 0;
  const total = useMemo(
    () => Math.max(0, subtotal + shippingFee - discount),
    [subtotal, shippingFee, discount]
  );

  // Effects
  useEffect(() => {
    const fetchCoupons = async () => {
      const result = await getAvailableCouponsAction();
      if (result.success && result.data) {
        setAvailableCoupons(result.data);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const fetchFee = async () => {
      if (
        selectedAddress &&
        selectedAddress.districtId &&
        selectedAddress.wardCode
      ) {
        setIsCalculatingFee(true);
        try {
          const result = await calculateShippingFeeAction(
            Number(selectedAddress.districtId),
            selectedAddress.wardCode
          );
          if (result.success && typeof result.data === "number") {
            setShippingFee(result.data);
          } else {
            setShippingFee(0);
          }
        } finally {
          setIsCalculatingFee(false);
        }
      } else {
        setShippingFee(0);
        setIsCalculatingFee(false);
      }
    };
    fetchFee();
  }, [selectedAddress]);

  // Handlers
  const handleApplyCoupon = useCallback(
    async (code?: string) => {
      const targetCode = code || couponCode;
      if (!targetCode.trim()) return;

      setIsValidatingCoupon(true);
      setCouponError("");

      try {
        const res = await validateCouponAction(targetCode, subtotal);

        if (res.success && res.data) {
          if (res.data.isValid) {
            setAppliedCoupon({
              code: targetCode,
              discount: res.data.discountAmount || 0,
            });
            toast({
              title: t("couponApplied"),
              description: tCommon("toast.success"),
              variant: "success",
            });
          } else {
            setCouponError(res.data.message || t("couponInvalid"));
            setAppliedCoupon(null);
          }
        } else {
          setCouponError(res.error || t("couponInvalid"));
          setAppliedCoupon(null);
        }
      } catch {
        setCouponError("Failed to validate coupon");
      } finally {
        setIsValidatingCoupon(false);
      }
    },
    [couponCode, subtotal, t, tCommon, toast]
  );

  const handlePlaceOrder = useCallback(() => {
    if (!selectedAddress) {
      toast({
        title: t("missingInfo"),
        description: t("selectAddress"),
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const addressString = `${selectedAddress.street}, ${
        selectedAddress.ward || ""
      }, ${selectedAddress.district}, ${selectedAddress.city}`;

      const res = await placeOrderAction({
        recipientName: selectedAddress.recipientName,
        phoneNumber: selectedAddress.phoneNumber,
        shippingAddress: addressString,
        addressId: selectedAddress.id,
        paymentMethod: paymentMethod,
        itemIds: items.map((i) => i.id),
        couponCode: appliedCoupon?.code,
      });

      if (res.success) {
        if ((res.data as any)?.paymentUrl) {
          window.location.href = (res.data as any).paymentUrl;
          return;
        }
        window.dispatchEvent(new Event("cart_updated"));

        if (paymentMethod === "BANKING" || paymentMethod === "VIETQR") {
          setTempOrderData({
            id: (res.data as any)?.orderId || "",
            totalAmount: total,
            createdAt: new Date().toISOString(),
            qrUrl:
              paymentMethod === "VIETQR"
                ? (res.data as any)?.paymentUrl
                : undefined,
          });
          setIsPaymentModalOpen(true);
          return;
        }

        toast({
          title: t("toast.success"),
          description: t("toast.successDesc"),
          variant: "success",
        });
        router.push(`/checkout/success?orderId=${(res.data as any)?.orderId}`);
      } else {
        toast({
          title: t("failed"),
          description: res.error || t("error"),
          variant: "destructive",
        });
      }
    });
  }, [
    selectedAddress,
    paymentMethod,
    items,
    appliedCoupon,
    total,
    router,
    t,
    toast,
  ]);

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddAddressOpen(true);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24 font-sans relative overflow-hidden transition-colors duration-500 selection:bg-accent/30">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10">
        <div className="mb-12">
          <Link
            href="/cart"
            className="group inline-flex items-center gap-4 text-muted-foreground/60 hover:text-accent transition-all duration-300 font-black uppercase text-[10px] tracking-[0.3em]"
          >
            <div className="size-10 rounded-xl glass-premium border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span>{t("backToCart")}</span>
          </Link>
        </div>

        <m.div
          className="text-left mb-20 space-y-6"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
            <Lock className="w-3 h-3 text-accent animate-pulse" />
            <span>{t("secureCheckout")}</span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
            <span className="block">{t("title")}</span>
            <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Final Step to Luxury</span>
          </h1>
        </m.div>

        {isInitializing ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-8 space-y-6">
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAddNew={() => {
                  setEditingAddress(null);
                  setIsAddAddressOpen(true);
                }}
                onEdit={handleEditAddress}
              />

              <PaymentMethodSelector
                method={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={shippingFee}
                discount={discount}
                total={total}
                isLoadingFee={isCalculatingFee}
                couponSlot={
                  <CouponInput
                    couponCode={couponCode}
                    onCodeChange={setCouponCode}
                    availableCoupons={availableCoupons}
                    appliedCoupon={appliedCoupon}
                    isValidating={isValidatingCoupon}
                    onApply={handleApplyCoupon}
                    onRemove={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                      setCouponError("");
                    }}
                    error={couponError}
                    formatMoney={formatCurrency}
                  />
                }
                actionSlot={
                  <GlassButton
                    className="w-full bg-linear-to-r from-primary to-indigo-600 font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-primary/20 py-8 rounded-4xl border-white/10"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isPending || !cart || items.length === 0}
                  >
                    {isPending
                      ? t("processing")
                      : t("completeOrderWithTotal", {
                          total: formatCurrency(total),
                        })}
                  </GlassButton>
                }
                footerSlot={
                  <div className="flex items-center justify-center gap-3 py-4 bg-white/5 rounded-2xl border border-white/5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      {t("secureTransaction")}
                    </span>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>

      <AddAddressDialog
        open={isAddAddressOpen}
        onOpenChange={(open) => {
          setIsAddAddressOpen(open);
          if (!open) setEditingAddress(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
        address={editingAddress}
      />

      <Dialog
        open={isPaymentModalOpen}
        onOpenChange={(open) => {
          if (!open && tempOrderData) {
            router.push(`/checkout/success?orderId=${tempOrderData.id}`);
          }
          setIsPaymentModalOpen(open);
        }}
      >
        <DialogContent className="max-w-7xl! max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("completePayment")}</DialogTitle>
            <DialogDescription>{t("scanQrDesc")}</DialogDescription>
          </DialogHeader>

          {tempOrderData && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full">
                <BankTransferQR
                  amount={tempOrderData.totalAmount}
                  orderCode={tempOrderData.id.slice(0, 8).toUpperCase()}
                  orderId={tempOrderData.id}
                  createdAt={tempOrderData.createdAt}
                  qrUrl={tempOrderData.qrUrl}
                />
              </div>

              <div className="flex gap-4 mt-6 w-full justify-center">
                <GlassButton
                  onClick={() =>
                    router.push(`/checkout/success?orderId=${tempOrderData.id}`)
                  }
                  className="w-full max-w-sm"
                >
                  {t("finishAndViewOrder")}
                </GlassButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
