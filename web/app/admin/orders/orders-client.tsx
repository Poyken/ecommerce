"use client";

import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { UpdateOrderStatusDialog } from "@/components/update-order-status-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function OrdersClient({
  orders,
  total,
  page,
  limit,
}: {
  orders: any[];
  total: number;
  page: number;
  limit: number;
}) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Tìm kiếm với Debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = params.get("search") || "";
      // Chỉ điều hướng nếu từ khóa tìm kiếm thực sự thay đổi

      if (currentSearch !== searchTerm) {
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Đặt lại về trang 1
        router.push(`/admin/orders?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, router, searchParams]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/orders?${params.toString()}`);
  };

  const openStatusUpdate = (order: any) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const openDetails = (order: any) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {/* {order.id.substring(0, 8)}... */}
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.user?.email || "Unknown User"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(order.totalAmount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        order.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openDetails(order)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => openStatusUpdate(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between w-full">
          <div className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-medium">{Math.min(page * limit, total)}</span>{" "}
            of <span className="font-medium">{total}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!hasPrevPage}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                !hasPrevPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasNextPage}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                !hasNextPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <>
          <UpdateOrderStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            orderId={selectedOrder.id}
            currentStatus={
              orders.find((o) => o.id === selectedOrder.id)?.status ||
              selectedOrder.status
            }
          />
          <OrderDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            orderId={selectedOrder.id}
          />
        </>
      )}
    </div>
  );
}
