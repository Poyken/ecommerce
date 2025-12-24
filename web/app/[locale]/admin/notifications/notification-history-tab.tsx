"use client";

import { getAdminNotificationsAction, Notification } from "@/actions/notifications";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function NotificationHistoryTab() {
  const t = useTranslations("admin.notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getAdminNotificationsAction(page, 10);
    if (res.data) {
      setNotifications(res.data);
      if (res.meta) {
        setTotalPages(res.meta.lastPage);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t("history")}</h2>
        <Button variant="outline" size="sm" onClick={fetchNotifications}>
          {t("refresh")}
        </Button>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead>{t("form.title")}</TableHead>
              <TableHead>{t("form.type")}</TableHead>
              <TableHead>{t("form.message")}</TableHead>
              {/* <TableHead>Recipient</TableHead> // API findAllAdmin returns User object? Need to check types */}
              <TableHead>{t("createdAt")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("noHistory")}
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notif: any) => (
                <TableRow
                  key={notif.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="font-medium">{notif.title}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {notif.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {notif.message}
                  </TableCell>
                  {/* <TableCell>{notif.user?.email || "All"}</TableCell> */}
                  <TableCell>
                    {format(new Date(notif.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {notif.isRead ? (
                        <div className="flex items-center text-green-500 gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Read</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-yellow-500 gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">Unread</span>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
