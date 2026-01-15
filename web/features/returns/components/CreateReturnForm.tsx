'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  productName?: string;
  skuNameSnapshot?: string;
  imageUrl?: string;
}

interface CreateReturnFormProps {
  orderId: string;
  orderItems: OrderItem[];
  onSuccess?: () => void;
}

const RETURN_REASONS = [
  { value: 'WRONG_ITEM', label: 'Gửi sai sản phẩm' },
  { value: 'DAMAGED', label: 'Sản phẩm bị hỏng/vỡ' },
  { value: 'DEFECTIVE', label: 'Sản phẩm lỗi/không hoạt động' },
  { value: 'NOT_AS_DESCRIBED', label: 'Không giống mô tả' },
  { value: 'CHANGED_MIND', label: 'Đổi ý/Không muốn mua nữa' },
  { value: 'SIZE_ISSUE', label: 'Sai kích cỡ' },
  { value: 'OTHER', label: 'Lý do khác' },
];

const RETURN_TYPES = [
  { value: 'RETURN_AND_REFUND', label: 'Trả hàng và hoàn tiền' },
  { value: 'REFUND_ONLY', label: 'Chỉ hoàn tiền (không cần trả hàng)' },
  { value: 'EXCHANGE', label: 'Đổi sản phẩm khác' },
];

const RETURN_METHODS = [
  { value: 'SELF_SHIP', label: 'Tự gửi qua bưu điện' },
  { value: 'PICKUP', label: 'Shipper đến lấy' },
  { value: 'AT_COUNTER', label: 'Mang đến cửa hàng' },
];

const REFUND_METHODS = [
  { value: 'ORIGINAL_PAYMENT', label: 'Hoàn về phương thức thanh toán gốc' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
  { value: 'WALLET', label: 'Hoàn vào ví tích điểm' },
];

export function CreateReturnForm({
  orderId,
  orderItems,
  onSuccess,
}: CreateReturnFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedItems, setSelectedItems] = useState<
    Array<{ orderItemId: string; quantity: number }>
  >([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [returnType, setReturnType] = useState('RETURN_AND_REFUND');
  const [returnMethod, setReturnMethod] = useState('SELF_SHIP');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [images, setImages] = useState<string[]>([]);
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountOwner: '',
  });

  // Calculate refund amount
  const refundAmount = selectedItems.reduce((sum, item) => {
    const orderItem = orderItems.find((oi) => oi.id === item.orderItemId);
    if (!orderItem) return sum;
    return sum + Number(orderItem.priceAtPurchase) * item.quantity;
  }, 0);

  const toggleItem = (itemId: string, checked: boolean) => {
    if (checked) {
      const orderItem = orderItems.find((oi) => oi.id === itemId);
      if (orderItem) {
        setSelectedItems((prev) => [
          ...prev,
          { orderItemId: itemId, quantity: orderItem.quantity },
        ]);
      }
    } else {
      setSelectedItems((prev) =>
        prev.filter((i) => i.orderItemId !== itemId)
      );
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.orderItemId === itemId ? { ...i, quantity } : i
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (!reason) {
      toast.error('Vui lòng chọn lý do đổi trả');
      return;
    }

    if (refundMethod === 'BANK_TRANSFER') {
      if (!bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountOwner) {
        toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/return-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          items: selectedItems,
          reason,
          description,
          type: returnType,
          returnMethod,
          refundMethod,
          refundAmount,
          images,
          ...(refundMethod === 'BANK_TRANSFER' && { bankAccount }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Có lỗi xảy ra');
      }

      toast.success('Yêu cầu đổi trả đã được gửi!');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/profile/returns');
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple image upload (placeholder - in real app use cloud storage)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In real app, upload to cloud storage and get URLs
    // For now, just create local URLs
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...urls].slice(0, 5)); // Max 5 images
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Chọn sản phẩm cần đổi/trả</CardTitle>
          <CardDescription>
            Chọn các sản phẩm bạn muốn đổi trả và số lượng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderItems.map((item) => {
            const isSelected = selectedItems.some(
              (si) => si.orderItemId === item.id
            );
            const selectedItem = selectedItems.find(
              (si) => si.orderItemId === item.id
            );

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    toggleItem(item.id, checked as boolean)
                  }
                />

                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded object-cover"
                  />
                )}

                <div className="flex-1">
                  <p className="font-medium">{item.productName || 'Sản phẩm'}</p>
                  {item.skuNameSnapshot && (
                    <p className="text-sm text-muted-foreground">
                      {item.skuNameSnapshot}
                    </p>
                  )}
                  <p className="text-sm">
                    {Number(item.priceAtPurchase).toLocaleString()}đ x{' '}
                    {item.quantity}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Số lượng:</Label>
                    <Select
                      value={selectedItem?.quantity.toString()}
                      onValueChange={(v) => updateQuantity(item.id, parseInt(v))}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: item.quantity }, (_, i) => i + 1).map(
                          (num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Step 2: Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Lý do đổi/trả</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {RETURN_REASONS.map((r) => (
              <div
                key={r.value}
                className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50"
              >
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer flex-1">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label>Mô tả chi tiết (tùy chọn)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Ảnh bằng chứng (tùy chọn, tối đa 5 ảnh)</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="w-20 h-20 rounded object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Return Type & Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Phương thức đổi/trả</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Loại yêu cầu</Label>
            <RadioGroup value={returnType} onValueChange={setReturnType}>
              {RETURN_TYPES.map((t) => (
                <div
                  key={t.value}
                  className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50"
                >
                  <RadioGroupItem value={t.value} id={`type-${t.value}`} />
                  <Label htmlFor={`type-${t.value}`} className="cursor-pointer">
                    {t.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {returnType !== 'REFUND_ONLY' && (
            <div className="space-y-2">
              <Label>Cách gửi hàng trả</Label>
              <RadioGroup value={returnMethod} onValueChange={setReturnMethod}>
                {RETURN_METHODS.map((m) => (
                  <div
                    key={m.value}
                    className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <RadioGroupItem value={m.value} id={`method-${m.value}`} />
                    <Label htmlFor={`method-${m.value}`} className="cursor-pointer">
                      {m.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label>Phương thức hoàn tiền</Label>
            <RadioGroup value={refundMethod} onValueChange={setRefundMethod}>
              {REFUND_METHODS.map((m) => (
                <div
                  key={m.value}
                  className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50"
                >
                  <RadioGroupItem value={m.value} id={`refund-${m.value}`} />
                  <Label htmlFor={`refund-${m.value}`} className="cursor-pointer">
                    {m.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Bank Account */}
          {refundMethod === 'BANK_TRANSFER' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Thông tin ngân hàng</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên ngân hàng</Label>
                  <Input
                    value={bankAccount.bankName}
                    onChange={(e) =>
                      setBankAccount((prev) => ({
                        ...prev,
                        bankName: e.target.value,
                      }))
                    }
                    placeholder="VD: Vietcombank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số tài khoản</Label>
                  <Input
                    value={bankAccount.accountNumber}
                    onChange={(e) =>
                      setBankAccount((prev) => ({
                        ...prev,
                        accountNumber: e.target.value,
                      }))
                    }
                    placeholder="VD: 123456789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Chủ tài khoản</Label>
                <Input
                  value={bankAccount.accountOwner}
                  onChange={(e) =>
                    setBankAccount((prev) => ({
                      ...prev,
                      accountOwner: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Số tiền hoàn trả dự kiến</p>
              <p className="text-2xl font-bold text-green-600">
                {refundAmount.toLocaleString()}đ
              </p>
            </div>
            <Badge variant="outline">
              {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm
            </Badge>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedItems.length === 0}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Gửi yêu cầu đổi trả
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
