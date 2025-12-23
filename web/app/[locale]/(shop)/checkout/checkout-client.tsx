/**
 * =====================================================================
 * CHECKOUT CLIENT - Giao diện thanh toán tập trung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT DECOMPOSITION:
 * - Form thanh toán rất phức tạp nên được chia nhỏ thành các component:
 *   - `AddressSelector`: Chọn/Thêm địa chỉ giao hàng.
 *   - `PaymentMethodSelector`: Chọn phương thức thanh toán (COD, VNPAY...).
 *   - `CouponInput`: Nhập và kiểm tra mã giảm giá.
 *   - `OrderSummary`: Hiển thị tổng tiền và nút đặt hàng.
 *
 * 2. DYNAMIC CALCULATIONS:
 * - `shippingFee`: Tự động tính toán lại khi user thay đổi địa chỉ (gọi `calculateShippingFeeAction`).
 * - `discount`: Cập nhật khi áp dụng mã giảm giá thành công.
 * - `subtotal`: Tổng tiền hàng (có thể chỉ tính cho các món được chọn từ giỏ hàng).
 *
 * 3. ORDER FLOW:
 * - Khi nhấn đặt hàng, `placeOrderAction` được gọi.
 * - Nếu là VNPAY, sẽ redirect user sang trang thanh toán của ngân hàng.
 * =====================================================================
 */

"use client";

import { validateCouponAction } from "@/actions/coupon";
import { placeOrderAction } from "@/actions/order";
import { calculateShippingFeeAction } from "@/actions/shipping";
import { GlassButton } from "@/components/atoms/glass-button";
import { AddAddressDialog } from "@/components/organisms/admin/add-address-dialog";
import { AddressSelector } from "@/components/organisms/checkout/address-selector";
import { CouponInput } from "@/components/organisms/checkout/coupon-input";
import { OrderSummary } from "@/components/organisms/checkout/order-summary";
import {
  PaymentMethodSelector,
  PaymentMethodType,
} from "@/components/organisms/checkout/payment-method-selector";
import { useToast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Address, Cart, CartItem, Coupon } from "@/types/models";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

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

  const allItems = useMemo(
    () => (cart?.items || []) as unknown as CartItem[],
    [cart]
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
      try {
        // Dynamically import to avoid server-side issues if any
        const { http } = await import("@/lib/http");
        const res = await http<Coupon[] | { data: Coupon[] }>(
          "/coupons/available",
          {
            skipAuth: true,
          }
        );
        const list = Array.isArray(res)
          ? res
          : res?.data && Array.isArray(res.data)
          ? res.data
          : [];
        setAvailableCoupons(list);
      } catch (e) {
        console.error("Failed to fetch coupons", e);
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
          const fee = await calculateShippingFeeAction(
            Number(selectedAddress.districtId),
            selectedAddress.wardCode
          );
          setShippingFee(fee);
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
  const handleApplyCoupon = async (code?: string) => {
    const targetCode = code || couponCode;
    if (!targetCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await validateCouponAction(targetCode, subtotal);

      if (res.success) {
        if (res.isValid) {
          setAppliedCoupon({
            code: targetCode,
            discount: res.discountAmount || 0,
          });
          toast({
            title: t("couponApplied"),
            description: tCommon("toast.success"),
            variant: "success",
          });
        } else {
          setCouponError(res.message || t("couponInvalid"));
          setAppliedCoupon(null);
        }
      } else {
        setCouponError(res.error || t("couponInvalid"));
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = () => {
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
        shippingAddress: addressString, // Changed from address to shippingAddress
        addressId: selectedAddress.id,
        paymentMethod: paymentMethod,
        itemIds: items.map((i) => i.id),
        couponCode: appliedCoupon?.code,
      });

      if (res.success) {
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        }
        // Dispatch event to refresh cart count immediately
        window.dispatchEvent(new Event("cart_updated"));

        toast({
          title: t("success"),
          description: t("successDesc"),
          variant: "success",
        });
        router.push("/orders");
      } else {
        toast({
          title: t("failed"),
          description: res.error || t("error"),
          variant: "destructive",
        });
      }
    });
  };

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

        <motion.div
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-4">
            <Lock className="w-4 h-4 text-success" />
            <span className="text-sm text-success font-medium">
              {t("secureCheckout")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {t("title")}
          </h1>
        </motion.div>

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
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>{t("secureTransaction")}</span>
                </div>
              }
            />
          </div>
        </div>
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
    </div>
  );
}
