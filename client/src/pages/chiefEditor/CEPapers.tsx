import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Loader2, Search, ShieldAlert, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
  status: string;
  author_name: string;
  journal_name: string;
  issue_label: string | null;
  editor_decision: string | null;
  created_at: string;
  submitted_at: string;
  current_ae_id: string | null;
  current_ae_name: string | null;
}

const OVERRIDE_STATUSES = [
  "submitted",
  "assigned_to_sub_editor",
  "under_review",
  "pending_revision",
  "resubmitted",
  "accepted",
  "awaiting_payment",
  "rejected",
  "published",
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  assigned_to_sub_editor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  under_review: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  pending_revision: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  resubmitted: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  accepted: "bg-green-500/10 text-green-600 border-green-500/30",
  awaiting_payment: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  published: "bg-teal-500/10 text-teal-600 border-teal-500/30",
};

export default function CEPapers() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [journalFilter, setJournalFilter] = useState("all");

  // Override modal state
  const [overridePaper, setOverridePaper] = useState<Paper | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overridePassword, setOverridePassword] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Remind state
  const [remindingAE, setRemindingAE] = useState<string | null>(null);

  const fetchPapers = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/getAllPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPapers(data.data || []);
        else throw new Error(data.message);
      })
      .catch((e) => toast({ variant: "destructive", title: "Error", description: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPapers();
  }, [token]);

  const journals = useMemo(() => {
    const seen = new Set<string>();
    return papers
      .filter((p) => p.journal_name && !seen.has(p.journal_name) && seen.add(p.journal_name))
      .map((p) => p.journal_name);
  }, [papers]);

  const statuses = useMemo(() => {
    const seen = new Set<string>();
    return papers.filter((p) => !seen.has(p.status) && seen.add(p.status)).map((p) => p.status);
  }, [papers]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (journalFilter !== "all" && p.journal_name !== journalFilter) return false;
      if (
        search &&
        !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.author_name?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [papers, search, statusFilter, journalFilter]);

  const openOverrideModal = (paper: Paper) => {
    setOverridePaper(paper);
    setOverrideStatus(paper.status);
    setOverrideReason("");
    setOverrideEmail("");
    setOverridePassword("");
  };

  const handleOverrideSubmit = async () => {
    if (!overridePaper || !overrideStatus || !overrideReason || !overrideEmail || !overridePassword) {
      toast({ variant: "destructive", title: "All fields are required" });
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await fetch(`${url}/chiefEditor/papers/${overridePaper.id}/override-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: overrideStatus,
          reason: overrideReason,
          email: overrideEmail,
          password: overridePassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Status overridden", description: `Paper status updated to "${overrideStatus.replace(/_/g, " ")}"` });
      setOverridePaper(null);
      fetchPapers();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleRemindAE = async (paperId: string) => {
    setRemindingAE(paperId);
    try {
      const res = await fetch(`${url}/chiefEditor/papers/${paperId}/remind-ae`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Reminder sent", description: data.message });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not send reminder", description: e.message });
    } finally {
      setRemindingAE(null);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Papers</h1>
          <p className="text-muted-foreground mt-1">All papers across your journals</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={journalFilter} onValueChange={setJournalFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="All journals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Journals</SelectItem>
              {journals.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No papers found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {filtered.map((paper) => (
                <div key={paper.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{paper.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{paper.author_name || "—"}</span>
                      <span>·</span>
                      <span>{paper.journal_name}</span>
                      {paper.issue_label && (
                        <>
                          <span>·</span>
                          <span>{paper.issue_label}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {paper.submitted_at
                          ? new Date(paper.submitted_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : paper.created_at
                          ? new Date(paper.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {paper.current_ae_name && (
                        <>
                          <span>·</span>
                          <span>AE: {paper.current_ae_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={
                        STATUS_COLORS[paper.status] || "bg-muted text-muted-foreground"
                      }
                    >
                      {paper.status.replace(/_/g, " ")}
                    </Badge>
                    {paper.current_ae_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={remindingAE === paper.id}
                        onClick={() => handleRemindAE(paper.id)}
                      >
                        {remindingAE === paper.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Bell className="h-3 w-3" />
                        )}
                        Remind AE
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => openOverrideModal(paper)}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      Override
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {papers.length} papers
        </p>
      </div>

      {/* Override Status Modal */}
      <Dialog open={!!overridePaper} onOpenChange={(open) => !open && setOverridePaper(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Override Paper Status
            </DialogTitle>
            <DialogDescription>
              This action will forcefully change the paper status and notify the author.
              Credential verification is required.
            </DialogDescription>
          </DialogHeader>

          {overridePaper && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium truncate">{overridePaper.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current status: {overridePaper.status.replace(/_/g, " ")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERRIDE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason (required)</Label>
                <Textarea
                  placeholder="Explain why you are overriding the status..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Verify your credentials
                </p>
                <div className="space-y-2">
                  <Label>Your Email</Label>
                  <Input
                    type="email"
                    value={overrideEmail}
                    onChange={(e) => setOverrideEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your Password</Label>
                  <Input
                    type="password"
                    value={overridePassword}
                    onChange={(e) => setOverridePassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverridePaper(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleOverrideSubmit}
              disabled={overrideLoading}
            >
              {overrideLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Override Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
