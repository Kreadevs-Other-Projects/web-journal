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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  TrendingUp,
  Hash,
  Link,
  X,
  Info,
  ExternalLink,
  Filter,
} from "lucide-react";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

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
  reviewAssignmentStatus: string;
  submittedAt: string;

  reviewId: string;
  decision: string;
  comments: string;
  signatureUrl?: string;
  signedAt?: string;
}

export default function RevisionPaper() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<SubmittedReview[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<SubmittedReview | null>(
    null,
  );
  const [viewPdf, setViewPdf] = useState<SubmittedReview | null>(null);
  const [status, setStatus] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<string>("");
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [openReviewers, setOpenReviewers] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

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

      console.log("Fetched reviews:", data.data);
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

  const updateAssignmentStatus = async (
    editorAssignmentId: string,
    status: string,
  ) => {
    try {
      const res = await fetch(
        `${url}/editorAssignment/handleAssignmentStatus/${editorAssignmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to update assignment");

      toast({
        title: "Success",
        description: `Assignment status updated to "${status}"`,
        variant: "default",
      });

      fetchPapers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

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
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending_revision":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "resubmitted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "reassigned":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Sub Editor Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Manage and oversee submitted paper reviews
            </p>
          </div>
          <div className="flex text-white items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
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
                  <p className="text-sm text-gray-400">Under Review</p>
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
                  <p className="text-sm text-gray-400">Pending Revision</p>
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
                  <p className="text-sm text-gray-400">Resubmitted</p>
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

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-300">
                    Filter by Assignment Status
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-gray-400 border-white/20"
                >
                  Showing {filteredReviews.length} of {reviews.length} papers
                </Badge>
              </div>

              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 w-full bg-white/5 border border-white/10 p-1">
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
                      <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10">
                        <AlertCircle className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-300">
                          No Papers Found
                        </h3>
                        <p className="text-gray-400 mt-2">
                          No papers with "{activeTab}" assignment status
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredReviews.map((r) => (
                        <Card
                          key={r.reviewAssignmentId}
                          className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
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
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(r.versionCreatedAt)}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                                v{r.versionNumber}
                              </span>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <PenTool className="h-4 w-4" />
                                    Paper Details
                                  </p>
                                  <div className="text-sm space-y-1">
                                    <p className="text-gray-400">
                                      ID:{" "}
                                      <span className="text-gray-300 font-mono">
                                        {r.paperId.slice(0, 8)}...
                                      </span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-400">
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
                                  <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Review Details
                                  </p>
                                  <div className="text-sm space-y-1">
                                    <p className="text-gray-400">
                                      Decision:{" "}
                                      <span className="text-gray-300 font-semibold capitalize">
                                        {r.decision || "Pending"}
                                      </span>
                                    </p>
                                    <p className="text-gray-400">
                                      Reviewer:{" "}
                                      <span className="text-gray-300">
                                        {r.reviewerId
                                          ? r.reviewerId.slice(0, 8) + "..."
                                          : "Not assigned"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {r.comments && (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-300">
                                    Review Comments
                                  </p>
                                  <div className="text-sm bg-black/20 rounded-lg p-3 border border-white/5">
                                    <p className="text-gray-300 line-clamp-2">
                                      {r.comments}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2">
                                {r.fileUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-white/20 hover:border-blue-500/50 hover:bg-blue-500/10"
                                    onClick={() => setViewPdf(r)}
                                  >
                                    <Eye className="h-4 w-4" /> View Paper
                                  </Button>
                                )}

                                {r.signatureUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                                    onClick={() =>
                                      window.open(r.signatureUrl, "_blank")
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    View Signature
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/10">
                              <Button
                                size="sm"
                                variant="default"
                                className={`flex-1 gap-2 ${r.paperStatus === "published" ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => {
                                  setSelectedPaper(r);
                                  setAssignmentStatus(r.editorAssignmentStatus);
                                }}
                                disabled={r.paperStatus === "published"}
                              >
                                <Edit className="h-4 w-4" />
                                Update Assignment Status
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10"
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

        {selectedPaper && (
          <Dialog
            open={!!selectedPaper}
            onOpenChange={() => setSelectedPaper(null)}
          >
            <DialogContent className="bg-gray-900 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Update Paper Status
                </DialogTitle>
                <p className="text-sm text-gray-400">
                  Update status for:{" "}
                  <span className="text-gray-300 font-medium">
                    {selectedPaper.title}
                  </span>
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Current Status</Label>
                  <div
                    className={`px-3 py-2 rounded border ${getStatusColor(selectedPaper.paperStatus)} text-sm`}
                  >
                    {selectedPaper.paperStatus.replace("_", " ")}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Assignment Status</Label>
                  <select
                    className="w-full bg-black/30 border-white/20 rounded-lg px-3 py-2 text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={assignmentStatus}
                    onChange={(e) => setAssignmentStatus(e.target.value)}
                  >
                    <option value="pending" disabled>
                      Pending
                    </option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="reassigned">Reassigned</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPaper(null)}
                  className="border-white/20 hover:border-white/40"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPaper && assignmentStatus) {
                      updateAssignmentStatus(
                        selectedPaper.editorAssignmentId,
                        assignmentStatus,
                      );
                      setSelectedPaper(null);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={openReviewers} onOpenChange={setOpenReviewers}>
          <DialogContent className="bg-gray-900 border-white/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-white font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Reviewers
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {reviewers.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-white/5">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400">
                    No reviewers assigned to this paper
                  </p>
                </div>
              ) : (
                reviewers.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-300 truncate">
                        {r.username}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {r.email}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300 font-mono">
                      {r.id.slice(0, 6)}...
                    </span>
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
