 
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminAlerts } from "@/features/admin/components/ui/admin-alerts";
import { AdminTableWrapper } from "@/features/admin/components/ui/admin-page-components";
import { Link } from "@/i18n/routing";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowRight,
  ExternalLink,
  Package,
  Truck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface OperationsTabProps {
  recentOrders: any[];
  lowStockSkus: any[];
  lowStockCount: number;
  trendingProducts: any[];
  stats: any;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "PENDING":
      return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "SHIPPED":
      return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "CANCELLED":
      return "bg-red-500/10 text-red-600 border-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function OperationsTab({
  recentOrders,
  lowStockSkus,
  lowStockCount,
  trendingProducts,
  stats,
}: OperationsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Order Fulfillment Pulse */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-600" />
              Order Fulfillment Pulse
            </CardTitle>
            <CardDescription>Real-time order processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-100 flex flex-col items-center justify-center text-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mb-2" />
                <span className="text-3xl font-black text-amber-600">
                  {stats.pendingOrders}
                </span>
                <span className="text-xs font-bold uppercase text-amber-600/70 tracking-wider">
                  Pending Action
                </span>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-100 flex flex-col items-center justify-center text-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mb-2" />
                <span className="text-3xl font-black text-blue-600 text-opacity-50">
                  --
                </span>
                <span className="text-xs font-bold uppercase text-blue-600/70 tracking-wider">
                  Processing
                </span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-100 flex flex-col items-center justify-center text-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mb-2" />
                <span className="text-3xl font-black text-emerald-600 text-opacity-50">
                  --
                </span>
                <span className="text-xs font-bold uppercase text-emerald-600/70 tracking-wider">
                  Completed Today
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Inventory */}
        <div className="space-y-6">
          <AdminAlerts
            lowStockSkus={lowStockSkus}
            lowStockCount={lowStockCount}
            trendingProducts={trendingProducts}
          />
        </div>
      </div>

      {/* Recent Orders List */}
      <AdminTableWrapper
        title="Recent Orders Pulse"
        description="Latest transactions from your store with real-time tracking"
        variant="glass"
        headerActions={
          <Link href="/admin/orders">
            <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest">
              View All Orders <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order: any) => (
                <TableRow
                  key={order.id}
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <TableCell className="font-medium">
                    <TypedLink
                      href={`/admin/orders/${order.id}` as AppRoute}
                      className="flex flex-col"
                    >
                      <span className="font-black text-primary group-hover:underline tracking-tight">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-bold">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </span>
                    </TypedLink>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">
                        {order.user?.firstName} {order.user?.lastName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {order.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", getStatusStyle(order.status))}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>
    </div>
  );
}
