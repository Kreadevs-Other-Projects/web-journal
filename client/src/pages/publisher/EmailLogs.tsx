import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string | null;
  paper_id: string | null;
  user_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmailLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${url}/publisher/email-logs?page=${page}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) {
          setLogs(json.logs);
          setTotal(json.total);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All outbound emails sent by the platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Email History ({total} total)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground text-sm p-6 italic">
                No email logs found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Recipient
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Subject
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Template
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Sent At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground max-w-[200px] truncate">
                          {log.recipient}
                        </td>
                        <td className="py-3 px-4 text-foreground max-w-[240px] truncate">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {log.template || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              log.status === "sent" ? "default" : "destructive"
                            }
                            className="text-xs capitalize"
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(log.sent_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
