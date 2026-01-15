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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Building2,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  priceList?: {
    id: string;
    name: string;
  };
  _count: {
    users: number;
  };
}

interface PriceList {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  _count: {
    items: number;
  };
  customerGroups: Array<{ id: string; name: string }>;
}

interface Stats {
  totalGroups: number;
  totalPriceLists: number;
  totalB2BCustomers: number;
}

export function B2BPricingManager() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [groupModal, setGroupModal] = useState({ open: false, group: null as CustomerGroup | null });
  const [priceListModal, setPriceListModal] = useState({ open: false, priceList: null as PriceList | null });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupsRes, priceListsRes, statsRes] = await Promise.all([
        fetch('/api/b2b/groups'),
        fetch('/api/b2b/price-lists'),
        fetch('/api/b2b/stats'),
      ]);

      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (priceListsRes.ok) setPriceLists(await priceListsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;

    try {
      const response = await fetch(`/api/b2b/groups/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      toast.success('Đã xóa nhóm khách hàng');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa');
    }
  };

  const handleDeletePriceList = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bảng giá này?')) return;

    try {
      const response = await fetch(`/api/b2b/price-lists/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      toast.success('Đã xóa bảng giá');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nhóm KH</p>
                  <p className="text-2xl font-bold">{stats.totalGroups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Tag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bảng giá</p>
                  <p className="text-2xl font-bold">{stats.totalPriceLists}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KH B2B</p>
                  <p className="text-2xl font-bold">{stats.totalB2BCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Customer Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nhóm khách hàng</CardTitle>
              <CardDescription>
                Phân loại khách hàng B2B
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setGroupModal({ open: true, group: null })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm nhóm
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Bảng giá</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa có nhóm khách hàng
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.priceList ? (
                          <Badge variant="outline">{group.priceList.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Giá gốc</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {group._count.users} người
                        </Badge>
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
                              onClick={() => setGroupModal({ open: true, group })}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteGroup(group.id)}
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
          </CardContent>
        </Card>

        {/* Price Lists */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bảng giá</CardTitle>
              <CardDescription>
                Thiết lập giá riêng cho từng nhóm
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setPriceListModal({ open: true, priceList: null })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm bảng giá
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên bảng giá</TableHead>
                  <TableHead>Số SKU</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceLists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa có bảng giá
                    </TableCell>
                  </TableRow>
                ) : (
                  priceLists.map((priceList) => (
                    <TableRow key={priceList.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{priceList.name}</span>
                          {priceList.isDefault && (
                            <Badge className="bg-blue-500 text-xs">Mặc định</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {priceList._count.items} SKU
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {priceList.isActive ? (
                          <Badge className="bg-green-500">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Tạm dừng</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Quản lý giá SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeletePriceList(priceList.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Group Modal */}
      <CustomerGroupFormModal
        open={groupModal.open}
        group={groupModal.group}
        priceLists={priceLists}
        onClose={() => setGroupModal({ open: false, group: null })}
        onSuccess={fetchData}
      />
    </div>
  );
}

// Customer Group Form Modal
function CustomerGroupFormModal({
  open,
  group,
  priceLists,
  onClose,
  onSuccess,
}: {
  open: boolean;
  group: CustomerGroup | null;
  priceLists: PriceList[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceListId, setPriceListId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setPriceListId(group.priceList?.id || '');
    } else {
      setName('');
      setDescription('');
      setPriceListId('');
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = group ? `/api/b2b/groups/${group.id}` : '/api/b2b/groups';
      const method = group ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          priceListId: priceListId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(group ? 'Đã cập nhật nhóm' : 'Đã tạo nhóm mới');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {group ? 'Chỉnh sửa nhóm khách hàng' : 'Tạo nhóm khách hàng mới'}
          </DialogTitle>
          <DialogDescription>
            Thiết lập nhóm để áp dụng bảng giá riêng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhóm *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Đại lý cấp 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nhóm khách hàng..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceList">Bảng giá áp dụng</Label>
            <select
              id="priceList"
              value={priceListId}
              onChange={(e) => setPriceListId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">Sử dụng giá gốc</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : group ? 'Cập nhật' : 'Tạo nhóm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
