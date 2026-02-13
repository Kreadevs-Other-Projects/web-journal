import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SignatureModal } from "@/components/SignatureModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronRight,
  Eye,
  Send,
  Star,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  updated_at: any;
  review_submitted_at: any;
  paper_id: string;
  paper_version_id: string;
  title: string;
  paper_status: string;
  assignment_status: string;
  file_url: string;
  version?: string;
  version_number?: number;
  abstract?: string;
  category?: string;
  submittedDate?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
}

interface CompletedReview {
  paper_id: string;
  paper_version_id: string;
  title: string;
  decision: string;
  completedDate: string;
}

export default function ReviewerDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [completedReviews, setCompletedReviews] = useState<CompletedReview[]>(
    [],
  );
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [decision, setDecision] = useState<string>("");
  const [comments, setComments] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  const fetchPapers = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${url}/reviewer/getReviewerPapers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      console.log(result.papers);

      if (!res.ok) {
        console.error("Failed to fetch papers:", result.message || result);
        return;
      }

      const allPapers: Paper[] = result.papers || [];

      const pending = allPapers.filter(
        (paper) => paper.assignment_status === "assigned",
      );

      const formattedPending: Paper[] = pending.map((paper) => ({
        ...paper,
        abstract: paper.abstract || "Abstract not available",
        category: paper.category || "Uncategorized",
        submittedDate:
          paper.submittedDate || new Date().toISOString().split("T")[0],
        dueDate:
          paper.dueDate ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        version: paper.version_number ? `v${paper.version_number}` : "v1",
        priority: paper.priority || "medium",
      }));

      const completed: CompletedReview[] = allPapers
        .filter((paper) =>
          ["submitted", "accepted", "rejected"].includes(
            paper.assignment_status,
          ),
        )
        .map((paper) => ({
          paper_id: paper.paper_id,
          paper_version_id: paper.paper_version_id,
          title: paper.title,
          decision: paper.assignment_status as
            | "submitted"
            | "accepted"
            | "rejected",
          completedDate:
            paper.review_submitted_at ||
            paper.updated_at ||
            new Date().toISOString().split("T")[0],
        }));

      setPapers(formattedPending);
      setCompletedReviews(completed);
    } catch (error) {
      console.error("Error fetching reviewer papers:", error);
      toast({
        title: "Error",
        description: "Could not fetch papers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const submitReview = async () => {
    if (!selectedPaper || !decision || !comments.trim()) {
      toast({
        title: "Incomplete",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (decision === "accepted" || decision === "rejected") {
      setSignatureModalOpen(true);
    } else {
      await handleReviewSubmission();
    }
  };

  const handleReviewSubmission = async (
    signature?: string,
    password?: string,
  ) => {
    if (!selectedPaper) return;

    try {
      const formData = new FormData();

      formData.append("decision", decision);
      formData.append("comments", comments);
      formData.append("confidentialComments", confidentialComments);

      if (decision === "accepted" || decision === "rejected") {
        if (!signature || !password) {
          toast({
            title: "Error",
            description: "Signature and password required",
            variant: "destructive",
          });
          return;
        }

        const signatureFile = base64ToFile(signature, "signature.png");

        formData.append("signature", signatureFile);
        formData.append("password", password);
      }

      const res = await fetch(
        `${url}/reviewer/submitReview/${selectedPaper.paper_version_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      if (!data.success) {
        if (data.errors && data.errors.length) {
          data.errors.forEach((err: any) => {
            toast({
              title: `Error in ${err.field.replace("body.", "")}`,
              description: err.message,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
        return;
      }

      if (!res.ok) {
        toast({
          title: "Failed",
          description: data.message || "Could not submit review",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      resetForm();
      fetchPapers();
    } catch (err) {
      console.error("Submit review error:", err);
      toast({
        title: "Error",
        description: "Something went wrong while submitting review",
        variant: "destructive",
      });
    }
  };

  const handleSignatureConfirm = (signature: string, password: string) => {
    handleReviewSubmission(signature, password);
    setSignatureModalOpen(false);
  };

  const resetForm = () => {
    setSelectedPaper(null);
    setDecision("");
    setComments("");
    setConfidentialComments("");
    setRatings({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive bg-destructive/10";
      case "medium":
        return "text-warning bg-warning/10";
      case "low":
        return "text-success bg-success/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "under_review":
        return "under_review";
      case "pending_review":
        return "pending_review";
      case "review_submitted":
        return "review_submitted";
      default:
        return "pending_review";
    }
  };

  const getCompletedCount = () => completedReviews.length;

  const getPendingCount = () => papers.length;

  const getOverdueCount = () => {
    return papers.filter((p) => {
      if (!p.dueDate) return false;
      const daysLeft = getDaysUntilDue(p.dueDate);
      return daysLeft < 0 && p.assignment_status !== "completed";
    }).length;
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="review-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={resetForm}
                className="h-10 w-10 p-0 bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-serif-outfit text-2xl font-bold text-white">
                  {selectedPaper.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedPaper.category}</Badge>
                  <Badge variant="secondary">{selectedPaper.version}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedPaper.dueDate &&
                      `Due: ${new Date(selectedPaper.dueDate).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Paper Document
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground w-12 text-center">
                        {pdfZoom}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfZoom(100)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${url}${selectedPaper.file_url}`,
                            "_blank",
                          )
                        }
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${url}${selectedPaper.file_url}`,
                            "_blank",
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `${url}${selectedPaper.file_url}`;
                          link.download = `${selectedPaper.title}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    <iframe
                      src={`${url}${selectedPaper.file_url}#view=FitH`}
                      className="w-full h-full border-0"
                      style={{
                        transform: `scale(${pdfZoom / 100})`,
                        transformOrigin: "top center",
                      }}
                      title="Paper PDF"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-primary" />
                    Submit Review
                  </CardTitle>
                  <CardDescription>
                    Evaluate the paper based on the criteria below
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Abstract</Label>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                          {selectedPaper.abstract}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comments">Comments for Authors *</Label>
                        <Textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide detailed feedback for the authors..."
                          className="min-h-[150px] input-glow"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Your Decision *</Label>
                        <RadioGroup
                          value={decision}
                          onValueChange={setDecision}
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === "accepted"
                                ? "border-success bg-success/10"
                                : "border-border hover:border-success/50",
                            )}
                            onClick={() => setDecision("accepted")}
                          >
                            <RadioGroupItem value="accepted" id="accept" />
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <div className="flex-1">
                              <Label
                                htmlFor="accept"
                                className="cursor-pointer font-medium"
                              >
                                Accept
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Paper is ready for publication
                              </p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === "minor_revision"
                                ? "border-info bg-info/10"
                                : "border-border hover:border-info/50",
                            )}
                            onClick={() => setDecision("minor_revision")}
                          >
                            <RadioGroupItem value="minor_revision" id="minor" />
                            <Edit3 className="h-5 w-5 text-info" />
                            <div className="flex-1">
                              <Label
                                htmlFor="minor"
                                className="cursor-pointer font-medium"
                              >
                                Minor Revision
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Small changes needed
                              </p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === "major_revision"
                                ? "border-warning bg-warning/10"
                                : "border-border hover:border-warning/50",
                            )}
                            onClick={() => setDecision("major_revision")}
                          >
                            <RadioGroupItem value="major_revision" id="major" />
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            <div className="flex-1">
                              <Label
                                htmlFor="major"
                                className="cursor-pointer font-medium"
                              >
                                Major Revision
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Significant changes required
                              </p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === "rejected"
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-destructive/50",
                            )}
                            onClick={() => setDecision("rejected")}
                          >
                            <RadioGroupItem value="rejected" id="reject" />
                            <XCircle className="h-5 w-5 text-destructive" />
                            <div className="flex-1">
                              <Label
                                htmlFor="reject"
                                className="cursor-pointer font-medium"
                              >
                                Reject
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Paper does not meet standards
                              </p>
                            </div>
                          </motion.div>
                        </RadioGroup>
                      </div>

                      <Button
                        onClick={submitReview}
                        disabled={!decision || !comments.trim()}
                        className="w-full btn-physics"
                        size="lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Review
                        {(decision === "accepted" || decision === "rejected") &&
                          " (Requires Signature)"}
                      </Button>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-serif-outfit text-3xl font-bold text-white">
                Reviewer Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review assigned papers and submit your evaluations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Pending Reviews",
                  value: getPendingCount(),
                  icon: Clock,
                  color: "text-warning",
                },
                {
                  label: "Completed",
                  value: getCompletedCount(),
                  icon: CheckCircle2,
                  color: "text-success",
                },
                {
                  label: "Overdue",
                  value: getOverdueCount(),
                  icon: AlertTriangle,
                  color: "text-destructive",
                },
                {
                  label: "Avg Response Time",
                  value: "4.2 days",
                  icon: Calendar,
                  color: "text-info",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50",
                            stat.color,
                          )}
                        >
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="pending">
                  Pending Reviews ({getPendingCount()})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({getCompletedCount()})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {papers
                  .filter((p) => p.assignment_status !== "completed")
                  .map((paper, index) => {
                    const daysLeft = paper.dueDate
                      ? getDaysUntilDue(paper.dueDate)
                      : 14;
                    return (
                      <motion.div
                        key={paper.paper_version_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-card hover:shadow-glow transition-all duration-300 cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {paper.paper_id}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      getPriorityColor(
                                        paper.priority || "medium",
                                      ),
                                    )}
                                  >
                                    {paper.priority} priority
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {paper.version}
                                  </Badge>
                                </div>

                                <h3 className="font-serif-outfit text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                  {paper.title}
                                </h3>

                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {paper.abstract}
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    <span className="text-foreground font-medium">
                                      {paper.category}
                                    </span>
                                  </span>
                                  {paper.submittedDate && (
                                    <span className="text-muted-foreground">
                                      Submitted:{" "}
                                      {new Date(
                                        paper.submittedDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                {paper.dueDate && (
                                  <div
                                    className={cn(
                                      "text-sm font-medium px-3 py-1 rounded-full",
                                      daysLeft <= 3
                                        ? "bg-destructive/10 text-destructive"
                                        : daysLeft <= 7
                                          ? "bg-warning/10 text-warning"
                                          : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {daysLeft} days left
                                  </div>
                                )}

                                {/* <StatusBadge
                                  // status={getStatusBadge(paper.paper_status)}
                                /> */}

                                <Button
                                  onClick={() => setSelectedPaper(paper)}
                                  className="btn-physics"
                                >
                                  Start Review
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">
                                  Review Progress
                                </span>
                                <span className="font-medium">0%</span>
                              </div>
                              <Progress value={0} className="h-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedReviews.map((review, index) => (
                  <motion.div
                    key={review.paper_version_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{review.paper_id}</Badge>
                            </div>
                            <h3 className="font-serif-outfit text-lg font-semibold">
                              {review.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Completed:{" "}
                              {new Date(
                                review.completedDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              review.decision === "accepted" ||
                                review.decision === "accept"
                                ? "bg-success/10 text-success"
                                : review.decision.includes("revision")
                                  ? "bg-warning/10 text-warning"
                                  : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {review.decision}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        paperTitle={selectedPaper?.title || ""}
        decision={decision === "accepted" ? "accept" : "reject"}
      />
    </DashboardLayout>
  );
}
