import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Download,
  PenTool,
  Shield,
  AlertCircle,
  Users,
  Link,
  X,
  Info,
  ExternalLink,
  Filter,
  ThumbsUp,
  RotateCcw,
  XCircle,
  Lock,
} from "lucide-react";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import DOMPurify from "dompurify";

interface Reviewer {
  id: string;
  username: string;
  email: string;
}

interface SubmittedReview {
  editorAssignmentId: string;
  editorAssignmentStatus: string;
  editorAssignedAt: string;

  paperId: string;
  title: string;
  paperStatus: string;

  paperVersionId: string;
  versionNumber: number;
  fileUrl: string;
  versionCreatedAt: string;

  reviewAssignmentId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewAssignmentStatus: string;
  submittedAt: string;

  reviewId: string;
  decision: string;
  comments: string;
  signatureUrl?: string;
  signedAt?: string;
}

interface ExistingDecision {
  decision: string;
  comments: string;
  decided_at: string;
}

export default function RevisionPaper() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<SubmittedReview[]>([]);
  const [viewPdf, setViewPdf] = useState<SubmittedReview | null>(null);
  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const [viewerHtmlLoading, setViewerHtmlLoading] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [openReviewers, setOpenReviewers] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string>("all");

  // Decision state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<
    "approve" | "revision" | null
  >(null);
  const [decisionComments, setDecisionComments] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [existingDecisions, setExistingDecisions] = useState<
    Record<string, ExistingDecision | null>
  >({});

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/editorAssignment/getReviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch papers",
          variant: "destructive",
        });
        return;
      }

      setReviews(data.data || []);
    } catch (err) {
      console.error("Error fetching sub-editor papers:", err);
      toast({
        title: "Error",
        description: "Something went wrong while fetching papers",
        variant: "destructive",
      });
    }
  };

  const fetchExistingDecisions = async (paperIds: string[]) => {
    const uniqueIds = [...new Set(paperIds)];
    const results: Record<string, ExistingDecision | null> = {};

    await Promise.all(
      uniqueIds.map(async (paperId) => {
        try {
          const res = await fetch(
            `${url}/subEditor/existingDecision/${paperId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await res.json();
          results[paperId] = data.data || null;
        } catch {
          results[paperId] = null;
        }
      }),
    );

    setExistingDecisions(results);
  };

  const fetchReviewers = async (paperId: string) => {
    try {
      const res = await fetch(
        `${url}/subEditor/getReviewersForPaper/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      setReviewers(data.data || []);
      setOpenReviewers(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch reviewers",
        variant: "destructive",
      });
    }
  };

  const submitDecision = async () => {
    if (!activePaperId || !pendingDecision) return;
    if (pendingDecision === "revision" && !decisionComments.trim()) {
      toast({
        title: "Comments required",
        description: `Please provide comments when requesting a revision.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirmEmail || !confirmPassword) {
      toast({
        title: "Credentials required",
        description: "Please enter your email and password to confirm.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await fetch(`${url}/subEditor/decision/${activePaperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: pendingDecision,
          comments: decisionComments,
          email: confirmEmail,
          password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit decision");

      toast({
        title: "Decision submitted",
        description:
          pendingDecision === "approve"
            ? "Paper has been approved."
            : "Revision has been requested.",
      });

      setExistingDecisions((prev) => ({
        ...prev,
        [activePaperId]: {
          decision: pendingDecision,
          comments: decisionComments,
          decided_at: new Date().toISOString(),
        },
      }));

      setDecisionModalOpen(false);
      setActivePaperId(null);
      setPendingDecision(null);
      setDecisionComments("");
      setConfirmEmail("");
      setConfirmPassword("");

      fetchPapers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const closeDecisionModal = () => {
    setDecisionModalOpen(false);
    setActivePaperId(null);
    setPendingDecision(null);
    setDecisionComments("");
    setConfirmEmail("");
    setConfirmPassword("");
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  useEffect(() => {
    if (reviews.length > 0 && token) {
      fetchExistingDecisions(reviews.map((r) => r.paperId));
    }
  }, [reviews]);

  useEffect(() => {
    setViewerHtml(null);
    if (!viewPdf?.fileUrl) return;
    const ext = viewPdf.fileUrl.split(".").pop()?.toLowerCase();
    if (ext !== "docx") return;
    setViewerHtmlLoading(true);
    const fetchHtml = async () => {
      try {
        const r = await fetch(`${url}/browse/paper/${viewPdf.paperId}/html`);
        const d = await r.json();
        if (d.success && d.html) setViewerHtml(d.html);
      } catch (_) {
      } finally {
        setViewerHtmlLoading(false);
      }
    };
    fetchHtml();
  }, [viewPdf?.paperId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "under_review":
        return <Eye className="h-4 w-4" />;
      case "pending_revision":
        return <Edit className="h-4 w-4" />;
      case "resubmitted":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_review":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "pending_revision":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "resubmitted":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "accepted":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      case "completed":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "reassigned":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredReviews = reviews.filter((review) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending")
      return review.editorAssignmentStatus === "pending";
    if (activeTab === "accepted")
      return review.editorAssignmentStatus === "accepted";
    if (activeTab === "rejected")
      return review.editorAssignmentStatus === "rejected";
    if (activeTab === "completed")
      return review.editorAssignmentStatus === "completed";
    return true;
  });

  const getCountByStatus = (status: string) => {
    return reviews.filter((review) => review.editorAssignmentStatus === status)
      .length;
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Associate Editor Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and oversee submitted paper reviews
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium">
              {reviews.length} Paper{reviews.length !== 1 ? "s" : ""} Assigned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold mt-1">
                    {
                      reviews.filter((r) => r.paperStatus === "under_review")
                        .length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Revision
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {
                      reviews.filter(
                        (r) => r.paperStatus === "pending_revision",
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Edit className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resubmitted</p>
                  <p className="text-2xl font-bold mt-1">
                    {
                      reviews.filter((r) => r.paperStatus === "resubmitted")
                        .length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Filter by Assignment Status
                  </h3>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  Showing {filteredReviews.length} of {reviews.length} papers
                </Badge>
              </div>

              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 w-full p-1">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span>All</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {reviews.length}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
                  >
                    <div className="flex items-center gap-2">
                      <span>Pending</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {getCountByStatus("pending")}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="accepted"
                    className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                  >
                    <div className="flex items-center gap-2">
                      <span>Accepted</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {getCountByStatus("accepted")}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                  >
                    <div className="flex items-center gap-2">
                      <span>Rejected</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {getCountByStatus("rejected")}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                  >
                    <div className="flex items-center gap-2">
                      <span>Completed</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {getCountByStatus("completed")}
                      </Badge>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="inline-flex p-4 rounded-full bg-muted border border-border">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          No Papers Found
                        </h3>
                        <p className="text-muted-foreground mt-2">
                          No papers with "{activeTab}" assignment status
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredReviews.map((r) => (
                        <Card
                          key={r.reviewAssignmentId}
                          className="border-border hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
                        >
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-blue-400" />
                                  <CardTitle className="text-xl font-bold line-clamp-1">
                                    {r.title}
                                  </CardTitle>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.paperStatus)} flex items-center gap-1.5`}
                                  >
                                    {getStatusIcon(r.paperStatus)}
                                    {r.paperStatus.replace("_", " ")}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getAssignmentStatusColor(r.editorAssignmentStatus)}`}
                                  >
                                    {r.editorAssignmentStatus}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(r.versionCreatedAt)}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm px-3 py-1 rounded-lg bg-muted border border-border">
                                v{r.versionNumber}
                              </span>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <PenTool className="h-4 w-4" />
                                    Paper Details
                                  </p>
                                  <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        Status:
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${getStatusColor(r.paperStatus)}`}
                                      >
                                        {r.paperStatus.replace("_", " ")}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Review Details
                                  </p>
                                  <div className="text-sm space-y-1">
                                    <p className="text-muted-foreground">
                                      Decision:{" "}
                                      <span className="text-foreground font-semibold capitalize">
                                        {r.decision || "Pending"}
                                      </span>
                                    </p>
                                    <p className="text-muted-foreground">
                                      Reviewer:{" "}
                                      <span className="text-foreground">
                                        {r.reviewerName ||
                                          (r.reviewerId
                                            ? "Assigned"
                                            : "Not assigned")}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">
                                  Review Comments
                                </p>
                                <div className="text-sm bg-muted rounded-lg p-3 border border-border">
                                  <p
                                    className={
                                      r.comments
                                        ? "line-clamp-2"
                                        : "text-muted-foreground italic"
                                    }
                                  >
                                    {r.comments || "No comments provided"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                {r.fileUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 hover:border-blue-500/50 hover:bg-blue-500/10"
                                    onClick={() => setViewPdf(r)}
                                  >
                                    <Eye className="h-4 w-4" /> View Paper
                                  </Button>
                                )}

                                {r.signatureUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                                    onClick={() => {
                                      setSelectedSignature(
                                        `${url}${r.signatureUrl}`,
                                      );
                                      setSignatureModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    View Signature
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-border">
                              {existingDecisions[r.paperId] ? (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                  <Lock className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <div className="space-y-1 min-w-0">
                                    <p className="text-sm font-semibold text-emerald-400">
                                      Decision Submitted
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Decision:{" "}
                                      <span className="font-medium capitalize text-foreground">
                                        {existingDecisions[r.paperId]!.decision}
                                      </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Submitted:{" "}
                                      {formatDate(
                                        existingDecisions[r.paperId]!
                                          .decided_at,
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground italic">
                                      A new decision can only be made after the
                                      author uploads a revised version.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => {
                                      setActivePaperId(r.paperId);
                                      setPendingDecision("approve");
                                      setDecisionModalOpen(true);
                                    }}
                                    disabled={r.paperStatus === "published"}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 gap-1.5 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                                    onClick={() => {
                                      setActivePaperId(r.paperId);
                                      setPendingDecision("revision");
                                      setDecisionModalOpen(true);
                                    }}
                                    disabled={r.paperStatus === "published"}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Revision
                                  </Button>
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full gap-2 hover:border-purple-500/50 hover:bg-purple-500/10"
                                onClick={() => fetchReviewers(r.paperId)}
                              >
                                <Users className="h-4 w-4" />
                                View Reviewers
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {viewPdf && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setViewPdf(null)}
            />

            <div className="relative h-screen w-screen flex items-center justify-center p-4">
              <div className="bg-background w-full max-w-6xl h-[90vh] rounded-xl border border-border shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 bg-muted border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {viewPdf.title || "Document Viewer"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Version {viewPdf.versionNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:border-blue-500/50 hover:bg-blue-500/10"
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
                      className="gap-2"
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
                  {(() => {
                    const ext = viewPdf.fileUrl
                      ?.split(".")
                      .pop()
                      ?.toLowerCase();
                    if (ext === "pdf") {
                      return (
                        <Worker workerUrl="/pdf.worker.min.js">
                          <Viewer
                            fileUrl={`${url}${viewPdf.fileUrl}`}
                            theme="dark"
                          />
                        </Worker>
                      );
                    }
                    if (ext === "tex" || ext === "latex") {
                      return (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                          <p className="text-sm">
                            LaTeX files cannot be previewed. Please download to
                            view.
                          </p>
                          <Button
                            onClick={() =>
                              window.open(`${url}${viewPdf.fileUrl}`, "_blank")
                            }
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Manuscript
                          </Button>
                        </div>
                      );
                    }
                    if (viewerHtmlLoading) {
                      return (
                        <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                          Loading document…
                        </div>
                      );
                    }
                    if (viewerHtml) {
                      return (
                        <div
                          className="paper-content h-full overflow-y-auto p-6 bg-white text-gray-900"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(viewerHtml),
                          }}
                        />
                      );
                    }
                    return (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                        <p className="text-sm">
                          Document preview not available.
                        </p>
                        <Button
                          onClick={() =>
                            window.open(`${url}${viewPdf.fileUrl}`, "_blank")
                          }
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-3 bg-muted border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>Document Viewer</span>
                      </div>
                      <div className="h-4 w-px bg-border" />
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
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in new tab</span>
                      </a>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        <span>Secure Document Viewer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
          <DialogContent className="max-w-md">
            <div className="flex items-center justify-between">
              <DialogTitle>Reviewer Digital Signature</DialogTitle>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-white rounded-lg hover:bg-red-500/20 hover:text-red-400"
                onClick={() => {
                  setSignatureModalOpen(false);
                  setSelectedSignature(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {selectedSignature && (
              <div className="flex justify-center mt-4 bg-muted p-4 rounded-lg border border-border">
                <img
                  src={selectedSignature}
                  alt="Reviewer Signature"
                  className="max-h-80 w-full object-contain rounded-lg border border-border"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={decisionModalOpen}
          onOpenChange={(open) => {
            if (!open) closeDecisionModal();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {pendingDecision === "approve" && (
                  <ThumbsUp className="h-5 w-5 text-emerald-400" />
                )}
                {pendingDecision === "revision" && (
                  <RotateCcw className="h-5 w-5 text-amber-400" />
                )}
                {pendingDecision === "approve"
                  ? "Approve Paper"
                  : "Request Revision"}
              </DialogTitle>
              {activePaperId && (
                <p className="text-sm text-muted-foreground">
                  {reviews.find((r) => r.paperId === activePaperId)?.title}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Comments{" "}
                  {pendingDecision === "revision" && (
                    <span className="text-red-400">*</span>
                  )}
                </Label>
                <Textarea
                  placeholder={
                    pendingDecision === "approve"
                      ? "Optional comments..."
                      : "Please provide detailed comments..."
                  }
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3 p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verify your identity
                </p>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Your account email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDecisionModal}
                disabled={submittingDecision}
              >
                Cancel
              </Button>
              <Button
                onClick={submitDecision}
                disabled={
                  submittingDecision ||
                  !confirmEmail ||
                  !confirmPassword ||
                  (pendingDecision === "revision" && !decisionComments.trim())
                }
                className={
                  pendingDecision === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : pendingDecision === "revision"
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {submittingDecision ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </div>
                ) : pendingDecision === "approve" ? (
                  "Confirm Approval"
                ) : (
                  "Request Revision"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openReviewers} onOpenChange={setOpenReviewers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Reviewers
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {reviewers.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-muted">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No reviewers assigned to this paper
                  </p>
                </div>
              ) : (
                reviewers.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border hover:border-border/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.username}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {r.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
