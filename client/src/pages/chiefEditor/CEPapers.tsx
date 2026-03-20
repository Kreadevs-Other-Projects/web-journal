import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Search } from "lucide-react";
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
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  assigned_to_sub_editor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  under_review: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  pending_revision: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  accepted: "bg-green-500/10 text-green-600 border-green-500/30",
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

  useEffect(() => {
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
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.author_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [papers, search, statusFilter, journalFilter]);

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
                <SelectItem key={j} value={j}>{j}</SelectItem>
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
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : paper.created_at
                          ? new Date(paper.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[paper.status] || "bg-muted text-muted-foreground"}>
                    {paper.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {papers.length} papers
        </p>
      </div>
    </DashboardLayout>
  );
}
