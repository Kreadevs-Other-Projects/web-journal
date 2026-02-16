import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  UserPlus,
  Search,
  Filter,
  Users,
  FileEdit,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Lock,
  Unlock,
} from "lucide-react";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  year: number;
  volume: number;
  issue: number;
  label: string;
  publishedAt: string;
  updatedAt: string;
  status?: string; // 'open' | 'closed'
}

interface Journal {
  id: string;
  title: string;
  description?: string;
  issues: Issue[];
}

interface Paper {
  id: string;
  title: string;
  status: string;
  authors?: string[];
  submittedDate?: string;
  issueId?: string; // Added to track which issue the paper is assigned to
  journalId?: string;
}

export default function ChiefEditor() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(
    null,
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [subEditors, setSubEditors] = useState<
    {
      id: string;
      username: string;
      email: string;
    }[]
  >([]);
  const [reviewers, setReviewers] = useState<
    {
      id: string;
      username: string;
      email: string;
    }[]
  >([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [subEditorId, setSubEditorId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [subEditorEmail, setSubEditorEmail] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    reviewed: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/chiefEditor/getChiefEditorJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setJournals(data.journal || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load journals",
        description: "Unable to fetch journals",
        variant: "destructive",
      });
    }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/chiefEditor/getAllPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const papersData = data.data || [];
      setPapers(papersData);
      setFilteredPapers(papersData);

      const pending = papersData.filter((p) => p.status === "submitted").length;
      const assigned = papersData.filter((p) => p.status === "assigned").length;
      const reviewed = papersData.filter((p) => p.status === "reviewed").length;

      setStats({
        total: papersData.length,
        pending,
        assigned,
        reviewed,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load papers",
        description: "Unable to fetch papers at the moment.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) {
      fetchPapers();
      fetchJournals();
    }
  }, [token]);

  const fetchPapersByIssue = async (issueId: string) => {
    try {
      const res = await fetch(
        `${url}/chiefEditor/getPapersByIssue/${issueId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      console.log(data);

      const issuePapers = data.papers || [];
      setPapers(issuePapers);
      setFilteredPapers(issuePapers);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load papers",
        description: "Unable to fetch papers for this issue.",
        variant: "destructive",
      });
    }
  };

  const fetchPapersByJournal = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/chiefEditor/getPapers/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const journalPapers = data.papers || [];
      setPapers(journalPapers);
      setFilteredPapers(journalPapers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetch(`${url}/chiefEditor/getSubEditors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubEditors(data.data || []));

    fetch(`${url}/chiefEditor/getReviewers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setReviewers(data.data || []));
  }, [token]);

  useEffect(() => {
    let filtered = papers;

    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.authors?.some((author) =>
            author.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((paper) => paper.status === activeTab);
    }

    setFilteredPapers(filtered);
  }, [searchQuery, activeTab, papers]);

  const assignPaperToIssue = async (paperId: string, issueId: string) => {
    try {
      setLoading(true);

      const res = await fetch(`${url}/chiefEditor/assignPaperToIssue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paperId, issueId }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Paper Assigned",
        description: "Paper assigned to issue successfully.",
      });

      setOpenIssueDialog(false);

      if (selectedIssueId) {
        fetchPapersByIssue(selectedIssueId);
      } else if (selectedJournalId) {
        fetchPapersByJournal(selectedJournalId);
      } else {
        fetchPapers();
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Assignment Failed",
        description: "Could not assign paper to issue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleIssueStatus = async (issueId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";

      const res = await fetch(
        `${url}/chiefEditor/updateIssueStatus/${issueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) throw new Error();

      toast({
        title: "Issue Status Updated",
        description: `Issue ${newStatus === "closed" ? "closed" : "reopened"} successfully.`,
      });

      fetchJournals();
    } catch (e) {
      console.error(e);
      toast({
        title: "Update Failed",
        description: "Could not update issue status.",
        variant: "destructive",
      });
    }
  };

  const assignSubEditor = async () => {
    if (!selectedPaper || !subEditorId) return;

    try {
      setLoading(true);

      await fetch(`${url}/chiefEditor/assignSubEditor/${selectedPaper.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subEditorId }),
      });

      toast({
        title: "Sub-Editor Assigned",
        description: "Sub-editor assigned successfully.",
      });

      setSubEditorId("");
      setOpenDialog(false);

      if (selectedIssueId) {
        fetchPapersByIssue(selectedIssueId);
      } else if (selectedJournalId) {
        fetchPapersByJournal(selectedJournalId);
      } else {
        fetchPapers();
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Assignment Failed",
        description: "Could not assign sub-editor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteSubEditorByEmail = async () => {
    if (!subEditorEmail) return;

    try {
      setInviteLoading(true);

      const res = await fetch(`${url}/chiefEditor/inviteSubEditor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: subEditorEmail }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Invitation Sent",
        description: `Sub-editor invited successfully to ${subEditorEmail}`,
      });

      setSubEditorEmail("");
      fetch(`${url}/chiefEditor/getSubEditors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setSubEditors(data.data || []));
    } catch (e) {
      console.error(e);
      toast({
        title: "Invitation Failed",
        description: `Could not invite ${subEditorEmail}`,
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleIssueClick = (issue: Issue, journalId: string) => {
    setSelectedJournalId(journalId);
    setSelectedIssueId(issue.id);
    fetchPapersByIssue(issue.id);
  };

  const handleJournalClick = (journalId: string) => {
    setSelectedJournalId(journalId);
    setSelectedIssueId(null);
    fetchPapersByJournal(journalId);
  };

  const clearFilters = () => {
    setSelectedJournalId(null);
    setSelectedIssueId(null);
    fetchPapers();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "assigned":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileEdit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "assigned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "reviewed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const selectedJournal = journals.find((j) => j.id === selectedJournalId);
  const selectedIssue = selectedJournal?.issues.find(
    (i) => i.id === selectedIssueId,
  );

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Chief Editor Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage papers, assign sub-editors, and oversee the review
                process
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Users className="h-4 w-4 mr-2" />
              {subEditors.length} Sub-Editors Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Papers
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.assigned}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reviewed
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.reviewed}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Filters */}
        {(selectedJournalId || selectedIssueId) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Viewing:{" "}
                    {selectedIssue
                      ? `${selectedJournal?.title} - ${selectedIssue.label || `Vol ${selectedIssue.volume}, Issue ${selectedIssue.issue}`}`
                      : selectedJournal?.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journals Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Journals</CardTitle>
            <CardDescription>
              Journals assigned to you with their issues
            </CardDescription>
          </CardHeader>

          <CardContent>
            {journals.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No journals assigned
              </p>
            ) : (
              <div className="space-y-4">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center">
                      <h3
                        className="font-semibold text-lg cursor-pointer hover:text-blue-600"
                        onClick={() => handleJournalClick(journal.id)}
                      >
                        {journal.title}
                      </h3>
                      <Badge variant="outline">
                        {journal.issues.length} Issues
                      </Badge>
                    </div>

                    {journal.issues.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {journal.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="bg-muted/50 p-3 rounded-md text-sm hover:bg-muted transition-colors cursor-pointer group"
                            onClick={() => handleIssueClick(issue, journal.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium group-hover:text-blue-600">
                                  {issue.label ||
                                    `Vol ${issue.volume}, Issue ${issue.issue}`}
                                </p>
                                <p className="text-muted-foreground">
                                  Year: {issue.year}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {issue.status === "closed" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-100 text-red-800"
                                  >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Closed
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Open
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleIssueStatus(
                                      issue.id,
                                      issue.status || "open",
                                    );
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  {issue.status === "closed" ? (
                                    <Unlock className="h-4 w-4" />
                                  ) : (
                                    <Lock className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search papers by title or author..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                >
                  All Papers
                </Button>
                <Button
                  variant={activeTab === "submitted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("submitted")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                </Button>
                <Button
                  variant={
                    activeTab === "assigned_to_editor" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveTab("assigned_to_editor")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assigned
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredPapers.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No papers found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No papers match your search criteria"
                  : selectedIssueId
                    ? "No papers assigned to this issue yet"
                    : "There are no papers to display"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={getStatusColor(paper.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(paper.status)}
                          {paper.status.charAt(0).toUpperCase() +
                            paper.status.slice(1)}
                        </span>
                      </Badge>
                      {paper.issueId && (
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Assigned to Issue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 mt-4 group-hover:text-blue-600 transition-colors">
                    {paper.title}
                  </CardTitle>
                  {paper.authors && (
                    <CardDescription className="line-clamp-1">
                      {paper.authors.join(", ")}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-sm text-muted-foreground">
                    {paper.submittedDate && (
                      <p>
                        Submitted:{" "}
                        {new Date(paper.submittedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                    onClick={() => {
                      setSelectedPaper(paper);
                      setOpenDialog(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Editor
                  </Button>

                  {!paper.issueId && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setOpenIssueDialog(true);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assign Issue
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Assign Sub-Editor Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assign Sub-Editor
              </DialogTitle>
            </DialogHeader>

            {selectedPaper && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Paper Details</Label>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="font-medium text-foreground">
                        {selectedPaper.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(selectedPaper.status)}
                        >
                          {selectedPaper.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Select Sub-Editor
                  </Label>
                  <Select value={subEditorId} onValueChange={setSubEditorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a sub-editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {subEditors.map((se) => (
                        <SelectItem key={se.id} value={se.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-800">
                                {se.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{se.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {se.email}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    onClick={assignSubEditor}
                    disabled={!subEditorId}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "Assigning..." : "Assign Sub-Editor"}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Invite New Sub-Editor
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={subEditorEmail}
                    onChange={(e) => setSubEditorEmail(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={inviteSubEditorByEmail}
                    disabled={!subEditorEmail}
                  >
                    {inviteLoading
                      ? "Sending Invitation..."
                      : "Send Invitation"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {subEditors.length} available sub-editors
              </div>
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign to Issue Dialog */}
        <Dialog open={openIssueDialog} onOpenChange={setOpenIssueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Assign Paper to Issue
              </DialogTitle>
            </DialogHeader>

            {selectedPaper && selectedJournal && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Paper</Label>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="font-medium text-foreground text-sm">
                        {selectedPaper.title}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Issue</Label>
                  <Select
                    onValueChange={(issueId) =>
                      assignPaperToIssue(selectedPaper.id, issueId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedJournal.issues
                        .filter((issue) => issue.status !== "closed")
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            {issue.label ||
                              `Vol ${issue.volume}, Issue ${issue.issue} (${issue.year})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenIssueDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
