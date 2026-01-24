"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RotateCcw, 
  ChevronRight, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  Image as ImageIcon,
  Truck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Hash,
  ExternalLink,
  Edit,
  ClipboardList
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProductImage } from "@/lib/product-helper";
import { ReturnRequest } from "@/features/return-requests/types";
import Image from "next/image";
import Link from "next/link";
import { UpdateReturnStatusDialog } from "@/features/admin/components/returns/update-return-status-dialog";

export function ReturnDetailClient({ returnRequest }: { returnRequest: any }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl border-2 hover:bg-slate-50 transition-all shrink-0"
            onClick={() => router.push("/admin/returns")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">
              <RotateCcw className="h-4 w-4" />
              RMA Management
            </div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Request #{returnRequest.id.split("-")[0].toUpperCase()}
              <StatusBadge status={returnRequest.status} />
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
            onClick={() => setStatusDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            {t("returns.updateStatus")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items Table Card */}
          <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("orders.items")}
              </h2>
              <Badge variant="outline" className="font-bold">{returnRequest.items?.length} items</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t("orders.imageLabel")}</TableHead>
                  <TableHead>{t("orders.productLabel")}</TableHead>
                  <TableHead className="text-center">{t("orders.qtyLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnRequest.items?.map((item: any) => (
                  <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-100 group-hover:border-primary/50 transition-all">
                        <Image
                          src={(item as any).sku?.imageUrl || getProductImage((item as any).sku?.product)}
                          alt={(item as any).sku?.product?.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{(item as any).sku?.product?.name}</span>
                        <span className="text-xs text-slate-500 font-medium">SKU: {(item as any).sku?.skuCode}</span>
                        {(item as any).sku?.options?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {(item as any).sku.options.map((opt: any) => (
                              <Badge key={opt.id} variant="secondary" className="px-1.5 py-0 text-[9px] font-black uppercase">
                                {opt.optionValue.value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-lg">{item.quantity}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Reason & Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6 rounded-3xl border-2 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                {t("returns.reason")}
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 text-sm font-medium leading-relaxed border-2 border-slate-100 italic">
                "{returnRequest.reason}"
              </div>
              {returnRequest.description && (
                <div className="text-sm text-slate-600 font-medium">
                  {returnRequest.description}
                </div>
              )}
            </Card>

            <Card className="p-6 rounded-3xl border-2 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-500" />
                Evidence Images
              </h3>
              {returnRequest.images && returnRequest.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {returnRequest.images.map((img: any, i: number) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 hover:border-emerald-500 transition-all cursor-zoom-in">
                      <Image src={img} alt={`Evidence ${i}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="text-xs font-bold text-slate-400">No images provided</span>
                </div>
              )}
            </Card>
          </div>

          {/* Inspection History (If any) */}
          {(returnRequest.inspectionNotes || returnRequest.rejectedReason) && (
            <Card className="p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 space-y-4 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 size={120} />
              </div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 relative z-10">
                <ClipboardList className="h-5 w-5 text-primary" />
                Inspection & Decision
              </h3>
              <div className="space-y-4 relative z-10">
                {returnRequest.inspectionNotes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t("returns.inspectionNotes")}</span>
                    <p className="text-sm font-medium bg-white/50 p-4 rounded-xl border-2 border-primary/10">{returnRequest.inspectionNotes}</p>
                  </div>
                )}
                {returnRequest.rejectedReason && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">{t("returns.rejectedReason")}</span>
                    <p className="text-sm font-medium bg-rose-50 p-4 rounded-xl border-2 border-rose-100 text-rose-700">{returnRequest.rejectedReason}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: User & Shipping */}
        <div className="space-y-8">
          {/* Customer Card */}
          <Card className="p-6 rounded-3xl border-2 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 border-b pb-4">
              <User className="h-5 w-5 text-blue-500" />
              Customer Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-600 text-lg">
                  {(returnRequest as any).user?.firstName?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{(returnRequest as any).user?.firstName} {(returnRequest as any).user?.lastName}</div>
                  <div className="text-xs text-slate-500 font-medium">{(returnRequest as any).user?.email}</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/50 border-2 border-blue-100 flex gap-3">
                <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="text-xs font-medium text-blue-700 leading-relaxed">
                  {(returnRequest as any).user?.address || "No address provided"}
                </div>
              </div>
            </div>
          </Card>

          {/* Logistics & Method */}
          <Card className="p-6 rounded-3xl border-2 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-3 border-b pb-4">
              <Truck className="h-5 w-5 text-indigo-500" />
              Logistics Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("returns.typeLabel")}</span>
                  <div className="text-sm font-black">{returnRequest.type}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("returns.methodLabel")}</span>
                  <div className="text-sm font-black text-indigo-600">{returnRequest.returnMethod}</div>
                </div>
              </div>
              
              <div className="h-px bg-slate-100" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Status</span>
                  {returnRequest.trackingCode && <Badge className="bg-indigo-600">Active</Badge>}
                </div>
                {returnRequest.trackingCode ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border-2 border-indigo-100 space-y-2">
                    <div className="text-xs font-black text-indigo-700 font-mono tracking-wider flex items-center justify-between">
                      {returnRequest.trackingCode}
                      <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink size={12} /></Button>
                    </div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase">{returnRequest.carrier || "Carrier not specified"}</div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
                    Waiting for tracking code
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Refund Prefs */}
          <Card className="p-6 rounded-3xl border-2 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 border-b pb-4">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              Refund Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Method:</span>
                <Badge variant="secondary" className="font-black tracking-widest text-[9px] uppercase">{returnRequest.refundMethod}</Badge>
              </div>
              {returnRequest.refundMethod === "BANK_TRANSFER" && returnRequest.bankAccount && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100 space-y-2">
                  <div className="text-xs font-black text-emerald-800">{(returnRequest.bankAccount as any).bankName}</div>
                  <div className="text-sm font-mono font-black text-emerald-600 tracking-tighter">{(returnRequest.bankAccount as any).accountNumber}</div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase italic">{(returnRequest.bankAccount as any).accountHolder}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Traceability */}
          <Card className="p-4 rounded-2xl bg-slate-900 text-slate-400 font-mono text-[10px] space-y-2 border-none">
            <div className="flex justify-between">
              <span>CREATED:</span>
              <span className="text-white">{formatDate(returnRequest.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>ORDER_REF:</span>
              <Link href={`/admin/orders/${returnRequest.orderId}`} className="text-primary hover:underline font-bold">#{returnRequest.orderId.split("-")[0].toUpperCase()}</Link>
            </div>
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-primary font-black">{returnRequest.status}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog for Status Update */}
      <UpdateReturnStatusDialog 
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        returnRequest={returnRequest}
      />
    </div>
  );
}
