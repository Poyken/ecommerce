/**
 * =====================================================================
 * CHECKOUT CLIENT - Giao diện thanh toán tập trung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT DECOMPOSITION (Chia nhỏ Component):
 * - Form thanh toán rất phức tạp nên được chia nhỏ thành các component chức năng:
 *   - `AddressSelector`: Logic chọn/Thêm địa chỉ giao hàng.
 *   - `PaymentMethodSelector`: Logic chọn phương thức thanh toán.
 *   - `CouponInput`: Logic nhập và validate mã giảm giá.
 *   - `OrderSummary`: Logic hiển thị tổng tiền cuối cùng.
 *
 * 2. REACT TRANSITION (`useTransition`):
 * - Khi user nhấn "Đặt hàng", ta bọc hành động này trong `startTransition`.
 * - Lợi ích: Nếu action chạy lâu, UI vẫn phản hồi (không bị đơ), và React có thể hiển thị trạng thái `isPending`.
 *
 * 3. HYBRID CART (Giỏ hàng lai):
 * - `cart`: Giỏ hàng của user đã login (lấy từ DB).
 * - `guestItems`: Giỏ hàng của khách (lấy từ LocalStorage -> convert thành objects).
 * - Component này phải xử lý cả 2 trường hợp một cách trong suốt (Transparent).
 *
 * 4. DYNAMIC FEE CALCULATION:
 * - Khi `selectedAddress` thay đổi -> Trigger `useEffect` gọi shipping API.
 * - Cập nhật phí ship realtime dựa trên Quận/Huyện. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Interactive Payment Orchestration: Điều phối luồng thanh toán đa bước một cách thông minh, từ khâu chọn địa chỉ đến việc tính toán phí vận chuyển và áp dụng mã giảm giá theo thời gian thực.
 * - Real-time Order Validation: Đảm bảo mọi thông tin đơn hàng đều hợp lệ trước khi gửi về Server, giúp giảm thiểu sai sót dữ liệu và cung cấp phản hồi tức thì về tình trạng kho hàng hoặc tính hợp lệ của Coupon.

 * =====================================================================
 */

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
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-success/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-info/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>{t("backToCart")}</span>
          </Link>
        </div>

        <m.div
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {t("secureCheckout")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {t("title")}
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
                    className="w-full bg-linear-to-r from-success to-success/80 font-bold text-white shadow-lg shadow-success/20"
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t("secureTransaction")}</span>
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
