import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PageTransition } from "@/components/AnimationWrappers";
import { Search, Filter, ChevronDown, FileText, Clock, AlertTriangle, Calendar, Eye, Download, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const assignedPapers = [
  {
    id: "REV-001",
    title: "Machine Learning Applications in Climate Modeling: A Comprehensive Survey",
    abstract: "This paper provides a comprehensive review of machine learning techniques applied to climate modeling, including neural networks, ensemble methods, and deep learning approaches...",
    authors: "Anonymous (Double-Blind)",
    category: "Artificial Intelligence",
    submittedDate: "2024-01-15",
    dueDate: "2024-02-15",
    status: "pending_review" as const,
    version: "v2.0",
    priority: "high" as const,
    pdfUrl: "https://arxiv.org/pdf/2301.00001.pdf",
    reviewersCount: 2,
    currentReviewerProgress: 0,
    daysLeft: 12,
  },
  {
    id: "REV-002",
    title: "Quantum Computing Approaches to Cryptographic Security",
    abstract: "An exploration of quantum computing implications for modern cryptographic systems and proposed quantum-resistant algorithms...",
    authors: "Anonymous (Double-Blind)",
    category: "Quantum Computing",
    submittedDate: "2024-01-20",
    dueDate: "2024-02-20",
    status: "under_review" as const,
    version: "v1.0",
    priority: "medium" as const,
    pdfUrl: "https://arxiv.org/pdf/2301.00002.pdf",
    reviewersCount: 3,
    currentReviewerProgress: 65,
    daysLeft: 17,
  },
  {
    id: "REV-003",
    title: "Sustainable Urban Development Through Smart City Technologies",
    abstract: "Investigating the integration of IoT devices, AI systems, and renewable energy solutions in modern urban planning...",
    authors: "Anonymous (Double-Blind)",
    category: "Urban Planning",
    submittedDate: "2024-01-25",
    dueDate: "2024-03-01",
    status: "pending_review" as const,
    version: "v1.1",
    priority: "low" as const,
    pdfUrl: "https://arxiv.org/pdf/2301.00003.pdf",
    reviewersCount: 2,
    currentReviewerProgress: 0,
    daysLeft: 22,
  },
];

const completedReviews = [
  {
    id: "COMP-001",
    title: "Neural Network Optimization Techniques",
    decision: "accepted",
    completedDate: "2024-01-10",
    category: "Machine Learning",
    submittedDate: "2023-12-15",
    version: "v2.1",
  },
  {
    id: "COMP-002",
    title: "Blockchain in Healthcare Systems",
    decision: "revision",
    completedDate: "2024-01-05",
    category: "Healthcare Technology",
    submittedDate: "2023-12-10",
    version: "v1.5",
  },
];

const ITEMS_PER_PAGE = 5;

export default function AssignedPapers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 3) return "text-destructive";
    if (daysLeft <= 7) return "text-warning";
    return "text-success";
  };

  // Filter pending papers
  const filteredPendingPapers = assignedPapers.filter((paper) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter (only for pending tab)
    const matchesStatus = 
      statusFilter === "all" || 
      paper.status === statusFilter;
    
    // Priority filter
    const matchesPriority = 
      priorityFilter === "all" || 
      paper.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter completed reviews
  const filteredCompletedReviews = completedReviews.filter((review) => {
    return searchQuery === "" ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort pending papers
  const sortedPendingPapers = [...filteredPendingPapers].sort((a, b) => {
    if (sortBy === "due_date") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === "submission_date") {
      return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Sort completed reviews
  const sortedCompletedReviews = [...filteredCompletedReviews].sort((a, b) => {
    return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
  });

  // Pagination
  const currentPapers = activeTab === "pending" 
    ? sortedPendingPapers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
    : sortedCompletedReviews.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      );

  const totalPages = activeTab === "pending"
    ? Math.ceil(sortedPendingPapers.length / ITEMS_PER_PAGE)
    : Math.ceil(sortedCompletedReviews.length / ITEMS_PER_PAGE);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("due_date");
    setCurrentPage(1);
  };

  // Calculate stats
  const stats = {
    total: assignedPapers.length,
    pending: assignedPapers.filter(p => p.status === "pending_review").length,
    inProgress: assignedPapers.filter(p => p.status === "under_review").length,
    highPriority: assignedPapers.filter(p => p.priority === "high").length,
    dueThisWeek: assignedPapers.filter(p => p.daysLeft <= 7).length,
    completed: completedReviews.length,
  };

  return (
    <DashboardLayout role="reviewer" userName="Dr. Michael Chen">
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Assigned Papers
              </h1>
              <p className="text-muted-foreground">
                Review and manage all papers assigned to you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          {/* Tabs for Pending/Completed */}
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "pending" | "completed");
            setCurrentPage(1);
          }} className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="pending">
                Pending Reviews ({stats.pending + stats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.completed})
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters (only for pending tab) */}
            {activeTab === "pending" && (
              <div className="glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or category..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleFilterChange();
                      }}
                      className="pl-10 text-foreground bg-background border-border focus:border-primary"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <select 
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="under_review">Under Review</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <select 
                        value={priorityFilter}
                        onChange={(e) => {
                          setPriorityFilter(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Sort Filter */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <select 
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                      >
                        <option value="due_date">Due Date (Soonest)</option>
                        <option value="priority">Priority Level</option>
                        <option value="submission_date">Submission Date</option>
                        <option value="title">Title A-Z</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || sortBy !== "due_date") && (
                    <div className="sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
              <div className="text-muted-foreground">
                <p>
                  Showing {currentPapers.length} of {activeTab === "pending" ? sortedPendingPapers.length : sortedCompletedReviews.length} papers
                  {searchQuery && activeTab === "pending" && (
                    <span className="text-foreground font-medium"> for "{searchQuery}"</span>
                  )}
                </p>
              </div>
              
              {activeTab === "pending" && (
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">
                    Sorted by: <span className="text-foreground font-medium capitalize">
                      {sortBy === "due_date" ? "Due Date" : 
                        sortBy === "priority" ? "Priority" : 
                        sortBy === "submission_date" ? "Submission Date" : "Title"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Reviews Tab */}
            <TabsContent value="pending" className="space-y-4">
              {currentPapers.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No pending papers found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                      ? "No papers match your current filters."
                      : "No papers are currently pending your review."}
                  </p>
                  {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
                    <Button
                      onClick={handleClearFilters}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                currentPapers.map((paper) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="glass-card hover:shadow-glow transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Left side - Paper Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {paper.id}
                              </Badge>
                              <Badge className={cn("text-xs", getPriorityColor(paper.priority))}>
                                {paper.priority} priority
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {paper.version}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {paper.category}
                              </Badge>
                              <StatusBadge status={paper.status} />
                            </div>

                            <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                              {paper.title}
                            </h3>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {paper.abstract}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium text-foreground">{paper.authors}</span>
                              </div>
                              <div>
                                Submitted: <span className="font-medium text-foreground">
                                  {new Date(paper.submittedDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                Due: <span className="font-medium text-foreground">
                                  {new Date(paper.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                Reviewers: <span className="font-medium text-foreground">
                                  {paper.reviewersCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Actions and Progress */}
                          <div className="lg:w-72 space-y-4">
                            {/* Days Left */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Days left</span>
                              <span className={cn("text-sm font-medium", getDaysLeftColor(paper.daysLeft))}>
                                {paper.daysLeft} days
                              </span>
                            </div>

                            {/* Progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Your Progress</span>
                                <span className="font-medium text-foreground">{paper.currentReviewerProgress}%</span>
                              </div>
                              <Progress value={paper.currentReviewerProgress} className="h-2" />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                asChild
                              >
                                <Link to={`/researchPapers/${paper.id}`}>
                                  <Eye className="h-4 w-4" />
                                  View & Review
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Completed Reviews Tab */}
            <TabsContent value="completed" className="space-y-4">
              {currentPapers.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No completed reviews
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't completed any reviews yet.
                  </p>
                </div>
              ) : (
                currentPapers.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {review.id}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {review.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {review.version}
                              </Badge>
                              <Badge
                                className={cn(
                                  "text-xs",
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

                            <h3 className="font-semibold text-lg text-foreground mb-2">
                              {review.title}
                            </h3>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div>
                                Completed: <span className="font-medium text-foreground">
                                  {new Date(review.completedDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                Submitted: <span className="font-medium text-foreground">
                                  {new Date(review.submittedDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                          >
                            <Link to={`/reviewer/completed/${review.id}`}>
                              <Eye className="h-4 w-4" />
                              View Review
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}