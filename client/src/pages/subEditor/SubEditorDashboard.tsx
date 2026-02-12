import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  ArrowLeft,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  UserCheck,
  MessageSquare,
  FileEdit,
  Send,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

import { useToast } from "@/hooks/use-toast";

interface PaperVersion {
  id: string;
  file_url: string;
  version_label?: string;
  version_number: number;
  created_at?: string;
}

interface Paper {
  id: string;
  title: string;
  status: string;
  abstract?: string;
  authors?: string[];
  category?: string;
  submitted_at?: string;
  deadline?: string;
  versions: PaperVersion[];
}

interface Reviewer {
  id: string;
  username: string;
  email: string;
  expertise?: string[];
}

interface Review {
  id: string;
  reviewerName: string;
  status: string;
  submittedDate?: string;
}

export default function SubEditorDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState("");
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [allReviewers, setAllReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<PaperVersion | null>(
    null,
  );
  const [assignLoading, setAssignLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [openReviewersDialog, setOpenReviewersDialog] = useState(false);
  const [openAssignReviewerDialog, setOpenAssignReviewerDialog] =
    useState(false);
  const [openPaperStats, setOpenPaperStats] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    pendingRevision: 0,
    completed: 0,
  });

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/subEditor/getSubEditorPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log(data.papers);

      setPapers(data.papers);
      setFilteredPapers(data.papers);

      const underReview = data.papers.filter(
        (p) => p.status === "under_review",
      ).length;
      const pendingRevision = data.papers.filter(
        (p) => p.status === "pending_revision",
      ).length;
      const completed = data.papers.filter(
        (p) => p.status === "resubmitted" || p.status === "completed",
      ).length;

      setStats({
        total: data.papers.length,
        underReview,
        pendingRevision,
        completed,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load papers.",
        variant: "destructive",
      });
    }
  };

  const fetchAllReviewers = async () => {
    try {
      const res = await fetch(`${url}/subEditor/fetchReviewer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllReviewers(data.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load reviewers list.",
        variant: "destructive",
      });
    }
  };

  const assignReviewer = async () => {
    if (!selectedPaper || !selectedReviewerId) {
      toast({
        title: "Missing data",
        description: "Please select a reviewer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssignLoading(true);

      await fetch(`${url}/subEditor/assignReviewer/${selectedPaper.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewerId: selectedReviewerId }),
      });

      toast({
        title: "Reviewer Assigned",
        description: "Reviewer assigned successfully.",
      });

      setSelectedReviewerId("");
      setOpenAssignReviewerDialog(false);
      fetchReviewers(selectedPaper.id);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to assign reviewer.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
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
      setOpenReviewersDialog(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load reviewers.",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async () => {
    if (!selectedPaper || !status) {
      toast({
        title: "Invalid action",
        description: "Please select a status before updating.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(
        `${url}/subEditor/updateSubEditorPaperStatus/${selectedPaper.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update status");
      }

      setSelectedPaper(null);
      fetchPapers();

      toast({
        title: "Status Updated",
        description: `Paper status changed to "${status}".`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const inviteReviewerByEmail = async () => {
    if (!reviewerEmail) return;

    try {
      setInviteLoading(true);

      const res = await fetch(`${url}/subEditor/inviteReviewer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: reviewerEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Invitation Sent",
        description: `Reviewer invited successfully to ${reviewerEmail}`,
      });

      setReviewerEmail("");
      fetchAllReviewers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Invitation Failed",
        description:
          err instanceof Error ? err.message : "Could not invite reviewer",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPapers();
      fetchAllReviewers();
    }
  }, [token]);

  useEffect(() => {
    let filtered = papers;

    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.authors?.some((author) =>
            author.toLowerCase().includes(searchQuery.toLowerCase()),
          ) ||
          paper.abstract?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeTab !== "all") {
      const statusMap: Record<string, string> = {
        under_review: "under_review",
        pending_revision: "pending_revision",
        completed: "resubmitted",
      };
      filtered = filtered.filter(
        (paper) => paper.status === statusMap[activeTab],
      );
    }

    setFilteredPapers(filtered);
  }, [searchQuery, activeTab, papers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pending_revision":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "resubmitted":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "pending_revision":
        return <AlertCircle className="h-4 w-4" />;
      case "resubmitted":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedPaper(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Paper Review
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Managing: {selectedPaper.title}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenPaperStats(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Stats
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border-0 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {selectedPaper.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getStatusColor(selectedPaper.status)}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(selectedPaper.status)}
                                {selectedPaper.status.replace("_", " ")}
                              </span>
                            </Badge>
                            <span>•</span>
                            <span>
                              Version {selectedVersion?.version_number}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(selectedPaper.submitted_at)}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Select
                        value={selectedVersion?.id}
                        onValueChange={(versionId) => {
                          const v = selectedPaper?.versions.find(
                            (v) => v.id === versionId,
                          );
                          if (v) setSelectedVersion(v);
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>

                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                          {selectedPaper?.versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              Version {v.version_number}
                              {v.version_label ? ` – ${v.version_label}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${url}${selectedVersion?.file_url}`,
                            "_blank",
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preview">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="abstract">
                          <FileEdit className="h-4 w-4 mr-2" />
                          Abstract
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="mt-4">
                        <div className="rounded-lg overflow-hidden border border-white/10">
                          <iframe
                            src={`${url}${selectedVersion?.file_url}`}
                            className="w-full h-[600px]"
                            title="Paper Preview"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="abstract" className="mt-4">
                        <div className="rounded-lg border border-white/10 p-4 bg-white/5">
                          <p className="text-sm leading-relaxed">
                            {selectedPaper.abstract ||
                              "No abstract available for this paper."}
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-0 bg-gradient-to-br from-blue-900/20 to-blue-800/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-400" />
                      Update Status
                    </CardTitle>
                    <CardDescription>
                      Change the paper workflow status
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2">
                        Current Status
                      </Label>
                      <Badge
                        className={cn(
                          "w-full justify-center py-2",
                          getStatusColor(selectedPaper.status),
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {getStatusIcon(selectedPaper.status)}
                          {selectedPaper.status.replace("_", " ").toUpperCase()}
                        </span>
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2">
                        New Status
                      </Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem
                            value="under_review"
                            className="hover:bg-white/10"
                          >
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Under Review
                            </span>
                          </SelectItem>
                          <SelectItem
                            value="pending_revision"
                            className="hover:bg-white/10"
                          >
                            <span className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Pending Revision
                            </span>
                          </SelectItem>
                          <SelectItem
                            value="resubmitted"
                            className="hover:bg-white/10"
                          >
                            <span className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Resubmitted
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={updateStatus}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={!status}
                    >
                      Update Status
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 bg-gradient-to-br from-purple-900/20 to-purple-800/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Reviewer Management
                    </CardTitle>
                    <CardDescription>
                      Assign and manage reviewers
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => fetchReviewers(selectedPaper.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Assigned Reviewers ({reviewers.length})
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => setOpenAssignReviewerDialog(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign New Reviewer
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() =>
                        window.open(
                          `${url}${selectedVersion?.file_url}`,
                          "_blank",
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open Fullscreen PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 bg-gradient-to-br from-gray-900/30 to-gray-800/20">
                  <CardHeader>
                    <CardTitle className="text-sm">Paper Information</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedPaper.category || "General"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authors:</span>
                      <span className="text-right">
                        {selectedPaper.authors?.join(", ") || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{formatDate(selectedPaper.deadline)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Sub-Editor Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Manage assigned papers and review progress
                  </p>
                </div>
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {stats.total} Papers
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card border-0 bg-gradient-to-br from-blue-900/30 to-blue-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Papers
                      </p>
                      <p className="text-2xl font-bold mt-2">{stats.total}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-amber-900/30 to-amber-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Under Review
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.underReview}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-purple-900/30 to-purple-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Revision
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.pendingRevision}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-green-900/30 to-green-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Completed
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.completed}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search papers by title, author, or abstract..."
                      className="pl-10 bg-white/5 border-white/10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={activeTab === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("all")}
                    >
                      All Papers
                    </Button>
                    <Button
                      variant={
                        activeTab === "under_review" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveTab("under_review")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Under Review
                    </Button>
                    <Button
                      variant={
                        activeTab === "pending_revision" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveTab("pending_revision")}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Pending Revision
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredPapers.length === 0 ? (
              <Card className="glass-card border-0">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No papers found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No papers match your search criteria"
                      : "You have no assigned papers at the moment"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPapers.map((paper, i) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="glass-card hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer group border-0 hover:bg-gradient-to-br hover:from-gray-900/50 hover:to-gray-800/30 transition-all duration-300"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setSelectedVersion(paper.versions[0]);
                        fetchAllReviewers();
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <Badge className={getStatusColor(paper.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(paper.status)}
                              {paper.status.replace("_", " ")}
                            </span>
                          </Badge>
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                        </div>

                        <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                          {paper.title}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {paper.abstract || "No abstract available"}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Submitted
                            </span>
                            <span>{formatDate(paper.submitted_at)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Latest Version
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {paper.versions?.[0]?.version_number}
                            </Badge>
                          </div>

                          {paper.authors && (
                            <div className="pt-2 border-t border-white/10">
                              <p className="text-xs text-muted-foreground truncate">
                                Authors: {paper.authors.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={openReviewersDialog} onOpenChange={setOpenReviewersDialog}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Assigned Reviewers
            </DialogTitle>
            <DialogDescription>
              Reviewers assigned to this paper
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-64 pr-4">
            {reviewers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviewers assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewers.map((reviewer) => (
                  <Card
                    key={reviewer.id}
                    className="bg-white/5 border-white/10"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                            {reviewer.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {reviewer.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {reviewer.email}
                          </p>
                          {reviewer.expertise &&
                            reviewer.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {reviewer.expertise
                                  .slice(0, 2)
                                  .map((exp, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {exp}
                                    </Badge>
                                  ))}
                                {reviewer.expertise.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{reviewer.expertise.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openAssignReviewerDialog}
        onOpenChange={setOpenAssignReviewerDialog}
      >
        <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserCheck className="h-5 w-5" />
              Assign Reviewer
            </DialogTitle>
            <DialogDescription>
              Select a reviewer to assign to this paper
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Select Reviewer</Label>
              <Select
                value={selectedReviewerId}
                onValueChange={setSelectedReviewerId}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose a reviewer" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {allReviewers.map((reviewer) => (
                    <SelectItem
                      key={reviewer.id}
                      value={reviewer.id}
                      className="hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3 text-black">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs">
                            {reviewer.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{reviewer.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {reviewer.email}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={assignReviewer}
                disabled={!selectedReviewerId}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {assignLoading ? "Assigning Reviewer..." : "Assign Reviewer"}
              </Button>

              <div className="relative space-y-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Invite New Sub-Editor
                </Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={inviteReviewerByEmail}
              disabled={!reviewerEmail}
            >
              {inviteLoading ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
