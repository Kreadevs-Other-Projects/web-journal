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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Eye,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  paperId: string;
  reviewId: string;
  title: string;
  journalId: string;
  issueId: string;
  comments: string;
  decision: string;
  fileUrl: string;
  versionNumber: number;
  versionCreatedAt: string;
  paperStatus: string;
  reviewerId: string;
  reviewerName?: string;
  submittedAt: string;
}

type StatusFilter = "accepted" | "published";

export default function PublisherPapersDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepted");

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [openPublish, setOpenPublish] = useState(false);
  const [doi, setDoi] = useState("");
  const [doiLoading, setDoiLoading] = useState(false);
  const [yearLabel, setYearLabel] = useState("");
  const [publishing, setPublishing] = useState(false);

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
      } else {
        throw new Error("Failed to fetch papers");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load papers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublish = async (review: Review) => {
    setSelectedReview(review);
    setDoi("");
    setYearLabel("");
    setOpenPublish(true);

    try {
      setDoiLoading(true);
      const res = await fetch(`${url}/papers/${review.paperId}/suggest-doi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.doi) {
        setDoi(data.doi);
      }
    } catch {
      // silently fail — publisher can type manually
    } finally {
      setDoiLoading(false);
    }
  };

  const publishPaper = async () => {
    if (!selectedReview) return;
    if (!doi.trim()) {
      toast({
        title: "DOI required",
        description: "Please enter or wait for DOI to generate",
        variant: "destructive",
      });
      return;
    }
    if (!selectedReview.issueId) {
      toast({
        title: "Issue ID missing",
        description: "This paper has no issue assigned",
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
            year_label: yearLabel || undefined,
            issueId: selectedReview.issueId || undefined,
            doi: doi.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish paper");

      setReviews((prev) =>
        prev.map((r) =>
          r.paperId === selectedReview.paperId
            ? { ...r, paperStatus: "published" }
            : r,
        ),
      );
      toast({
        title: "Paper Published",
        description: `"${selectedReview.title}" published successfully`,
      });
      setOpenPublish(false);
      setSelectedReview(null);
    } catch (err: any) {
      toast({
        title: "Publish failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchReviews();
  }, [user, token]);

  const filteredReviews = reviews.filter((r) => r.paperStatus === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Publish Papers
            </h1>
            <p className="text-muted-foreground mt-1">
              Review accepted papers and publish them
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchReviews} variant="outline" size="sm">
              Refresh
            </Button>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <TabsList>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {statusFilter === "accepted"
                  ? "No accepted papers awaiting publication"
                  : "No published papers yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <Card
                key={`${review.paperId}-${review.reviewId}`}
                className="border hover:border-blue-500/50 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2 text-foreground">
                      {review.title}
                    </CardTitle>
                    {getStatusBadge(review.paperStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      Reviewer:{" "}
                      {review.reviewerName ||
                        review.reviewerId.slice(0, 12) + "..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Version {review.versionNumber}</span>
                  </div>
                  {review.decision && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>
                        Decision:{" "}
                        <span className="capitalize font-medium text-foreground">
                          {review.decision}
                        </span>
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex gap-2">
                  {review.paperStatus !== "published" ? (
                    <Button
                      size="sm"
                      className="flex-1"
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

        {/* Publish Dialog */}
        <Dialog open={openPublish} onOpenChange={setOpenPublish}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Publish Paper
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Complete the publishing process
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {selectedReview?.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>v{selectedReview?.versionNumber}</span>
                  <span>•</span>
                  <span>
                    Reviewer:{" "}
                    {selectedReview?.reviewerName ||
                      selectedReview?.reviewerId?.slice(0, 8) + "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  DOI <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Generating DOI..."
                    value={doi}
                    disabled={doiLoading}
                    onChange={(e) => setDoi(e.target.value)}
                    className={doiLoading ? "pr-10 opacity-70" : ""}
                  />
                  {doiLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {doiLoading
                    ? "Generating DOI…"
                    : "Auto-generated. You can edit if needed."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Year Label{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="e.g., 2026-Vol1"
                  value={yearLabel}
                  onChange={(e) => setYearLabel(e.target.value)}
                />
              </div>

              {selectedReview?.issueId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    Will be assigned to issue:{" "}
                    {selectedReview.issueId.slice(0, 8)}…
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-2">
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
                disabled={publishing || doiLoading}
                className="flex-1"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Publish
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
