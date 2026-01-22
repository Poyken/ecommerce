"use client";

import { getMyReturnsAction } from "@/features/returns/actions";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Link } from "@/i18n/routing";
import { ReturnRequest } from "@/types/models";
import { format } from "date-fns";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, Calendar, Hash, PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassButton } from "@/components/shared/glass-button";



export function ProfileReturnsTab() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await getMyReturnsAction();
        if (res.success && res.data) {
          setReturns(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch returns", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReturns();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">No returns found</h3>
        <p className="text-muted-foreground max-w-sm">
          You haven't made any return requests yet. If you need to return an item, go to your Orders page and select the order.
        </p>
        <Link href="/profile">
           {/* In a real app we might want to trigger the tab change via state or URL param */}
          <GlassButton variant="outline">
             Check My Orders
          </GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Return Requests</h2>
          <p className="text-muted-foreground">
            Manage your return requests and track their status.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {returns.map((request, index) => (
            <m.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 transition-all hover:bg-white/10 group border border-transparent hover:border-primary/20">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-4 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-lg font-bold text-primary flex items-center gap-1">
                        <Hash size={18} />
                        {request.id.substring(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge
                        status={request.status}
                        label={request.status.replace(/_/g, " ")}
                      />
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground uppercase border border-white/10">
                         {request.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {format(new Date(request.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PackageSearch size={16} />
                        <span>
                          Order: #{request.orderId.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                       <span className="text-muted-foreground mr-2">Reason:</span>
                       <span className="text-foreground line-clamp-1">{request.reason}</span>
                    </div>
                  </div>

                  <Link href={`/profile/returns/${request.id}`} className="w-full md:w-auto">
                    <GlassButton
                      variant="ghost"
                      className="w-full group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      View Details
                      <ArrowRight size={16} className="ml-2" />
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
