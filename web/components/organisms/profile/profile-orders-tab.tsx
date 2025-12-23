/**
 * =====================================================================
 * PROFILE ORDERS TAB - Tab lịch sử đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ORDER LISTING:
 * - Hiển thị danh sách các đơn hàng đã mua kèm theo mã đơn hàng, trạng thái, ngày đặt và tổng tiền.
 * - Sử dụng `StatusBadge` để hiển thị trạng thái đơn hàng một cách trực quan (màu sắc khác nhau cho mỗi trạng thái).
 *
 * 2. EMPTY STATE:
 * - Nếu chưa có đơn hàng, hiển thị thông báo kèm nút "Start Shopping" để dẫn dắt người dùng.
 *
 * 3. SKELETON LOADING:
 * - Hiển thị các khung placeholder (skeleton) trong khi đang tải dữ liệu từ API.
 * =====================================================================
 */

"use client";

import { getMyOrdersAction } from "@/actions/order";
import { GlassButton } from "@/components/atoms/glass-button";
import { GlassCard } from "@/components/atoms/glass-card";
import { StatusBadge } from "@/components/atoms/status-badge";
import { Link } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types/models";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Box, Calendar, CreditCard, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ProfileOrdersTab() {
  const t = useTranslations("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrdersAction();
        if (res.data) {
          setOrders(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">{t("noOrders")}</h3>
        <p className="text-muted-foreground mb-6">{t("noOrdersDesc")}</p>
        <Link href="/shop">
          <GlassButton className="bg-primary text-primary-foreground">
            {t("startShopping")}
          </GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { count: orders.length })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 transition-all hover:bg-white/10 group border border-transparent hover:border-primary/20">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-lg font-bold text-primary">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge
                        status={order.status}
                        label={t(`status.${order.status}` as "status.PENDING")}
                      />
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{format(new Date(order.createdAt), "PPP")}</span>
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

                  <Link href={`/orders/${order.id}`}>
                    <GlassButton
                      variant="ghost"
                      className="w-full md:w-auto group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      {t("viewDetails")}
                      <ArrowRight size={16} className="ml-2" />
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
