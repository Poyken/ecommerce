"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateInvoiceStatusAction } from "@/features/superadmin/domain-actions/invoices-actions";
import { MoreHorizontal, Ban, CheckCircle, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/shared/use-toast";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  tenant: {
    name: string;
    domain: string;
  };
  amount: string;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";
  createdAt: string;
  dueDate: string;
  description?: string;
}

interface InvoicesClientProps {
  initialData: {
    data: Invoice[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function InvoicesClient({ initialData }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState(initialData.data);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await updateInvoiceStatusAction({ id, status });
    if (res?.data) {
      toast({ title: "Invoice status updated" });
      setInvoices(
        invoices.map((inv) =>
          inv.id === id ? { ...inv, status: status as any } : inv
        )
      );
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: res?.serverError || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-300 bg-yellow-50"
          >
            Pending
          </Badge>
        );
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "VOID":
        return <Badge variant="secondary">Void</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center h-24 text-muted-foreground"
              >
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono text-xs">
                  {invoice.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.tenant.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.tenant.domain}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: invoice.currency,
                  }).format(Number(invoice.amount))}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Manage Invoice</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      {invoice.status !== "PAID" && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(invoice.id, "PAID")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />{" "}
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      {invoice.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateStatus(invoice.id, "CANCELLED")
                          }
                        >
                          <Ban className="mr-2 h-4 w-4 text-red-500" /> Cancel
                          Invoice
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
  );
}
