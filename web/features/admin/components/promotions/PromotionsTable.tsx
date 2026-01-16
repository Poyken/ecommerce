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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  BarChart3,
  Copy,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PromotionFormModal } from './PromotionFormModal';
import { PromotionStatsModal } from './PromotionStatsModal';

import { Promotion, PromotionActionType } from '@/features/promotions/types';
import { promotionsApi } from '@/features/promotions/promotions.api';

export function PromotionsTable() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await promotionsApi.findAll({
        page,
        limit: 10,
        search,
      });
      setPromotions(result.data);
      if (result.meta) {
        setTotalPages(result.meta.lastPage || 1);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách khuyến mãi');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await promotionsApi.toggleActive(promotion.id);
      toast.success(
        promotion.isActive
          ? 'Đã tắt khuyến mãi'
          : 'Đã kích hoạt khuyến mãi'
      );
      fetchPromotions();
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    try {
      await promotionsApi.delete(selectedPromotion.id);

      toast.success('Đã xóa khuyến mãi');
      setIsDeleteDialogOpen(false);
      setSelectedPromotion(null);
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa khuyến mãi');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã khuyến mãi');
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return <Badge variant="secondary">Tạm dừng</Badge>;
    }
    if (now < start) {
      return <Badge variant="outline">Chưa bắt đầu</Badge>;
    }
    if (now > end) {
      return <Badge variant="destructive">Đã kết thúc</Badge>;
    }
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return <Badge variant="destructive">Hết lượt</Badge>;
    }
    return <Badge className="bg-green-500">Đang chạy</Badge>;
  };

  const getActionSummary = (actions: Promotion['actions']) => {
    return actions.map((action) => {
      if (action.type === PromotionActionType.DISCOUNT_PERCENT) {
        return `Giảm ${action.value}%`;
      }
      if (action.type === PromotionActionType.DISCOUNT_FIXED) {
        return `Giảm ${Number(action.value).toLocaleString()}đ`;
      }
      if (action.type === PromotionActionType.FREE_SHIPPING) {
        return 'Free ship';
      }
      if (action.type === PromotionActionType.GIFT) {
        return 'Tặng quà';
      }
      return action.type;
    }).join(', ');
  };

  // Stats cards data
  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.isActive).length,
    totalUsages: promotions.reduce((sum, p) => sum + p.usedCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng khuyến mãi</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Power className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Ticket className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng lượt dùng</p>
                <p className="text-2xl font-bold">{stats.totalUsages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hiệu quả</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0
                    ? Math.round((stats.totalUsages / stats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quản lý khuyến mãi</CardTitle>
            <CardDescription>
              Tạo và quản lý các chương trình giảm giá, mã coupon
            </CardDescription>
          </div>
          <Button onClick={() => {
            setSelectedPromotion(null);
            setIsFormModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo khuyến mãi
          </Button>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chương trình</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Chưa có chương trình khuyến mãi nào</p>
                        <Button
                          variant="link"
                          onClick={() => setIsFormModalOpen(true)}
                        >
                          Tạo khuyến mãi đầu tiên
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promotion.name}</p>
                          {promotion.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {promotion.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {promotion.code ? (
                          <div className="flex items-center gap-1">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                              {promotion.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(promotion.code!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getActionSummary(promotion.actions)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {format(new Date(promotion.startDate), 'dd/MM/yyyy', {
                              locale: vi,
                            })}
                          </p>
                          <p className="text-muted-foreground">
                            đến{' '}
                            {format(new Date(promotion.endDate), 'dd/MM/yyyy', {
                              locale: vi,
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{promotion.usedCount}</span>
                          {promotion.usageLimit && (
                            <span className="text-muted-foreground">
                              /{promotion.usageLimit}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPromotion(promotion);
                                setIsFormModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPromotion(promotion);
                                setIsStatsModalOpen(true);
                              }}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Thống kê
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(promotion)}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              {promotion.isActive ? 'Tắt' : 'Bật'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPromotion(promotion);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
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

      {/* Modals */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedPromotion(null);
        }}
        onSuccess={fetchPromotions}
        promotion={selectedPromotion || undefined}
      />

      {selectedPromotion && (
        <PromotionStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false);
            setSelectedPromotion(null);
          }}
          promotionId={selectedPromotion.id}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chương trình khuyến mãi "
              {selectedPromotion?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
