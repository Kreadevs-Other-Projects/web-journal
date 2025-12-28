import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { FileText, Calendar, Download, Eye, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const completedReviews = [
  {
    id: "COMP-001",
    title: "Neural Network Optimization Techniques",
    abstract: "A comprehensive study of optimization techniques for deep neural networks, including gradient descent variants, regularization methods, and architecture search algorithms.",
    category: "Machine Learning",
    submittedDate: "2023-12-15",
    completedDate: "2024-01-10",
    version: "v2.1",
    decision: "accepted" as const,
    decisionDate: "2024-01-08",
    yourDecision: "accept",
    yourComments: "Excellent research with solid methodology and significant contributions to the field.",
    yourRating: 4.8,
    editorFeedback: "Paper accepted with minor formatting suggestions.",
    publishedIn: "Journal of AI Research",
    publicationDate: "2024-02-15",
    citationCount: 12,
    authors: ["Dr. Alex Chen", "Prof. Maria Rodriguez"],
    yourReviewTime: "4 days",
    keywords: ["Neural Networks", "Optimization", "Deep Learning"],
  },
  {
    id: "COMP-002",
    title: "Blockchain in Healthcare Systems",
    abstract: "Exploring blockchain technology applications in healthcare data management, patient privacy, and secure medical record sharing across institutions.",
    category: "Healthcare Technology",
    submittedDate: "2023-12-10",
    completedDate: "2024-01-05",
    version: "v1.5",
    decision: "accepted" as const,
    decisionDate: "2024-01-03",
    yourDecision: "accept",
    yourComments: "Strong concept but requires more empirical validation and clearer implementation details.",
    yourRating: 3.2,
    editorFeedback: "Major revision requested. Authors have submitted revised version.",
    authors: ["Dr. James Wilson", "Dr. Sarah Kim"],
    yourReviewTime: "3 days",
    keywords: ["Blockchain", "Healthcare", "Security", "Data Privacy"],
  },
  {
    id: "COMP-003",
    title: "Quantum Algorithms for Financial Modeling",
    abstract: "Novel quantum algorithms applied to financial risk assessment, portfolio optimization, and market prediction models.",
    category: "Quantum Computing",
    submittedDate: "2023-12-20",
    completedDate: "2024-01-18",
    version: "v1.0",
    decision: "accepted" as const,
    decisionDate: "2024-01-15",
    yourDecision: "accept",
    yourComments: "Groundbreaking work with practical applications in finance. Well-written and thoroughly researched.",
    yourRating: 4.9,
    editorFeedback: "Accepted pending minor revisions to the experimental section.",
    publishedIn: "Quantum Computing Review",
    publicationDate: "2024-03-01",
    citationCount: 8,
    authors: ["Prof. David Zhang", "Dr. Elena Petrova"],
    yourReviewTime: "5 days",
    keywords: ["Quantum Computing", "Finance", "Algorithms"],
  },
  {
    id: "COMP-004",
    title: "Sustainable Energy Storage Solutions",
    abstract: "Comparative analysis of next-generation battery technologies and their applications in renewable energy systems.",
    category: "Energy Systems",
    submittedDate: "2023-11-30",
    completedDate: "2023-12-28",
    version: "v2.3",
    decision: "accepted" as const,
    decisionDate: "2023-12-25",
    yourDecision: "accept",
    yourComments: "Lacks novelty and contains methodological flaws in the experimental design.",
    yourRating: 2.1,
    editorFeedback: "Paper rejected based on reviewer consensus. Authors may resubmit after major revisions.",
    authors: ["Dr. Robert Miller", "Dr. Lisa Chen"],
    yourReviewTime: "2 days",
    keywords: ["Energy Storage", "Batteries", "Renewable Energy"],
  },
  {
    id: "COMP-005",
    title: "AI-Driven Drug Discovery Pipeline",
    abstract: "Machine learning pipeline for rapid identification and validation of novel drug candidates for rare diseases.",
    category: "Bioinformatics",
    submittedDate: "2024-01-05",
    completedDate: "2024-01-25",
    version: "v1.2",
    decision: "accepted" as const,
    decisionDate: "2024-01-22",
    yourDecision: "accept",
    yourComments: "Impressive results with clear clinical relevance. Suggested improvements to statistical analysis.",
    yourRating: 4.5,
    editorFeedback: "Accepted after minor revisions. Currently in production.",
    publicationDate: "2024-04-10",
    authors: ["Dr. Samantha Lee", "Prof. Michael Brown", "Dr. Kevin Zhao"],
    yourReviewTime: "6 days",
    keywords: ["AI", "Drug Discovery", "Machine Learning", "Pharmaceuticals"],
  },
];

const ITEMS_PER_PAGE = 5;

export default function CompletedReview() {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(completedReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReviews = completedReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <DashboardLayout role="reviewer" userName="Dr. Michael Chen">
      <PageTransition>
        <div className="space-y-6">
          {/* Simple Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Completed Reviews
              </h1>
              <p className="text-muted-foreground">
                All papers you have reviewed
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {completedReviews.length} papers
            </div>
          </div>

          {/* Completed Reviews List - Simple */}
          <div className="space-y-4">
            {currentReviews.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No completed reviews
                </h3>
                <p className="text-muted-foreground">
                  You haven't completed any reviews yet.
                </p>
              </div>
            ) : (
              currentReviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Paper Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {review.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {review.category}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {review.version}
                            </Badge>
                            <Badge className="text-xs bg-green-500/10 text-green-700 dark:text-green-300">
                              Reviewed
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {review.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {review.abstract}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <span className="font-medium text-foreground">{review.authors.join(", ")}</span>
                            </div>
                            <div>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Completed: {new Date(review.completedDate).toLocaleDateString()}
                            </div>
                            <div>
                              <Star className="h-3 w-3 inline mr-1" />
                              Rating: {review.yourRating}/5.0
                            </div>
                            <div>
                              <Clock className="h-3 w-3 inline mr-1" />
                              Review Time: {review.yourReviewTime} days
                            </div>
                          </div>

                          {/* Keywords */}
                          <div className="flex flex-wrap gap-2">
                            {review.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:w-48 space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Your Comment:
                            </div>
                            <div className="text-sm bg-muted/50 p-3 rounded-lg line-clamp-3">
                              {review.yourComments}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              asChild
                            >
                              <Link to={`/reviewer/completed/${review.id}`}>
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-foreground border-border hover:bg-muted"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`w-10 ${currentPage === pageNum ? "bg-primary text-primary-foreground" : "text-foreground border-border hover:bg-muted"}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-10 text-foreground border-border hover:bg-muted"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="text-foreground border-border hover:bg-muted"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}