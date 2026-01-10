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
import { deletePlanAction } from "@/features/superadmin/domain-actions/plans-actions";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { PlanDialog } from "./plan-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Type definition matching Prisma Model
interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number; // Decimal comes as string or number depending on Serializer
  priceYearly: number;
  currency: string;
  maxProducts: number;
  maxStorage: number;
  isActive: boolean;
  isPublic: boolean;
  features?: string | any; // JSON
}

interface PlansClientProps {
  initialPlans: SubscriptionPlan[];
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Sync with server props
  if (initialPlans !== plans) {
    setPlans(initialPlans);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    const res = await deletePlanAction({ id });
    if (res?.data) {
      toast({ title: "Plan deleted" });
      router.refresh();
    } else {
      toast({
        title: "Failed to delete",
        variant: "destructive",
        description: res?.serverError || "Failed to delete plan",
      });
    }
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Price (Month / Year)</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No plans found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{plan.name}</span>
                      {plan.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {plan.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {plan.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${Number(plan.priceMonthly)} / ${Number(plan.priceYearly)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>
                        {plan.maxProducts === -1
                          ? "Unlimited"
                          : plan.maxProducts}{" "}
                        Products
                      </div>
                      <div className="text-muted-foreground">
                        {plan.maxStorage} MB Storage
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {plan.isPublic && (
                      <Badge variant="outline" className="ml-2">
                        Public
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
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

      <PlanDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingPlan(null);
        }}
        planToEdit={editingPlan}
      />
    </>
  );
}
