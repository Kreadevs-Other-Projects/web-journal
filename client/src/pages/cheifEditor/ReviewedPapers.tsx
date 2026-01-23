import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { FileText, Calendar, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface SubmittedReview {
  paperId: string;
  reviewId: string;
  title: string;
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

const ITEMS_PER_PAGE = 5;

export default function ChiefEditorSubmittedReviews() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<SubmittedReview[]>([]);
  const [viewPdf, setViewPdf] = useState<SubmittedReview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [openDecision, setOpenDecision] = useState(false);
  const [selectedReview, setSelectedReview] = useState<SubmittedReview | null>(
    null,
  );
  const [decision, setDecision] = useState("accepted");
  const [decisionNote, setDecisionNote] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${url}/cheifEditor/getSubmittedReviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          const mapped = data.data.map((r: any) => ({
            paperId: r.paper_id,
            reviewId: r.review_id,
            title: r.title,
            comments: r.comments,
            decision: r.decision,
            assignmentStatus: r.assignment_status,
            fileUrl: r.file_url,
            versionNumber: r.version_number,
            versionCreatedAt: r.version_created_at,
            paperStatus: r.paper_status,
            reviewerId: r.reviewer_id,
            submittedAt: r.submitted_at,
          }));
          setReviews(mapped);
        }
      } catch (err) {
        console.error("Error fetching submitted reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageReviews = reviews.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const saveDecision = async () => {
    if (!selectedReview) return;

    try {
      const res = await fetch(
        `${url}/cheifEditor/decide/${selectedReview.paperId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision, decision_note: decisionNote }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save decision");
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.reviewId === selectedReview.reviewId
            ? { ...r, decision, paperStatus: decision }
            : r,
        ),
      );

      setOpenDecision(false);
      setSelectedReview(null);
      setDecisionNote("");
      alert("Decision saved successfully");
    } catch (err) {
      console.error(err);
      alert("Error saving decision");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role}>Loading reviews...</DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Submitted Reviews
              </h1>
              <p className="text-muted-foreground">
                All papers submitted by reviewers
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {reviews.length} reviews
            </div>
          </div>

          {currentPageReviews.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No submitted reviews
              </h3>
              <p className="text-muted-foreground">
                Reviewers have not submitted any reviews yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentPageReviews.map((review) => (
                <motion.div
                  key={review.reviewId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {review.paperId}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {review.paperStatus}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              v{review.versionNumber}
                            </Badge>
                            <Badge className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300">
                              Submitted
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {review.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {review.comments || "No comments provided"}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Submitted:{" "}
                              {new Date(
                                review.submittedAt,
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <Star className="h-3 w-3 inline mr-1" />
                              Decision: {review.decision}
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-48 space-y-4">
                          {review.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewPdf(review)}
                            >
                              <Eye className="h-4 w-4" /> View Paper
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setDecision(review.decision);
                              setOpenDecision(true);
                            }}
                          >
                            Make Decision
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {viewPdf && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-4xl h-[80vh] rounded-lg relative overflow-hidden">
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setViewPdf(null)}
                >
                  ✕
                </Button>
                <Worker workerUrl="/pdf.worker.min.js">
                  <Viewer fileUrl={`${url}${viewPdf.fileUrl}`} />
                </Worker>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(num)}
                    className={`w-10 ${currentPage === num ? "bg-primary text-primary-foreground" : "text-foreground border-border hover:bg-muted"}`}
                  >
                    {num}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          <Dialog open={openDecision} onOpenChange={setOpenDecision}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editor Decision</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <label>Decision</label>
                <select
                  className="w-full border rounded"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="pending_revision">Pending Revision</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>

                <label>Decision Note</label>
                <Input
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={saveDecision}>Save Decision</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
