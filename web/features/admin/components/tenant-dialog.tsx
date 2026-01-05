import { useToast } from "@/components/shared/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTenantAction, updateTenantAction } from "@/features/admin/actions";
import { CreateTenantDto } from "@/types/dtos";
import { Tenant } from "@/types/models";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  mode?: "create" | "edit" | "view";
}

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  mode = "create",
}: TenantDialogProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateTenantDto>({
    defaultValues: {
      plan: 'BASIC',
      themeConfig: {
          primaryColor: '#000000'
      }
    }
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan as any,
        themeConfig: {
          primaryColor: tenant.themeConfig?.primaryColor || '#000000'
        }
      });
    } else {
      reset({
        plan: 'BASIC',
        themeConfig: {
          primaryColor: '#000000'
        }
      });
    }
  }, [tenant, reset, open]);

  const onSubmit = async (data: CreateTenantDto) => {
    if (isView) return;
    setIsPending(true);
    
    const result = isEdit && tenant
        ? await updateTenantAction(tenant.id, data)
        : await createTenantAction(data);
        
    setIsPending(false);

    if (result.success) {
      toast({
        title: "Thành công",
        description: isEdit ? "Cập nhật tenant thành công" : "Khởi tạo tenant và Admin thành công",
        variant: "success",
      });
      onOpenChange(false);
      reset();
    } else {
      toast({
         title: "Lỗi",
         description: result.error || "Thao tác thất bại",
         variant: "destructive",
      });
    }
  };

  const title = isView ? "Chi tiết Tenant" : isEdit ? "Chỉnh sửa Tenant" : "Khởi tạo Tenant mới";
  const description = isView 
    ? "Xem thông tin cấu hình chi tiết của cửa hàng."
    : isEdit 
      ? "Cập nhật thông tin cấu hình cho cửa hàng hiện tại." 
      : "Triển khai một cửa hàng chuyên biệt (niche store) mới trên hệ thống.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-700 font-semibold">Tên cửa hàng</Label>
            <Input
              id="name"
              placeholder="VD: Nội thất cao cấp"
              className="bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900"
              disabled={isView}
              {...register("name", { required: "Tên là bắt buộc" })}
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="domain" className="text-slate-700 font-semibold">Tên miền (Domain)</Label>
            <div className="relative">
                <Input
                  id="domain"
                  placeholder="VD: noithat.local"
                  className="bg-slate-50 border-slate-200 focus:ring-indigo-500 pr-12 text-slate-900"
                  disabled={isView}
                  {...register("domain", { required: "Tên miền là bắt buộc" })}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    .local
                </div>
            </div>
            {errors.domain && <p className="text-xs text-red-500 font-medium">{errors.domain.message}</p>}
            {!isView && (
              <p className="text-[10px] text-slate-400 italic">
                  * Lưu ý: Trong môi trường dev, hãy thêm domain này vào file hosts của bạn.
              </p>
            )}
          </div>

          {!isEdit && !isView && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
               <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Tài khoản Admin khởi tạo</h3>
               
               <div className="grid gap-2">
                 <Label htmlFor="adminEmail" className="text-slate-700 text-xs font-semibold">Email quản trị</Label>
                 <Input
                   id="adminEmail"
                   type="email"
                   placeholder="admin@example.com"
                   className="bg-white border-slate-200 focus:ring-indigo-500 text-slate-900 h-9 text-sm"
                   {...register("adminEmail", { 
                     required: "Email admin là bắt buộc" 
                   })}
                 />
                 {errors.adminEmail && <p className="text-[10px] text-red-500 font-medium">{errors.adminEmail.message}</p>}
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="adminPassword" className="text-slate-700 text-xs font-semibold">Mật khẩu</Label>
                 <Input
                   id="adminPassword"
                   type="password"
                   placeholder="••••••••"
                   className="bg-white border-slate-200 focus:ring-indigo-500 text-slate-900 h-9 text-sm"
                   {...register("adminPassword", { 
                     required: "Mật khẩu admin là bắt buộc",
                     minLength: { value: 6, message: "Tối thiểu 6 ký tự" }
                   })}
                 />
                 {errors.adminPassword && <p className="text-[10px] text-red-500 font-medium">{errors.adminPassword.message}</p>}
               </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="plan" className="text-slate-700 font-semibold">Gói dịch vụ</Label>
            <Select 
                onValueChange={(val) => setValue('plan', val as any)} 
                value={watch('plan')}
                disabled={isView}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder="Chọn gói" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="BASIC">Cơ bản (Basic)</SelectItem>
                <SelectItem value="PRO">Chuyên nghiệp (Pro)</SelectItem>
                <SelectItem value="ENTERPRISE">Doanh nghiệp (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
             <Label className="text-slate-700 font-semibold">Màu sắc chủ đạo (Brand Color)</Label>
             <div className="flex gap-3 items-center">
                 <div 
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 shadow-sm overflow-hidden"
                    style={{ backgroundColor: watch('themeConfig.primaryColor') }}
                 >
                     <Input 
                        type="color"
                        {...register('themeConfig.primaryColor')}
                        className="opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                        disabled={isView}
                     />
                 </div>
                 <Input 
                    {...register('themeConfig.primaryColor')} 
                    placeholder="#000000"
                    className="flex-1 bg-slate-50 border-slate-200 font-mono text-slate-900"
                    disabled={isView}
                 />
             </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-white pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-slate-600 hover:text-slate-900 border-slate-200"
              disabled={isPending}
            >
              {isView ? "Đóng" : "Hủy"}
            </Button>
            {!isView && (
              <Button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Cập nhật" : "Khởi tạo ngay"}
              </Button>
            )}
            {isView && (
              <Button 
                  type="button"
                  onClick={() => {
                    const protocol = window.location.protocol;
                    const host = window.location.host;
                    let targetDomain = tenant?.domain || "";
                    if (host.includes('localhost') && !targetDomain.includes(':')) {
                        const port = host.split(':')[1] || '3000';
                        targetDomain = `${targetDomain}:${port}`;
                    }
                    window.open(`${protocol}//${targetDomain}/admin`, '_blank');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md"
              >
                Vào trang quản trị
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
