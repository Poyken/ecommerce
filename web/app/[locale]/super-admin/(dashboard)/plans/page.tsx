import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlansClient } from "./plans-client";
import { getPlansAction } from "@/features/superadmin/domain-actions/plans-actions";
import { PlanDialog } from "./plan-dialog";

export default async function PlansPage() {
  const { data: plansRes } = await getPlansAction();
  const plans = plansRes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground">
            Manage available plans for tenants.
          </p>
        </div>
        <PlanDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          }
        />
      </div>
      <PlansClient initialPlans={plans} />
    </div>
  );
}
