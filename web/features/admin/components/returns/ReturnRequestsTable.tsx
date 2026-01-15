'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Package,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTypedRouter, AppRoute, appRoutes } from "@/lib/typed-navigation";

import { ReturnRequest, ReturnRequestPopulated, ReturnStatus } from '@/features/return-requests/types';
import { returnRequestsApi } from '@/features/return-requests/return-requests.api';

interface Stats {
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  totalRefunded: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = { // string key to handle potential enum mismatch during runtime or just loose typing
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-500', icon: Clock },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-500', icon: Check },
  WAITING_FOR_RETURN: { label: 'Chờ trả hàng', color: 'bg-orange-500', icon: Package },
  IN_TRANSIT: { label: 'Đang vận chuyển', color: 'bg-purple-500', icon: Truck },
  RECEIVED: { label: 'Đã nhận', color: 'bg-indigo-500', icon: PackageCheck },
  INSPECTING: { label: 'Đang kiểm hàng', color: 'bg-cyan-500', icon: RefreshCw },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-green-500', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-red-500', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-500', icon: X },
};

export function ReturnRequestsTable() {
  const router = useTypedRouter();
  const [requests, setRequests] = useState<ReturnRequestPopulated[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null; reason: string }>({
    open: false,
    id: null,
    reason: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        returnRequestsApi.findAll({
          page,
          limit: 15,
          search: search || undefined,
          status: statusFilter || undefined,
        }),
        returnRequestsApi.getStats(),
      ]);

      setRequests(requestsData.data);
      setTotalPages(requestsData.meta.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    if (!approveDialog.id) return;

    try {
      await returnRequestsApi.approve(approveDialog.id);
      toast.success('Đã duyệt yêu cầu đổi trả');
      setApproveDialog({ open: false, id: null });
      fetchData();
    } catch (error) {
      toast.error('Không thể duyệt yêu cầu');
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id || !rejectDialog.reason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await returnRequestsApi.reject(rejectDialog.id, rejectDialog.reason);
      toast.success('Đã từ chối yêu cầu');
      setRejectDialog({ open: false, id: null, reason: '' });
      fetchData();
    } catch (error) {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  const handleConfirmReceived = async (id: string) => {
    try {
      await returnRequestsApi.confirmReceived(id);
      toast.success('Đã xác nhận nhận hàng');
      fetchData();
    } catch (error) {
      toast.error('Không thể cập nhật');
    }
  };

  const handleRefund = async (id: string) => {
    try {
      await returnRequestsApi.processRefund(id);
      toast.success('Đã hoàn tiền thành công');
      fetchData();
    } catch (error) {
      toast.error('Không thể hoàn tiền');
    }
  };

  const getStatusBadge = (status: ReturnStatus | string) => {
    const config = STATUS_CONFIG[status];
    if (!config) return <Badge>{status}</Badge>;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đang xử lý</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoàn thành</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Từ chối</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đã hoàn tiền</p>
                  <p className="text-xl font-bold">
                    {stats.totalRefunded.toLocaleString()}đ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu đổi trả</CardTitle>
          <CardDescription>
            Quản lý các yêu cầu đổi trả hàng từ khách hàng
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo email, mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as ReturnStatus | '')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => fetchData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Không có yêu cầu đổi trả nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {/* Note: request.user might differ in type from local def vs shared type. 
                            Shared type doesn't have nested user details by default unless queried.
                            Assuming API returns what's needed or type needs update.
                             We saw returnRequests.api findAll returns User details in 'include'.
                             Let's assume the API response matches the component needs.
                        */}
                        <div>
                          <p className="font-medium">
                            {request.user?.firstName} {request.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.items[0]?.orderItem?.imageUrl && (
                            <img
                              src={request.items[0].orderItem.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm truncate max-w-[150px]">
                              {request.items[0]?.orderItem?.productName || 'N/A'}
                            </p>
                            {request.items.length > 1 && (
                              <p className="text-xs text-muted-foreground">
                                +{request.items.length - 1} sản phẩm
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[150px]">
                          {request.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        {request.refundAmount ? (
                          <span className="font-medium text-green-600">
                            {Number(request.refundAmount).toLocaleString()}đ
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(request.createdAt), 'dd/MM/yyyy', {
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push((`/admin/returns/${request.id}`) as AppRoute)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>

                            {request.status === ReturnStatus.PENDING && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setApproveDialog({ open: true, id: request.id })
                                  }
                                >
                                  <Check className="h-4 w-4 mr-2 text-green-600" />
                                  Duyệt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      id: request.id,
                                      reason: '',
                                    })
                                  }
                                >
                                  <X className="h-4 w-4 mr-2 text-red-600" />
                                  Từ chối
                                </DropdownMenuItem>
                              </>
                            )}

                            {request.status === ReturnStatus.IN_TRANSIT && (
                              <DropdownMenuItem
                                onClick={() => handleConfirmReceived(request.id)}
                              >
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Xác nhận nhận hàng
                              </DropdownMenuItem>
                            )}

                            {request.status === ReturnStatus.INSPECTING && (
                              <DropdownMenuItem
                                onClick={() => handleRefund(request.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Hoàn tiền
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog({ open, id: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt yêu cầu đổi trả</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn duyệt yêu cầu này? Khách hàng sẽ được thông
              báo và có thể gửi hàng trả về.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Duyệt yêu cầu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog({ open, id: null, reason: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối yêu cầu đổi trả</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho khách hàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Lý do từ chối</Label>
            <Textarea
              id="rejectReason"
              value={rejectDialog.reason}
              onChange={(e) =>
                setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="VD: Sản phẩm đã quá thời hạn đổi trả..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
