'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { promotionsApi } from '@/features/promotions/promotions.api';

// Types
import {
  Promotion,
  PromotionRule,
  PromotionAction,
  CreatePromotionDto,
  PromotionRuleType,
  PromotionOperator,
  PromotionActionType,
} from '@/features/promotions/types';

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion?: Promotion; // Existing promotion for edit mode
}

// Rule types với label tiếng Việt
const RULE_TYPES = [
  { value: PromotionRuleType.MIN_ORDER_VALUE, label: 'Đơn hàng tối thiểu' },
  { value: PromotionRuleType.MIN_QUANTITY, label: 'Số lượng tối thiểu' },
  { value: PromotionRuleType.SPECIFIC_CATEGORY, label: 'Danh mục cụ thể' },
  { value: PromotionRuleType.SPECIFIC_PRODUCT, label: 'Sản phẩm cụ thể' },
  { value: PromotionRuleType.CUSTOMER_GROUP, label: 'Nhóm khách hàng' },
  { value: PromotionRuleType.FIRST_ORDER, label: 'Đơn hàng đầu tiên' },
];

const OPERATORS = [
  { value: PromotionOperator.GREATER_THAN_OR_EQUAL, label: '>=' },
  { value: PromotionOperator.LESS_THAN_OR_EQUAL, label: '<=' },
  { value: PromotionOperator.EQUAL, label: '=' },
  { value: PromotionOperator.GREATER_THAN, label: '>' },
  { value: PromotionOperator.LESS_THAN, label: '<' },
  { value: PromotionOperator.IN, label: 'Thuộc' },
];

const ACTION_TYPES = [
  { value: PromotionActionType.DISCOUNT_FIXED, label: 'Giảm cố định' },
  { value: PromotionActionType.DISCOUNT_PERCENT, label: 'Giảm %' },
  { value: PromotionActionType.FREE_SHIPPING, label: 'Miễn phí vận chuyển' },
  { value: PromotionActionType.GIFT, label: 'Tặng quà' },
];

const initialFormData: CreatePromotionDto = {
  name: '',
  code: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true,
  priority: 0,
  usageLimit: null,
  rules: [{ type: PromotionRuleType.MIN_ORDER_VALUE, operator: PromotionOperator.GREATER_THAN_OR_EQUAL, value: '100000' }],
  actions: [{ type: PromotionActionType.DISCOUNT_PERCENT, value: '10', maxDiscountAmount: 50000 }],
};

export function PromotionFormModal({
  isOpen,
  onClose,
  onSuccess,
  promotion,
}: PromotionFormModalProps) {
  const [formData, setFormData] = useState<CreatePromotionDto>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!promotion;

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        code: promotion.code || '',
        description: promotion.description || '',
        startDate: new Date(promotion.startDate).toISOString().split('T')[0],
        endDate: new Date(promotion.endDate).toISOString().split('T')[0],
        isActive: promotion.isActive,
        priority: promotion.priority || 0,
        usageLimit: promotion.usageLimit,
        rules: promotion.rules || [],
        actions: promotion.actions || [],
      });
    } else {
      setFormData(initialFormData);
    }
  }, [promotion]);

  const handleInputChange = (field: keyof CreatePromotionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  // Rule management
  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, { type: PromotionRuleType.MIN_ORDER_VALUE, operator: PromotionOperator.GREATER_THAN_OR_EQUAL, value: '' }],
    }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateRule = (index: number, field: keyof PromotionRule, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  // Action management
  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: PromotionActionType.DISCOUNT_FIXED, value: '' }],
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (
    index: number,
    field: keyof PromotionAction,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode) {
        await promotionsApi.update(promotion.id, {
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
      } else {
        await promotionsApi.create({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
      }



      toast.success(
        isEditMode
          ? 'Cập nhật khuyến mãi thành công!'
          : 'Tạo khuyến mãi thành công!'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {isEditMode ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
          </DialogTitle>
          <DialogDescription>
            Thiết lập điều kiện và hành động cho chương trình khuyến mãi
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên chương trình *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="VD: Giảm 10% đơn đầu tiên"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Mã khuyến mãi</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    handleInputChange('code', e.target.value.toUpperCase())
                  }
                  placeholder="VD: WELCOME10"
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Tạo mã
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mô tả chi tiết chương trình khuyến mãi..."
              rows={2}
            />
          </div>

          {/* Date & Settings */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Giới hạn sử dụng</Label>
              <Input
                id="usageLimit"
                type="number"
                min={0}
                value={formData.usageLimit || ''}
                onChange={(e) =>
                  handleInputChange(
                    'usageLimit',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Không giới hạn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange('priority', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Kích hoạt</Label>
          </div>

          {/* Rules Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Điều kiện áp dụng</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRule}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm điều kiện
              </Button>
            </div>

            {formData.rules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <Select
                  value={rule.type}
                  onValueChange={(v) => updateRule(index, 'type', v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={rule.operator}
                  onValueChange={(v) => updateRule(index, 'operator', v)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={rule.value}
                  onChange={(e) => updateRule(index, 'value', e.target.value)}
                  placeholder="Giá trị"
                  className="flex-1"
                />

                {formData.rules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Actions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Hành động</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm hành động
              </Button>
            </div>

            {formData.actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <Select
                  value={action.type}
                  onValueChange={(v) => updateAction(index, 'type', v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((at) => (
                      <SelectItem key={at.value} value={at.value}>
                        {at.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={action.value}
                  onChange={(e) => updateAction(index, 'value', e.target.value)}
                  placeholder={
                    action.type === 'DISCOUNT_PERCENT'
                      ? 'Phần trăm giảm'
                      : action.type === 'DISCOUNT_FIXED'
                      ? 'Số tiền giảm'
                      : 'Giá trị'
                  }
                  className="w-[120px]"
                />

                {action.type === 'DISCOUNT_PERCENT' && (
                  <Input
                    type="number"
                    value={action.maxDiscountAmount || ''}
                    onChange={(e) =>
                      updateAction(
                        index,
                        'maxDiscountAmount',
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="Giảm tối đa"
                    className="w-[120px]"
                  />
                )}

                <div className="flex-1">
                  <Badge variant="outline" className="text-xs">
                    {action.type === 'DISCOUNT_PERCENT'
                      ? `Giảm ${action.value}%${
                          action.maxDiscountAmount
                            ? ` (tối đa ${action.maxDiscountAmount.toLocaleString()}đ)`
                            : ''
                        }`
                      : action.type === 'DISCOUNT_FIXED'
                      ? `Giảm ${Number(action.value).toLocaleString()}đ`
                      : action.type === 'FREE_SHIPPING'
                      ? 'Miễn phí ship'
                      : 'Tặng quà'}
                  </Badge>
                </div>

                {formData.actions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Đang xử lý...'
                : isEditMode
                ? 'Cập nhật'
                : 'Tạo khuyến mãi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
