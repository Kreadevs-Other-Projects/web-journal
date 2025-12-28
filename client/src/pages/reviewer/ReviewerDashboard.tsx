import { useState } from "react";
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

// Sample data
const assignedPapers = [
  {
    id: "REV-001",
    title:
      "Machine Learning Applications in Climate Modeling: A Comprehensive Survey",
    abstract:
      "This paper provides a comprehensive review of machine learning techniques applied to climate modeling, including neural networks, ensemble methods, and deep learning approaches...",
    authors: "Anonymous (Double-Blind)",
    category: "Artificial Intelligence",
    submittedDate: "2024-01-15",
    dueDate: "2024-02-15",
    status: "pending_review" as const,
    version: "v2.0",
    priority: "high",
    pdfUrl: "https://arxiv.org/pdf/2301.00001.pdf",
  },
  {
    id: "REV-002",
    title: "Quantum Computing Approaches to Cryptographic Security",
    abstract:
      "An exploration of quantum computing implications for modern cryptographic systems and proposed quantum-resistant algorithms...",
    authors: "Anonymous (Double-Blind)",
    category: "Quantum Computing",
    submittedDate: "2024-01-20",
    dueDate: "2024-02-20",
    status: "under_review" as const,
    version: "v1.0",
    priority: "medium",
    pdfUrl: "https://arxiv.org/pdf/2301.00002.pdf",
  },
  {
    id: "REV-003",
    title: "Sustainable Urban Development Through Smart City Technologies",
    abstract:
      "Investigating the integration of IoT devices, AI systems, and renewable energy solutions in modern urban planning...",
    authors: "Anonymous (Double-Blind)",
    category: "Urban Planning",
    submittedDate: "2024-01-25",
    dueDate: "2024-03-01",
    status: "pending_review" as const,
    version: "v1.1",
    priority: "low",
    pdfUrl: "https://arxiv.org/pdf/2301.00003.pdf",
  },
];

const completedReviews = [
  {
    id: "COMP-001",
    title: "Neural Network Optimization Techniques",
    decision: "accepted",
    completedDate: "2024-01-10",
  },
  {
    id: "COMP-002",
    title: "Blockchain in Healthcare Systems",
    decision: "revision",
    completedDate: "2024-01-05",
  },
];

const reviewCriteria = [
  {
    id: "originality",
    label: "Originality",
    description: "Novel contribution to the field",
  },
  {
    id: "methodology",
    label: "Methodology",
    description: "Sound research methods",
  },
  {
    id: "clarity",
    label: "Clarity",
    description: "Well-written and organized",
  },
  {
    id: "significance",
    label: "Significance",
    description: "Impact on the field",
  },
  {
    id: "references",
    label: "References",
    description: "Appropriate citations",
  },
];

export default function ReviewerDashboard() {
  const [selectedPaper, setSelectedPaper] = useState<
    (typeof assignedPapers)[0] | null
  >(null);
  const [decision, setDecision] = useState<string>("");
  const [comments, setComments] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  const handleSubmitReview = () => {
    if (decision === "accept" || decision === "reject") {
      setSignatureModalOpen(true);
    } else {
      // For revision decisions, submit directly
      console.log("Review submitted:", {
        decision,
        comments,
        confidentialComments,
        ratings,
      });
      setSelectedPaper(null);
      setDecision("");
      setComments("");
      setConfidentialComments("");
      setRatings({});
    }
  };

  const handleSignatureConfirm = (signature: string, password: string) => {
    console.log("Final decision confirmed:", { signature, password, decision });
    setSignatureModalOpen(false);
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
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  return (
    <DashboardLayout role="reviewer" userName="Dr. Michael Chen">
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="review-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedPaper(null)}
                className="h-10 w-10 p-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-serif-outfit text-2xl font-bold">
                  {selectedPaper.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedPaper.category}</Badge>
                  <Badge variant="secondary">{selectedPaper.version}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(selectedPaper.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* PDF Viewer */}
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
                      <Button variant="ghost" size="sm">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    <iframe
                      src={`${selectedPaper.pdfUrl}#view=FitH`}
                      className="w-full h-full border-0"
                      style={{
                        transform: `scale(${pdfZoom / 100})`,
                        transformOrigin: "top center",
                      }}
                      title="Paper PDF"
                    />
                    {/* Fallback display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 opacity-0 hover:opacity-100 transition-opacity">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">PDF Preview</p>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Form */}
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
                      {/* Abstract */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Abstract</Label>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                          {selectedPaper.abstract}
                        </p>
                      </div>

                      {/* Rating Criteria */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">
                          Rating Criteria
                        </Label>
                        {reviewCriteria.map((criterion) => (
                          <div key={criterion.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {criterion.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {criterion.description}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <motion.button
                                    key={star}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      setRatings({
                                        ...ratings,
                                        [criterion.id]: star,
                                      })
                                    }
                                    className="p-1"
                                  >
                                    <Star
                                      className={cn(
                                        "h-5 w-5 transition-colors",
                                        star <= (ratings[criterion.id] || 0)
                                          ? "fill-accent text-accent"
                                          : "text-muted-foreground/30"
                                      )}
                                    />
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comments for Authors */}
                      <div className="space-y-2">
                        <Label htmlFor="comments">Comments for Authors</Label>
                        <Textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide detailed feedback for the authors..."
                          className="min-h-[150px] input-glow"
                        />
                      </div>

                      {/* Confidential Comments */}
                      <div className="space-y-2">
                        <Label htmlFor="confidential">
                          Confidential Comments for Editors
                          <span className="text-muted-foreground ml-1">
                            (optional)
                          </span>
                        </Label>
                        <Textarea
                          id="confidential"
                          value={confidentialComments}
                          onChange={(e) =>
                            setConfidentialComments(e.target.value)
                          }
                          placeholder="Comments visible only to editors..."
                          className="min-h-[100px] input-glow"
                        />
                      </div>

                      {/* Decision */}
                      <div className="space-y-3">
                        <Label>Your Decision</Label>
                        <RadioGroup
                          value={decision}
                          onValueChange={setDecision}
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === "accept"
                                ? "border-success bg-success/10"
                                : "border-border hover:border-success/50"
                            )}
                            onClick={() => setDecision("accept")}
                          >
                            <RadioGroupItem value="accept" id="accept" />
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
                                : "border-border hover:border-info/50"
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
                                : "border-border hover:border-warning/50"
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
                              decision === "reject"
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-destructive/50"
                            )}
                            onClick={() => setDecision("reject")}
                          >
                            <RadioGroupItem value="reject" id="reject" />
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

                      {/* Submit Button */}
                      <Button
                        onClick={handleSubmitReview}
                        disabled={!decision || !comments}
                        className="w-full btn-physics"
                        size="lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Review
                        {(decision === "accept" || decision === "reject") &&
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
            {/* Header */}
            <div>
              <h1 className="font-serif-outfit-outfit text-3xl font-bold">
                Reviewer Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review assigned papers and submit your evaluations
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Pending Reviews",
                  value: assignedPapers.length,
                  icon: Clock,
                  color: "text-warning",
                },
                {
                  label: "Completed",
                  value: completedReviews.length,
                  icon: CheckCircle2,
                  color: "text-success",
                },
                {
                  label: "Overdue",
                  value: 0,
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
                            stat.color
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

            {/* Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="pending">
                  Pending Reviews ({assignedPapers.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedReviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {assignedPapers.map((paper, index) => {
                  const daysLeft = getDaysUntilDue(paper.dueDate);
                  return (
                    <motion.div
                      key={paper.id}
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
                                  {paper.id}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    getPriorityColor(paper.priority)
                                  )}
                                >
                                  {paper.priority} priority
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
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
                                <span className="text-muted-foreground">
                                  Submitted:{" "}
                                  {new Date(
                                    paper.submittedDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <div
                                className={cn(
                                  "text-sm font-medium px-3 py-1 rounded-full",
                                  daysLeft <= 3
                                    ? "bg-destructive/10 text-destructive"
                                    : daysLeft <= 7
                                    ? "bg-warning/10 text-warning"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {daysLeft} days left
                              </div>

                              <StatusBadge status={paper.status} />

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
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{review.id}</Badge>
                            </div>
                            <h3 className="font-serif-outfit text-lg font-semibold">
                              {review.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Completed:{" "}
                              {new Date(
                                review.completedDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              review.decision === "accepted"
                                ? "bg-success/10 text-success"
                                : review.decision === "revision"
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
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
        decision={decision === "accept" ? "accept" : "reject"}
      />
    </DashboardLayout>
  );
}
