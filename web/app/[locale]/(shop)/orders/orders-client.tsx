/**
 * =====================================================================
 * ORDERS CLIENT - Giao diện danh sách đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ORDER LISTING:
 * - Hiển thị danh sách đơn hàng của người dùng dưới dạng các thẻ (`GlassCard`).
 * - Mỗi thẻ chứa thông tin cơ bản: Mã đơn hàng, Trạng thái, Ngày đặt, Tổng tiền.
 *
 * 2. CONDITIONAL ACTIONS:
 * - `PENDING`: Cho phép hủy đơn hàng (`cancelOrderAction`).
 * - `DELIVERED`: Cho phép đặt lại (`ReorderButton`).
 * - Luôn có nút "Xem chi tiết" để chuyển hướng sang trang chi tiết đơn hàng.
 *
 * 3. EMPTY STATE:
 * - Nếu không có đơn hàng, hiển thị thông báo thân thiện và nút "Bắt đầu mua sắm" để dẫn dắt người dùng.
 * =====================================================================
 */

"use client";

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
import { Button } from "@/components/atoms/button";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { StatusBadge } from "@/components/atoms/status-badge";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemVariant, staggerContainer } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import { Order as BaseOrder } from "@/types/models";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, Box, Calendar, CreditCard, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReorderButton } from "./reorder-button";

export type Order = Pick<
  BaseOrder,
  "id" | "totalAmount" | "status" | "createdAt"
> & {
  orderNumber?: string;
  items: { quantity: number }[];
};

interface OrdersClientProps {
  orders: Order[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pt-24 pb-24 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("subtitle", { count: orders.length })}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {orders.length > 0 ? (
            orders.map((order) => (
              <motion.div key={order.id} variants={itemVariant}>
                <GlassCard className="p-6 transition-all hover:bg-white/10 group border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-lg font-bold text-primary">
                          {t("orderNumber")}
                          {order.orderNumber ||
                            order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge
                          status={order.status}
                          label={t(`status.${order.status}`)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {format(new Date(order.createdAt), "PPP")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} />
                          <span className="text-foreground font-medium">
                            {formatCurrency(Number(order.totalAmount))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box size={16} />
                          <span>
                            {t("items", {
                              count:
                                order.items?.reduce(
                                  (acc, item) => acc + item.quantity,
                                  0
                                ) || 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
                      {order.status === "PENDING" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full md:w-auto"
                            >
                              {t("cancelOrder")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("confirmCancel")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently cancel your order.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/10">
                                {tCommon("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  await import("@/actions/order").then((mod) =>
                                    mod.cancelOrderAction(order.id)
                                  );
                                }}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none"
                              >
                                {t("cancelOrder")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {order.status === "DELIVERED" && (
                        <ReorderButton orderId={order.id} />
                      )}
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          variant="outline"
                          className="w-full md:w-auto group-hover:border-primary/50 group-hover:text-primary transition-colors"
                        >
                          {t("viewDetails")}
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
              variants={itemVariant}
            >
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("noOrders")}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("noOrdersDesc")}
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
          )}
        </motion.div>
      </div>
    </div>
  );
}
