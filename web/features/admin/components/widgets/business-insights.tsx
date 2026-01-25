"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  ChevronRight,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { 
  adminInsightsService, 
  DailyInsights, 
  Insight 
} from "../../services/admin-insights.service";
import { m, fadeInUp, staggerContainer, itemVariant } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function BusinessInsightsWidget() {
  const [data, setData] = useState<DailyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);

      const res = force 
        ? await adminInsightsService.refreshInsights()
        : await adminInsightsService.getInsights();

      if (res && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch insights", error);
      toast({
        title: "Error",
        description: "Could not load AI Business Insights",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "success": return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: Insight["type"]) => {
    switch (type) {
      case "success": return "bg-emerald-500/10 border-emerald-500/20";
      case "warning": return "bg-amber-500/10 border-amber-500/20";
      default: return "bg-blue-500/10 border-blue-500/20";
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6 space-y-4 border-violet-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-violet-500 animate-pulse" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="relative overflow-hidden group border-violet-500/10 hover:border-violet-500/20 transition-all duration-500">
      {/* Aurora Background Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 blur-[80px] rounded-full group-hover:bg-violet-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />

      <div className="p-6 relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">AI Business Insights</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchInsights(true)}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-full hover:bg-violet-500/10 text-muted-foreground"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* AI Summary */}
        <m.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="p-4 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/10 backdrop-blur-sm shadow-inner"
        >
          <p className="text-sm leading-relaxed text-foreground/90 font-medium italic">
            &ldquo;{data?.summary}&rdquo;
          </p>
        </m.div>

        {/* Insights List */}
        <m.div 
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {data?.insights.map((insight, idx) => (
            <m.div 
              key={idx}
              variants={itemVariant}
              className={cn(
                "p-3 rounded-xl border flex items-start gap-3 group/item transition-all duration-300 hover:shadow-lg hover:shadow-black/5",
                getBgColor(insight.type)
              )}
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-white/50 dark:bg-black/20">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-foreground mb-0.5">{insight.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {insight.message}
                </p>
                {insight.action && (
                  <button className="mt-2 text-[10px] font-black uppercase tracking-tighter text-foreground flex items-center gap-1 hover:gap-2 transition-all">
                    {insight.action} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </m.div>
          ))}
        </m.div>

        {/* Footer info */}
        <div className="pt-2 flex items-center justify-between text-[9px] text-muted-foreground/50 font-bold uppercase tracking-tighter">
          <span>Last generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : 'N/A'}</span>
          <span className="flex items-center gap-1"><BrainCircuit className="w-2 h-2" /> Neural Engine Active</span>
        </div>
      </div>
    </GlassCard>
  );
}
