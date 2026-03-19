import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  FileText,
  CheckCircle,
  Eye,
  X,
  Search,
  Clock,
  User,
  BookOpen,
  ExternalLink,
  Loader2,
  AlertCircle,
  Download,
  Shield,
  Hash,
  Link,
  Info,
  Plus,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface Review {
  paperId: string;
  reviewId: string;
  title: string;
  journalId: string;
  issueId: string;
  comments: string;
  decision: string;
  assignmentStatus: string;
  fileUrl: string;
  versionNumber: number;
  versionCreatedAt: string;
  paperStatus: string;
  reviewerId: string;
  submittedAt: string;
}

interface JournalIssue {
  id: string;
  journal_id: string;
  journal_title: string;
  label: string;
  volume?: number;
  issue_no?: number;
  year?: number;
  status: string;
  article_count?: number;
  created_at: string;
}

type StatusFilter = "all" | "accepted" | "under_review" | "published";
type IssueStatusFilter = "all" | "open" | "closed" | "draft" | "published";
type MainTab = "papers" | "issues";

export default function PublisherManager() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>("papers");

  // ---- Papers tab state ----
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepted");
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [viewPdf, setViewPdf] = useState<Review | null>(null);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [openPublish, setOpenPublish] = useState(false);
  const [openProof, setOpenProof] = useState(false);
  const [yearLabel, setYearLabel] = useState("");
  const [doi, setDoi] = useState("");
  const [publishing, setPublishing] = useState(false);

  // ---- Issues tab state ----
  const [issues, setIssues] = useState<JournalIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueStatusFilter, setIssueStatusFilter] = useState<IssueStatusFilter>("all");
  const [openRequestIssue, setOpenRequestIssue] = useState(false);
  const [requestingIssue, setRequestingIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState({
    label: "",
    volume: "",
    issue_no: "",
    year: "",
  });

  // Derive unique issues from loaded data for the filter dropdown
  const issueOptions = reviews.reduce<{ id: string; label: string }[]>(
    (acc, r) => {
      if (r.issueId && !acc.find((i) => i.id === r.issueId)) {
        acc.push({ id: r.issueId, label: r.issueId.slice(0, 8) + "…" });
      }
      return acc;
    },
    [],
  );

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${url}/publication/getSubmittedReviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          const normalized = data.data.map((r: any) => ({
            ...r,
            issueId: r.issueid,
            journalId: r.journalid,
          }));
          setReviews(normalized);
          applyFilters(normalized, searchQuery, statusFilter, issueFilter);
        } else {
          throw new Error("Failed to fetch reviews");
        }
      } catch (err) {
        console.error("Error fetching submitted reviews:", err);
        toast({
          title: "Error",
          description: "Unable to load submitted reviews.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  // Fetch issues when Issues tab is activated
  useEffect(() => {
    if (mainTab === "issues" && token) {
      fetchIssues();
    }
  }, [mainTab, token]);

  const fetchIssues = async () => {
    try {
      setIssuesLoading(true);
      const res = await fetch(`${url}/journal-issue/my-issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || Array.isArray(data.issues)) {
        setIssues(data.issues || []);
      } else {
        throw new Error("Failed to fetch issues");
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      toast({
        title: "Error",
        description: "Unable to load issues.",
        variant: "destructive",
      });
    } finally {
      setIssuesLoading(false);
    }
  };

  const filteredIssues = issues.filter((iss) =>
    issueStatusFilter === "all" ? true : iss.status === issueStatusFilter,
  );

  const handleRequestIssue = async () => {
    if (!newIssueForm.label.trim()) {
      toast({ title: "Label required", description: "Please enter a label for the issue.", variant: "destructive" });
      return;
    }
    try {
      setRequestingIssue(true);
      const journalId = user?.active_journal_id ?? issues[0]?.journal_id ?? null;
      const res = await fetch(`${url}/journal-issue/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          journal_id: journalId,
          label: newIssueForm.label.trim(),
          volume: newIssueForm.volume ? Number(newIssueForm.volume) : undefined,
          issue_no: newIssueForm.issue_no ? Number(newIssueForm.issue_no) : undefined,
          year: newIssueForm.year ? Number(newIssueForm.year) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request issue");
      toast({ title: "Issue Requested", description: "Your request has been submitted." });
      setOpenRequestIssue(false);
      setNewIssueForm({ label: "", volume: "", issue_no: "", year: "" });
      fetchIssues();
    } catch (err: any) {
      toast({ title: "Request Failed", description: err.message, variant: "destructive" });
    } finally {
      setRequestingIssue(false);
    }
  };

  useEffect(() => {
    applyFilters(reviews, searchQuery, statusFilter, issueFilter);
  }, [searchQuery, statusFilter, issueFilter]);

  const applyFilters = (
    reviewsList: Review[],
    query: string,
    status: StatusFilter,
    issue: string,
  ) => {
    let filtered = reviewsList;

    if (query) {
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(query.toLowerCase()) ||
          review.comments?.toLowerCase().includes(query.toLowerCase()) ||
          review.reviewerId.toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((review) => review.paperStatus === status);
    }

    if (issue !== "all") {
      filtered = filtered.filter((review) => review.issueId === issue);
    }

    setFilteredReviews(filtered);
  };

  const handleOpenPublish = (review: Review) => {
    setSelectedReview(review);
    setOpenPublish(true);
    setOpenProof(false);
  };

  const handlePreviewProof = () => {
    if (!doi.trim()) {
      toast({
        title: "DOI required",
        description: "Please enter a DOI before previewing the proof.",
        variant: "destructive",
      });
      return;
    }
    setOpenProof(true);
  };

  const publishPaper = async () => {
    if (!selectedReview) return;

    if (!doi.trim()) {
      toast({
        title: "DOI required",
        description: "DOI is required before publication.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPublishing(true);

      const res = await fetch(
        `${url}/publication/publishPaper/${selectedReview.paperId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            year_label: yearLabel,
            issueId: selectedReview.issueId,
            doi: doi.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to publish paper");

      setReviews((prev) => {
        const updated = prev.map((r) =>
          r.paperId === selectedReview.paperId
            ? { ...r, paperStatus: "published" }
            : r,
        );
        applyFilters(updated, searchQuery, statusFilter, issueFilter);
        return updated;
      });

      toast({
        title: "Paper Published",
        description: `"${selectedReview.title}" has been published successfully`,
      });

      setOpenPublish(false);
      setOpenProof(false);
      setYearLabel("");
      setDoi("");
      setSelectedReview(null);
    } catch (err: any) {
      console.error("Publish error:", err);
      toast({
        title: "Publish failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      submitted: { label: "Submitted", variant: "secondary" },
      under_review: { label: "Under Review", variant: "outline" },
      published: { label: "Published", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "secondary" };

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const getDecisionBadge = (decision: string) => {
    const decisionMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      accepted: { label: "Accepted", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      revision_needed: { label: "Revision Needed", variant: "outline" },
    };

    const config = decisionMap[decision] || {
      label: decision,
      variant: "secondary",
    };

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const getIssueBadgeStyle = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-red-100 text-red-800 border-red-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "published":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Publisher Manager
            </h1>
            <p className="text-gray-400 mt-1">
              Manage issues and publish submitted paper reviews
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredReviews.length}{" "}
              {filteredReviews.length === 1 ? "Paper" : "Papers"}
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="papers" className="gap-2">
              <FileText className="h-4 w-4" />
              Papers
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <Layers className="h-4 w-4" />
              Issues
            </TabsTrigger>
          </TabsList>

          {/* ===== PAPERS TAB ===== */}
          <TabsContent value="papers" className="space-y-6 mt-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search papers by title, comments, or reviewer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Tabs
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as StatusFilter)
                      }
                    >
                      <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="accepted">Accepted</TabsTrigger>
                        <TabsTrigger value="published">Published</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {issueOptions.length > 0 && (
                      <Select value={issueFilter} onValueChange={setIssueFilter}>
                        <SelectTrigger className="w-44 bg-white/5 border-white/10 text-sm">
                          <SelectValue placeholder="Filter by Issue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Issues</SelectItem>
                          {issueOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              Issue {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-400">Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery || statusFilter !== "all"
                      ? "No matching papers found"
                      : "No reviews submitted yet"}
                  </h3>
                  <p className="text-gray-400 text-center max-w-md">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Submitted reviews will appear here for publishing"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredReviews.map((review) => (
                  <Card
                    key={`${review.paperId}-${review.reviewId}`}
                    className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                          <CardTitle className="text-lg font-bold truncate max-w-[200px]">
                            {review.title}
                          </CardTitle>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                          v{review.versionNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getStatusBadge(review.paperStatus)}
                        {getDecisionBadge(review.decision)}
                        {review.issueId && (
                          <Badge
                            variant="outline"
                            className="text-xs text-purple-300 border-purple-500/30"
                          >
                            Issue: {review.issueId.slice(0, 8)}…
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <User className="h-4 w-4" />
                          <span>Reviewer: </span>
                          <code className="bg-black/30 px-2 py-1 rounded text-xs">
                            {review.reviewerId.slice(0, 12)}...
                          </code>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="h-4 w-4" />
                          <span>Submitted: {formatDate(review.submittedAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Version Date: {formatDate(review.versionCreatedAt)}
                          </span>
                        </div>

                        {review.comments && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-sm text-gray-400 line-clamp-2">
                              <span className="font-medium text-gray-300">
                                Comments:
                              </span>{" "}
                              {review.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2 pt-4 border-t border-white/10">
                      {review.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-white/20 hover:border-blue-500/50 hover:bg-blue-500/10"
                          onClick={() => setViewPdf(review)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View File
                        </Button>
                      )}

                      {review.paperStatus !== "published" ? (
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          onClick={() => handleOpenPublish(review)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish
                        </Button>
                      ) : (
                        <Badge
                          variant="default"
                          className="flex-1 justify-center py-2 cursor-default"
                        >
                          ✓ Published
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== ISSUES TAB ===== */}
          <TabsContent value="issues" className="space-y-6 mt-4">
            {/* Header row with filter tabs + Request button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Tabs
                value={issueStatusFilter}
                onValueChange={(v) => setIssueStatusFilter(v as IssueStatusFilter)}
              >
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={() => setOpenRequestIssue(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
              >
                <Plus className="h-4 w-4" />
                Request New Issue
              </Button>
            </div>

            {issuesLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-400">Loading issues...</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {issueStatusFilter !== "all" ? "No matching issues" : "No issues yet"}
                  </h3>
                  <p className="text-gray-400 text-center max-w-md">
                    {issueStatusFilter !== "all"
                      ? "Try a different filter"
                      : "Request a new issue to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 text-left">Journal</th>
                      <th className="px-4 py-3 text-left">Label</th>
                      <th className="px-4 py-3 text-center">Volume</th>
                      <th className="px-4 py-3 text-center">Issue No</th>
                      <th className="px-4 py-3 text-center">Year</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Articles</th>
                      <th className="px-4 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((iss) => (
                      <tr
                        key={iss.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {iss.journal_title || iss.journal_id?.slice(0, 8) + "…"}
                        </td>
                        <td className="px-4 py-3">{iss.label || "—"}</td>
                        <td className="px-4 py-3 text-center">{iss.volume ?? "—"}</td>
                        <td className="px-4 py-3 text-center">{iss.issue_no ?? "—"}</td>
                        <td className="px-4 py-3 text-center">{iss.year ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${getIssueBadgeStyle(iss.status)}`}
                          >
                            {iss.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {iss.article_count ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {iss.created_at
                            ? new Date(iss.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {viewPdf && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setViewPdf(null)}
            />

            <div className="relative h-screen w-screen flex items-center justify-center p-4">
              <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-xl border border-white/20 shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 line-clamp-1">
                        {viewPdf.title || "Document Viewer"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Version {viewPdf.versionNumber}
                        </span>
                        {viewPdf.paperId && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {viewPdf.paperId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-white/20 hover:border-blue-500/50 hover:bg-blue-500/10"
                      onClick={() =>
                        window.open(`${url}${viewPdf.fileUrl}`, "_blank")
                      }
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-white/20 hover:border-white/40 hover:bg-white/5"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${url}${viewPdf.fileUrl}`,
                        );
                        toast({
                          title: "Link copied",
                          description: "PDF link copied to clipboard",
                        });
                      }}
                    >
                      <Link className="h-4 w-4" />
                      Copy Link
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-white rounded-lg hover:bg-red-500/20 hover:text-red-400"
                      onClick={() => setViewPdf(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <Worker workerUrl="/pdf.worker.min.js">
                    <Viewer fileUrl={`${url}${viewPdf.fileUrl}`} theme="dark" />
                  </Worker>
                </div>

                <div className="p-3 bg-gray-800 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>PDF Viewer</span>
                      </div>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="hidden md:flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Use Ctrl + scroll to zoom</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <a
                        href={`${url}${viewPdf.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in new tab</span>
                      </a>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        <span>Secure PDF Viewer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog open={openPublish} onOpenChange={setOpenPublish}>
          <DialogContent className="bg-gray-900 border-white/20 max-w-md backdrop-blur-sm">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-white font-bold">
                    Publish Paper
                  </DialogTitle>
                  <p className="text-sm text-gray-400">
                    Complete the publishing process
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="font-medium text-white mb-2">Paper Details</h4>
                <p className="text-sm text-gray-300 truncate">
                  {selectedReview?.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>v{selectedReview?.versionNumber}</span>
                  <span>•</span>
                  <span>
                    Reviewer: {selectedReview?.reviewerId?.slice(0, 8)}...
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  DOI *
                </label>
                <Input
                  placeholder="e.g., 10.12345/journal-name.2026.01"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  className="border-white/10 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400">
                  Required. Format: 10.XXXXX/journal-acronym.year.index
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Year Label
                </label>
                <Input
                  placeholder="e.g., 2026-Vol1"
                  value={yearLabel}
                  onChange={(e) => setYearLabel(e.target.value)}
                  className="border-white/10 focus:border-blue-500"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setOpenPublish(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePreviewProof}
                disabled={!doi.trim()}
                className="flex-1 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Proof
              </Button>
              <Button
                onClick={publishPaper}
                disabled={publishing || !doi.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish Paper
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publication Proof Preview Modal */}
        <Dialog open={openProof} onOpenChange={setOpenProof}>
          <DialogContent className="bg-gray-900 border-white/20 max-w-lg backdrop-blur-sm">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-white font-bold">
                    Publication Proof
                  </DialogTitle>
                  <p className="text-sm text-gray-400">Read-only preview before publication</p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Article Title</p>
                  <p className="text-white font-medium">{selectedReview?.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">DOI</p>
                  <p className="text-blue-400 font-mono">
                    https://doi.org/{doi}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Year / Label</p>
                  <p className="text-gray-300">{yearLabel || new Date().getFullYear().toString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Version</p>
                  <p className="text-gray-300">v{selectedReview?.versionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">License</p>
                  <p className="text-gray-300">CC BY 4.0</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Issue ID</p>
                  <p className="text-gray-400 font-mono text-xs">{selectedReview?.issueId}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                This is a read-only proof. Click "Publish Paper" to confirm.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpenProof(false)} className="flex-1">
                Back to Edit
              </Button>
              <Button
                onClick={publishPaper}
                disabled={publishing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {publishing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Publish Paper</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request New Issue Dialog */}
        <Dialog open={openRequestIssue} onOpenChange={setOpenRequestIssue}>
          <DialogContent className="bg-gray-900 border-white/20 max-w-md backdrop-blur-sm">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Layers className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-white font-bold">
                    Request New Issue
                  </DialogTitle>
                  <p className="text-sm text-gray-400">Submit a request for a new journal issue</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Label <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="e.g., Vol 1 Issue 1 — Spring 2026"
                  value={newIssueForm.label}
                  onChange={(e) => setNewIssueForm((p) => ({ ...p, label: e.target.value }))}
                  className="border-white/10 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Volume</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newIssueForm.volume}
                    onChange={(e) => setNewIssueForm((p) => ({ ...p, volume: e.target.value }))}
                    className="border-white/10 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Issue No</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newIssueForm.issue_no}
                    onChange={(e) => setNewIssueForm((p) => ({ ...p, issue_no: e.target.value }))}
                    className="border-white/10 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Year</label>
                  <Input
                    type="number"
                    placeholder="2026"
                    value={newIssueForm.year}
                    onChange={(e) => setNewIssueForm((p) => ({ ...p, year: e.target.value }))}
                    className="border-white/10 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenRequestIssue(false);
                  setNewIssueForm({ label: "", volume: "", issue_no: "", year: "" });
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleRequestIssue}
                disabled={requestingIssue || !newIssueForm.label.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {requestingIssue ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Requesting...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />Submit Request</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
