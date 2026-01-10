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
import { AdminAlerts } from "@/features/admin/components/admin-alerts";
import { Link } from "@/i18n/routing";
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
              <Truck className="h-5 w-5 text-indigo-600" />
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
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest transactions from your store
            </CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" className="text-indigo-600 font-bold">
              View All Orders <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[180px]">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
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
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/orders/${order.id}` as any}
                        className="flex flex-col"
                      >
                        <span className="font-mono text-indigo-600 font-bold group-hover:underline">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {order.user?.firstName} {order.user?.lastName}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {order.user?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border", getStatusStyle(order.status))}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
