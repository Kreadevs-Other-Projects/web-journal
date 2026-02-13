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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type StatusFilter = "all" | "accepted" | "under_review" | "published";

export default function PublisherManager() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepted");
  const [viewPdf, setViewPdf] = useState<Review | null>(null);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [openPublish, setOpenPublish] = useState(false);
  const [yearLabel, setYearLabel] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${url}/publication/getSubmittedReviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log(data);

        if (data.success) {
          const normalized = data.data.map((r: any) => ({
            ...r,
            issueId: r.issueid,
            journalId: r.journalid,
          }));
          setReviews(normalized);
          applyFilters(normalized, searchQuery, statusFilter);
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

  useEffect(() => {
    applyFilters(reviews, searchQuery, statusFilter);
  }, [searchQuery, statusFilter]);

  const applyFilters = (
    reviewsList: Review[],
    query: string,
    status: StatusFilter,
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

    setFilteredReviews(filtered);
  };

  const publishPaper = async () => {
    if (!selectedReview) return;

    try {
      setPublishing(true);

      console.log("Publishing paper:", selectedReview.paperId);

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
          }),
        },
      );

      const data = await res.json();
      console.log("Response status:", res.status);
      console.log("Response data:", data);

      if (!res.ok) throw new Error(data.message || "Failed to publish paper");

      setReviews((prev) => {
        const updated = prev.map((r) =>
          r.paperId === selectedReview.paperId
            ? { ...r, paperStatus: "published" }
            : r,
        );
        applyFilters(updated, searchQuery, statusFilter);
        return updated;
      });

      toast({
        title: "🎉 Paper Published",
        description: `"${selectedReview.title}" has been published successfully`,
      });

      setOpenPublish(false);
      setYearLabel("");
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
              Manage and publish submitted paper reviews
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredReviews.length}{" "}
              {filteredReviews.length === 1 ? "Paper" : "Papers"}
            </Badge>
          </div>
        </div>

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

              <div className="flex gap-2">
                <Tabs
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                  className="w-full"
                >
                  <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(review.paperStatus)}
                    {getDecisionBadge(review.decision)}
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
                      onClick={() => {
                        setSelectedReview(review);
                        setOpenPublish(true);
                      }}
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

            <div className="space-y-6 py-4">
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

              <div className="space-y-3">
                <label className="text-sm font-medium text-white">
                  Year Label *
                </label>
                <Input
                  placeholder="e.g., 2024-Proceedings-Vol1"
                  value={yearLabel}
                  onChange={(e) => setYearLabel(e.target.value)}
                  className="border-white/10 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400">
                  This label will be used to categorize the paper in
                  publications
                </p>
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
                onClick={publishPaper}
                disabled={publishing || !yearLabel.trim()}
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
      </div>
    </DashboardLayout>
  );
}
