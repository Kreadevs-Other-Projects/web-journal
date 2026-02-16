import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  Clock,
  XCircle,
  Edit3,
  ExternalLink,
  Send,
  CheckCircle2,
  Eye,
  Filter,
  Search,
  Download,
  MoreVertical,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimationWrappers";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { motion } from "framer-motion";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  status: string;
  category?: string;
  keywords?: string[];
  created_at?: string;
  journal_title?: string;
  authors?: string[];
}

interface Journal {
  id: string;
  title: string;
}

const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    icon: Send,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  under_review: {
    label: "Under Review",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
  },
  published: {
    label: "Published",
    icon: ExternalLink,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted", icon: Send },
  { value: "under_review", label: "Under Review", icon: Clock },
  { value: "accepted", label: "Accepted", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", icon: XCircle },
  { value: "published", label: "Published", icon: ExternalLink },
];

export default function Papers() {
  const { user, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [issues, setIssues] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState("submitted");

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    category: "",
    keywords: "",
    journal_id: "",
    issue_id: "",
  });

  // Statistics
  const stats = {
    total: papers.length,
    submitted: papers.filter((p) => p.status === "submitted").length,
    under_review: papers.filter((p) => p.status === "under_review").length,
    accepted: papers.filter((p) => p.status === "accepted").length,
    rejected: papers.filter((p) => p.status === "rejected").length,
    published: papers.filter((p) => p.status === "published").length,
  };

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/author/getAuthorJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch journals");

      const data = await res.json();
      setJournals(data.journals || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load journals",
      });
    }
  };

  useEffect(() => {
    if (!form.journal_id || !token) return;

    const fetchIssues = async () => {
      try {
        const res = await fetch(
          `${url}/author/getAuthorJournalIssues/${form.journal_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load journal issues");
        }
        setIssues(data.issues || []);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Could not fetch journal issues",
        });
        setIssues([]);
      }
    };

    fetchIssues();
  }, [form.journal_id, token, toast]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const endpoint =
        user?.role === "author"
          ? "/papers/getPapersByAuthor"
          : "/papers/getAllPapers";

      const res = await fetch(`${url}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch papers");

      const data = await res.json();
      setPapers(data.papers || []);
      setFilteredPapers(data.papers || []);
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

  useEffect(() => {
    if (!isLoading && user) {
      fetchPapers();
      fetchJournals();
    }
  }, [user, isLoading]);

  useEffect(() => {
    let filtered = papers;

    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.keywords?.some((k) =>
            k.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((paper) => paper.status === statusFilter);
    }

    setFilteredPapers(filtered);
  }, [searchQuery, statusFilter, papers]);

  const submitPaper = async () => {
    try {
      const payload: any = {
        title: form.title,
        abstract: form.abstract,
        category: form.category,
        journal_id: form.journal_id,
        keywords: form.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };

      if (form.issue_id) payload.issue_id = form.issue_id;

      const res = await fetch(`${url}/papers/createPaper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
        }
      }

      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Paper Submitted",
        description: "Your paper has been submitted successfully.",
      });

      setOpen(false);
      setForm({
        title: "",
        abstract: "",
        category: "",
        keywords: "",
        journal_id: "",
        issue_id: "",
      });

      fetchPapers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submit Failed",
        description: err.message,
      });
    }
  };

  const updateStatus = async () => {
    if (!selectedPaper) return;

    try {
      const res = await fetch(
        `${url}/papers/updatePaperStatus/${selectedPaper.id}`,
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

      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Status Updated",
        description: `Paper marked as "${status}"`,
      });

      setStatusOpen(false);
      fetchPapers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update status",
      });
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const config = STATUS_CONFIG[statusValue as keyof typeof STATUS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={`${config.bgColor} ${config.borderColor} ${config.color} gap-1.5 px-3 py-1`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Unauthorized
      </div>
    );

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <PageTransition>
        <div className="space-y-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif-outfit text-3xl font-bold text-foreground">
                Research Papers
              </h1>
              <p className="text-muted-foreground">
                {user.role === "author"
                  ? "Track your submissions and manage your research papers"
                  : "Review and manage all submitted papers"}
              </p>
            </div>

            {user.role === "author" && (
              <Button
                onClick={() => setOpen(true)}
                className="btn-physics bg-gradient-primary hover:opacity-90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Submit New Paper
              </Button>
            )}
          </div>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              {
                icon: FileText,
                label: "Total Papers",
                value: stats.total,
                color: "text-primary",
                trend: "+2 this month",
              },
              {
                icon: Send,
                label: "Submitted",
                value: stats.submitted,
                color: "text-primary",
              },
              {
                icon: Clock,
                label: "Under Review",
                value: stats.under_review,
                color: "text-warning",
              },
              {
                icon: CheckCircle2,
                label: "Accepted",
                value: stats.accepted,
                color: "text-success",
              },
              {
                icon: XCircle,
                label: "Rejected",
                value: stats.rejected,
                color: "text-destructive",
              },
              {
                icon: ExternalLink,
                label: "Published",
                value: stats.published,
                color: "text-purple-500",
              },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-card p-5 hover:shadow-lg transition-shadow duration-300"
                >
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    <AnimatedCounter end={stat.value} duration={1.5} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {stat.trend && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </p>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="glass-card p-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search papers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-3 h-3" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-outfit text-xl font-semibold text-foreground">
                {user.role === "author" ? "Your Papers" : "All Papers"}
                <span className="text-sm text-muted-foreground ml-2">
                  ({filteredPapers.length} found)
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPapers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-dashed border-border/50"
              >
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No papers found
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : user.role === "author"
                        ? "Submit your first research paper to get started"
                        : "No papers have been submitted yet"}
                  </p>
                  {user.role === "author" &&
                    !searchQuery &&
                    statusFilter === "all" && (
                      <Button onClick={() => setOpen(true)}>
                        Submit Your First Paper
                      </Button>
                    )}
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredPapers.map((paper) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(paper.status)}
                              <Badge variant="secondary" className="text-xs">
                                {paper.category || "Uncategorized"}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {paper.title}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {paper.abstract}
                        </p>

                        <div className="space-y-3">
                          {paper.keywords && paper.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {paper.keywords
                                .slice(0, 3)
                                .map((keyword, index) => (
                                  <span
                                    key={index}
                                    className="text-xs px-2 py-1 bg-muted rounded-full"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              {paper.keywords.length > 3 && (
                                <span className="text-xs px-2 py-1 text-muted-foreground">
                                  +{paper.keywords.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <Separator />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span className="font-mono">
                                  ID: {paper.id.substring(0, 8)}
                                </span>
                              </div>
                              {paper.created_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      paper.created_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </Button>
                              {(user.role === "chief_editor" ||
                                user.role === "owner" ||
                                user.role === "publisher") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1"
                                  onClick={() => {
                                    setSelectedPaper(paper);
                                    setStatus(paper.status);
                                    setStatusOpen(true);
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Update
                                </Button>
                              )}
                            </div> */}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-gradient-to-b from-background to-background/95">
          <DialogHeader>
            <DialogTitle className="font-serif-outfit flex items-center gap-2 text-2xl">
              <FileText className="w-6 h-6" />
              Submit New Paper
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the details below to submit your research paper
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter paper title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Input
                    id="category"
                    placeholder="e.g., Computer Science, Physics"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-sm font-medium">
                    Keywords
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="AI, Machine Learning, Research (comma separated)"
                    value={form.keywords}
                    onChange={(e) =>
                      setForm({ ...form, keywords: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="journal" className="text-sm font-medium">
                    Journal *
                  </Label>
                  <Select
                    value={form.journal_id}
                    onValueChange={(value) =>
                      setForm({ ...form, journal_id: value })
                    }
                  >
                    <SelectTrigger id="journal" className="mt-1.5">
                      <SelectValue placeholder="Select a journal" />
                    </SelectTrigger>
                    <SelectContent>
                      {journals?.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* <div>
                  <Label htmlFor="issue" className="text-sm font-medium">
                    Journal Issue (Optional)
                  </Label>
                  <Select
                    value={form.issue_id}
                    onValueChange={(value) =>
                      setForm({ ...form, issue_id: value })
                    }
                    disabled={!form.journal_id}
                  >
                    <SelectTrigger id="issue" className="mt-1.5">
                      <SelectValue placeholder="Select an issue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific issue</SelectItem>
                      {issues?.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          Issue {issue.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
              </div>
            </div>

            <div>
              <Label htmlFor="abstract" className="text-sm font-medium">
                Abstract *
              </Label>
              <textarea
                id="abstract"
                placeholder="Enter paper abstract"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                className="w-full min-h-[140px] p-3 border rounded-lg mt-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPaper} className="gap-2 bg-gradient-primary">
              Submit Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-background to-background/95">
          <DialogHeader>
            <DialogTitle className="font-serif-outfit">
              Update Paper Status
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedPaper?.title}
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Select New Status</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STATUS_OPTIONS.map((statusItem) => {
                  const Icon = statusItem.icon;
                  return (
                    <Button
                      key={statusItem.value}
                      type="button"
                      variant={
                        status === statusItem.value ? "default" : "outline"
                      }
                      onClick={() => setStatus(statusItem.value)}
                      className="justify-start gap-3 h-auto py-4"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{statusItem.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-sm font-medium mb-2">Status Change</p>
              <div className="flex items-center gap-2">
                {selectedPaper && getStatusBadge(selectedPaper.status)}
                <span className="text-sm text-muted-foreground mx-2">→</span>
                {getStatusBadge(status)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStatus} className="bg-gradient-primary">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
