import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface AEStat {
  ae_id: string;
  ae_name: string;
  ae_email: string;
  total_assigned: number;
  pending: number;
  approved: number;
  rejected: number;
  revision: number;
}

interface ReviewerStat {
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  total_assigned: number;
  pending: number;
  completed: number;
  accepted: number;
  rejected: number;
  minor_revision: number;
  major_revision: number;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (diff < 1) return "just now";
  if (diff < 24) return `${Math.floor(diff)}h ago`;
  return `${Math.floor(diff / 24)}d ago`;
}

export default function CEStats() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aeStats, setAeStats] = useState<AEStat[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStat[]>([]);
  const [remindingAE, setRemindingAE] = useState<string | null>(null);
  const [remindingReviewer, setRemindingReviewer] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAeStats(data.data.ae_stats || []);
          setReviewerStats(data.data.reviewer_stats || []);
        } else {
          throw new Error(data.message);
        }
      })
      .catch((e) =>
        toast({ variant: "destructive", title: "Error", description: e.message })
      )
      .finally(() => setLoading(false));
  }, [token]);

  // Stats page only shows per-person Send Reminder (no specific paperId context here)
  // The remind buttons in CEPapers are per paper. Here we show aggregate stats only.

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editorial Stats</h1>
          <p className="text-muted-foreground mt-1">
            Performance overview of Associate Editors and Reviewers
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* AE Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Associate Editors</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {aeStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">No associate editor assignments found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Total</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Pending</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Approved</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Revision</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {aeStats.map((ae) => (
                          <tr key={ae.ae_id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{ae.ae_name}</p>
                                <p className="text-xs text-muted-foreground">{ae.ae_email}</p>
                              </div>
                            </td>
                            <td className="text-center px-3 py-3 font-semibold">{ae.total_assigned}</td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                {ae.pending}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                {ae.approved}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                {ae.revision}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                                {ae.rejected}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviewer Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Reviewers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reviewerStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">No reviewer assignments found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Total</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Pending</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Completed</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Accepted</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Minor Rev.</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Major Rev.</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reviewerStats.map((r) => (
                          <tr key={r.reviewer_id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{r.reviewer_name}</p>
                                <p className="text-xs text-muted-foreground">{r.reviewer_email}</p>
                              </div>
                            </td>
                            <td className="text-center px-3 py-3 font-semibold">{r.total_assigned}</td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                {r.pending}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                {r.completed}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">{r.accepted}</td>
                            <td className="text-center px-3 py-3">{r.minor_revision}</td>
                            <td className="text-center px-3 py-3">{r.major_revision}</td>
                            <td className="text-center px-3 py-3">{r.rejected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
