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
 * - Nếu `waiting` tăng cao đột biến -> Hệ thống đang bị tắc nghẽn (Bottleneck).
 *
 * 3. ERROR LOGS:
 * - Feed lỗi thời gian thực (giả lập) để phát hiện sự cố nhanh.
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
        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  API Gateway
                </p>
                <p className="font-extrabold text-emerald-700">Operational</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Database
                </p>
                <p className="font-extrabold text-emerald-700">
                  Healthy (12ms)
                </p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Cpu className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Worker Nodes
                </p>
                <p className="font-extrabold text-amber-700">High Load (82%)</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Storage
                </p>
                <p className="font-extrabold text-blue-700">45% Used</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Queue Monitoring */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Job Queues (BullMQ)
            </CardTitle>
            <CardDescription>
              Real-time worker processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queueStats.map((queue) => (
                <div
                  key={queue.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm tracking-tight">
                      {queue.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {queue.active} active
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {queue.waiting} waiting
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {queue.status === "healthy" && (
                      <Badge className="bg-emerald-500 text-white border-0">
                        Healthy
                      </Badge>
                    )}
                    {queue.status === "warning" && (
                      <Badge className="bg-amber-500 text-white border-0">
                        Slow
                      </Badge>
                    )}
                    {queue.status === "idle" && (
                      <Badge variant="secondary">Idle</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Error Logs */}
        <Card className="rounded-2xl shadow-sm border-rose-100 dark:border-rose-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              Live Error Feed
            </CardTitle>
            <CardDescription>Recent system exceptions & alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border-l-4 border-l-rose-500 bg-muted/20 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {log.service}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {log.time}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{log.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">
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
