import { getProfileAction } from "@/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { http } from "@/lib/http";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface User {
  id: string;
}

interface Product {
  id: string;
}

export default async function AdminDashboardPage() {
  const { data: user } = await getProfileAction();
  if (!user) redirect("/login");

  // Parallel data fetching
  const [ordersRes, usersRes, productsRes] = await Promise.all([
    http<{ data: Order[] }>("/orders"),
    http<{ data: User[] }>("/users"),
    http<{ data: Product[] }>("/products"),
  ]);

  const orders = ordersRes.data || [];
  const users = usersRes.data || [];
  const products = productsRes.data || [];

  // Calculate Stats
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );
  const totalOrders = orders.length;
  const totalCustomers = users.length;
  const totalProducts = products.length;

  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <div className="text-sm text-gray-500">
          Welcome back,{" "}
          <span className="font-semibold text-gray-900">{user.firstName}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-green-600 font-medium">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              +{totalOrders}
            </div>
            <p className="text-xs text-blue-600 font-medium">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              +{totalCustomers}
            </div>
            <p className="text-xs text-orange-600 font-medium">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              +{totalProducts}
            </div>
            <p className="text-xs text-purple-600 font-medium">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : "Guest"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500 py-4"
                    >
                      No recent orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions / Recent Activity Placeholder */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link
              href="/admin/products"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors bg-white"
            >
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Manager Products</h4>
                <p className="text-sm text-gray-500">
                  Create a new product listing
                </p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors bg-white"
            >
              <div className="bg-orange-100 p-2 rounded-full mr-4">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Manage Users</h4>
                <p className="text-sm text-gray-500">
                  View and edit user roles
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
