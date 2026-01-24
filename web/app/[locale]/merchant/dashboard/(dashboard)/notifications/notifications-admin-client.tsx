"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getCouponsAction,
  getOrdersAction,
  getProductsAction,
} from "@/features/admin/actions";
import {
  broadcastNotificationAction,
  sendNotificationToUserAction,
} from "@/features/notifications/actions";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Coupon, Order, Product } from "@/types/models";
import { Bell, Mail, Send, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { NotificationHistoryTab } from "./notification-history-tab";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface NotificationsAdminClientProps {
  users: User[];
}

const ALL_USERS_VALUE = "__ALL_USERS__";


export function NotificationsAdminClient({
  users,
}: NotificationsAdminClientProps) {
  const t = useTranslations("admin.notifications");
  const { toast } = useToast();
  const [mode, setMode] = useState<"broadcast" | "individual">("broadcast");
  const [isLoading, setIsLoading] = useState(false);

  // Link Builder State
  const [linkType, setLinkType] = useState<
    "custom" | "product" | "order" | "coupon"
  >("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [formData, setFormData] = useState({
    userId: "",
    type: "SYSTEM",
    title: "",
    message: "",
    link: "",
    sendEmail: false,
  });

  // Fetch products/orders/coupons when search changes
  useEffect(() => {
    const fetchData = async () => {
      if (linkType === "product") {
        const res = await getProductsAction({
          page: 1,
          limit: 10,
          search: debouncedSearch,
        });
        if ("data" in res && res.data) setProducts(res.data);
      } else if (linkType === "order") {
        const res = await getOrdersAction({
          page: 1,
          limit: 10,
          search: debouncedSearch,
        });
        if ("data" in res && res.data)
          setOrders(res.data as unknown as Order[]);
      } else if (linkType === "coupon") {
        const res = await getCouponsAction();
        if ("data" in res && res.data) {
          // Client-side filter for coupons as API might not support search yet
          const allCoupons = res.data as Coupon[];
          const filtered = debouncedSearch
            ? allCoupons.filter((c: Coupon) =>
                c.code.toLowerCase().includes(debouncedSearch.toLowerCase())
              )
            : allCoupons;
          setCoupons(filtered);
        }
      }
    };
    fetchData();
  }, [debouncedSearch, linkType]);

  const userOptions: ComboboxOption[] = useMemo(() => {
    const options: ComboboxOption[] = [
      {
        value: ALL_USERS_VALUE,
        label: t("form.allUsers") || "All Users",
        description: `${users.length} users`,
      },
    ];
    users.forEach((user) => {
      options.push({
        value: user.id,
        label:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        description: user.email,
      });
    });
    return options;
  }, [users, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result: { success?: boolean; error?: string };

      // If broadcast mode OR "All Users" selected in individual mode
      if (mode === "broadcast" || formData.userId === ALL_USERS_VALUE) {
        result = await broadcastNotificationAction({
          type: formData.type,
          title: formData.title,
          message: formData.message,
          link: formData.link || undefined,
          sendEmail: formData.sendEmail,
        });
      } else {
        const selectedUser = users.find((u) => u.id === formData.userId);
        result = await sendNotificationToUserAction({
          userId: formData.userId,
          type: formData.type,
          title: formData.title,
          message: formData.message,
          link: formData.link || undefined,
          sendEmail: formData.sendEmail,
          email: selectedUser?.email,
        });
      }

      if (result.success) {
        toast({
          title: t("form.success"),
          variant: "success",
        });
        setFormData({
          ...formData,
          title: "",
          message: "",
          link: "",
        });
        setLinkType("custom");
      } else {
        console.error("Notification send failed:", result);
        toast({
          title: "Lỗi gửi thông báo (Server)",
          description:
            result.error ||
            JSON.stringify(result) ||
            "Lỗi không xác định từ server",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Notification send error (Client catch):", error);
      toast({
        title: "Lỗi hệ thống (Client)",
        description:
          error.message ||
          error.digest ||
          JSON.stringify(error) ||
          "Lỗi không xác định",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<Bell className="text-indigo-500 fill-indigo-500/20" />}
        variant="indigo"
        stats={[
          { label: "Active Users", value: users.length, variant: "amber" },
          { label: "Broadcasts", value: "48", variant: "info" },
        ]}
      />

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner mb-8">
          <TabsTrigger
            value="send"
            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-rose-500 transition-all font-black uppercase tracking-widest text-xs gap-2"
          >
            <Send className="w-4 h-4" />
            {t("send")}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-slate-600 transition-all font-black uppercase tracking-widest text-xs gap-2"
          >
            <Bell className="w-4 h-4" />
            {t("history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant={mode === "broadcast" ? "default" : "outline"}
              onClick={() => setMode("broadcast")}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {t("broadcast")}
            </Button>
            <Button
              variant={mode === "individual" ? "default" : "outline"}
              onClick={() => setMode("individual")}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t("sendToUser")}
            </Button>
          </div>

          <GlassCard className="p-8 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "individual" && (
                <div className="space-y-2">
                  <Label htmlFor="user">{t("form.user")}</Label>
                  <Combobox
                    options={userOptions}
                    value={formData.userId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, userId: val })
                    }
                    placeholder={t("form.selectUser") || "Select user..."}
                    searchPlaceholder={
                      t("form.searchUser") || "Search users..."
                    }
                    emptyText={t("form.noUsers") || "No users found."}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t("form.type")}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: string) =>
                      setFormData({ ...formData, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SYSTEM">System</SelectItem>
                      <SelectItem value="PROMOTION">Promotion</SelectItem>
                      <SelectItem value="ORDER">Order</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{t("form.title")}</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("form.message")}</Label>
                <Textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>{t("form.linkType") || "Link Type"}</Label>
                  <Select
                    value={linkType}
                    onValueChange={(
                      val: "custom" | "product" | "order" | "coupon"
                    ) => {
                      setLinkType(val);
                      setSearchQuery("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">
                        {t("form.customUrl") || "Custom URL"}
                      </SelectItem>
                      <SelectItem value="product">
                        {t("form.product") || "Product"}
                      </SelectItem>
                      <SelectItem value="order">
                        {t("form.order") || "Order"}
                      </SelectItem>
                      <SelectItem value="coupon">
                        {t("form.coupon") || "Coupon"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="link">{t("form.link")}</Label>
                  {linkType === "custom" && (
                    <Input
                      id="link"
                      placeholder="/products/..."
                      value={formData.link}
                      onChange={(e) =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                    />
                  )}
                  {linkType === "product" && (
                    <Combobox
                      options={products.map((p) => ({
                        value: `/products/${p.id}`,
                        label: p.name,
                        description: p.slug,
                      }))}
                      value={formData.link}
                      onValueChange={(val) =>
                        setFormData({ ...formData, link: val })
                      }
                      searchValue={searchQuery}
                      onSearchChange={setSearchQuery}
                      placeholder={
                        t("form.selectProduct") || "Select Product..."
                      }
                      searchPlaceholder={
                        t("form.searchProduct") || "Search product..."
                      }
                      emptyText={t("form.noProducts") || "No products found."}
                    />
                  )}
                  {linkType === "order" && (
                    <Combobox
                      options={orders.map((o) => ({
                        value: `/orders/${o.id}`,
                        label: `Order #${o.id.slice(0, 8).toUpperCase()}`,
                        description: `${o.totalAmount} - ${o.status}`,
                      }))}
                      value={formData.link}
                      onValueChange={(val) =>
                        setFormData({ ...formData, link: val })
                      }
                      searchValue={searchQuery}
                      onSearchChange={setSearchQuery}
                      placeholder={t("form.selectOrder") || "Select Order..."}
                      searchPlaceholder={
                        t("form.searchOrder") || "Search order..."
                      }
                      emptyText={t("form.noOrders") || "No orders found."}
                    />
                  )}
                  {linkType === "coupon" && (
                    <Combobox
                      options={coupons.map((c) => ({
                        value: `/shop?coupon=${c.code}`,
                        label: `${c.code} - ${c.discountValue}${
                          c.discountType === "PERCENTAGE" ? "%" : ""
                        } OFF`,
                        description: c.description || "No description",
                      }))}
                      value={formData.link}
                      onValueChange={(val) =>
                        setFormData({ ...formData, link: val })
                      }
                      searchValue={searchQuery}
                      onSearchChange={setSearchQuery}
                      placeholder={t("form.selectCoupon") || "Select Coupon..."}
                      searchPlaceholder={
                        t("form.searchCoupon") || "Search coupon..."
                      }
                      emptyText={t("form.noCoupons") || "No coupons found."}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base">{t("form.sendEmail")}</Label>
                    <p className="text-xs text-muted-foreground">
                      Send a copy of this message to the user&apos;s email
                      address
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.sendEmail}
                  onCheckedChange={(val: boolean | "indeterminate") =>
                    setFormData({ ...formData, sendEmail: val === true })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold"
                disabled={
                  isLoading ||
                  !formData.title.trim() ||
                  !formData.message.trim() ||
                  (mode === "individual" && !formData.userId)
                }
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("form.sending")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    {t("form.submit")}
                  </span>
                )}
              </Button>
            </form>
          </GlassCard>
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
