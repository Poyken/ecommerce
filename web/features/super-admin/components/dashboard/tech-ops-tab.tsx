/**
 * =====================================================================
 * TECHOPS TAB - Giám sát Kỹ thuật (DevOps Dashboard)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SYSTEM MONITORING:
 * - Màn hình này dành cho đội kỹ thuật (Dev/Ops).
 * - Theo dõi sức khỏe hệ thống: API, Database, Worker Nodes, Storage S3.
 *
 * 2. JOB QUEUES (BullMQ):
 * - Hiển thị trạng thái các hàng đợi xử lý ngầm (Gửi mail, Resize ảnh...).
 *
 * 3. LUXURY UI (NEW):
 * - Sử dụng AdminStatsCard và Glassmorphism để đồng bộ với toàn bộ hệ thống.
 *
 * =====================================================================
 */ 
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Globe,
  Database,
  Cpu,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { AdminStatsCard } from "@/features/admin/components/ui/admin-page-components";
import { ScrollArea } from "@/components/ui/scroll-area";

const queueStats = [
  {
    name: "mail-queue",
    active: 24,
    waiting: 152,
    failed: 0,
    status: "healthy",
  },
  {
    name: "image-processing",
    active: 5,
    waiting: 12,
    failed: 2,
    status: "warning",
  },
  {
    name: "webhook-delivery",
    active: 0,
    waiting: 0,
    failed: 0,
    status: "idle",
  },
  { name: "billing-sync", active: 1, waiting: 0, failed: 0, status: "healthy" },
];

const errorLogs = [
  {
    id: "ERR-1024",
    service: "Payment",
    message: "Stripe connection timeout",
    time: "2 mins ago",
    severity: "critical",
  },
  {
    id: "ERR-1023",
    service: "Storage",
    message: "S3 Upload Rate Limit Exceeded",
    time: "15 mins ago",
    severity: "warning",
  },
  {
    id: "ERR-1022",
    service: "Auth",
    message: "Invalid Refresh Token",
    time: "42 mins ago",
    severity: "info",
  },
  {
    id: "ERR-1021",
    service: "API",
    message: "DB Connection Pool saturation",
    time: "1 hour ago",
    severity: "critical",
  },
  {
    id: "ERR-1020",
    service: "Email",
    message: "SMTP Handshake failed",
    time: "2 hours ago",
    severity: "error",
  },
];

export function TechOpsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Infrastructure Health Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="API Gateway"
          value="Operational"
          description="99.99% uptime"
          icon={Globe}
          variant="success"
        />

        <AdminStatsCard
          title="Database"
          value="Healthy"
          description="Latency: 12ms"
          icon={Database}
          variant="success"
        />

        <AdminStatsCard
          title="Worker Nodes"
          value="High Load"
          description="Usage: 82%"
          icon={Cpu}
          variant="warning"
        />

        <AdminStatsCard
          title="Storage"
          value="45% Used"
          description="Availability: High"
          icon={Server}
          variant="info"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Queue Monitoring */}
        <Card className="rounded-3xl glass-premium border-white/5 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">Job Queues (BullMQ)</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/60">
              Real-time worker processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queueStats.map((queue) => (
                <div
                  key={queue.name}
                  className="flex items-center justify-between p-3 border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm tracking-tight text-white">
                      {queue.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-muted-foreground">
                        {queue.active} active
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-muted-foreground">
                        {queue.waiting} waiting
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {queue.status === "healthy" && (
                      <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-black uppercase tracking-widest">
                        Healthy
                      </Badge>
                    )}
                    {queue.status === "warning" && (
                      <Badge className="bg-amber-500 text-white border-0 text-[10px] font-black uppercase tracking-widest">
                        Slow
                      </Badge>
                    )}
                    {queue.status === "idle" && (
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">Idle</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Error Logs */}
        <Card className="rounded-3xl glass-premium border-rose-500/10 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-rose-500">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="font-black tracking-tight uppercase text-sm tracking-[0.1em]">Live Error Feed</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/60">Recent system exceptions & alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border-l-4 border-l-rose-500 bg-white/5 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground uppercase tracking-widest">
                        {log.service}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {log.time}
                      </span>
                    </div>
                    <p className="font-bold text-white">{log.message}</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
                      {log.id}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
