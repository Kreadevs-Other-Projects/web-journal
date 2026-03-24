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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  UserPlus,
  UserCheck,
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
  ThumbsUp,
  ThumbsDown,
  Tag,
} from "lucide-react";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  year: number;
  volume: number;
  issue: number;
  number: number;
  label: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  status?: string;
}

interface Journal {
  id: string;
  title: string;
  acronym?: string;
  description?: string;
  issn?: string;
  website_url?: string;
  status?: string;
  created_at?: string;
  expiry_at?: string;
  issues: Issue[];
}

interface Paper {
  id: string;
  title: string;
  status: string;
  authors?: string[];
  submittedDate?: string;
  issueId?: string;
  journalId?: string;
}

interface StaffMember {
  id: string;
  username: string;
  email: string;
  degrees?: string[] | null;
  keywords?: string[] | null;
  profile_pic_url?: string | null;
  active_assignments?: number;
}

interface ReviewerRequest {
  id: string;
  paper_id: string;
  paper_title: string;
  sub_editor_name: string;
  suggested_name: string;
  suggested_email: string;
  keywords: string[];
  status: string;
  created_at: string;
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

  const [subEditors, setSubEditors] = useState<StaffMember[]>([]);
  const [reviewers, setReviewers] = useState<StaffMember[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [subEditorId, setSubEditorId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [subEditorEmail, setSubEditorEmail] = useState("");
  const [newSubEditor, setNewSubEditor] = useState({ name: "", email: "" });
  const [creatingSubEditor, setCreatingSubEditor] = useState(false);
  const [openReviewerDialog, setOpenReviewerDialog] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [newReviewer, setNewReviewer] = useState({ name: "", email: "" });
  const [creatingReviewer, setCreatingReviewer] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    reviewed: 0,
    needsDecision: 0,
  });

  // CE final decision state
  const [ceDecisionPaper, setCeDecisionPaper] = useState<Paper | null>(null);
  const [ceDecisionAction, setCeDecisionAction] = useState<"accepted" | "rejected" | "revision" | "">("");
  const [ceDecisionNote, setCeDecisionNote] = useState("");
  const [submittingCeDecision, setSubmittingCeDecision] = useState(false);
  const [loading, setLoading] = useState(false);

  // Top-level dashboard tab: overview | team
  const [dashboardTab, setDashboardTab] = useState("overview");

  // Team sub-tab
  const [teamTab, setTeamTab] = useState("sub_editors");

  // Team creation dialogs (standalone, no paper required)
  const [openCreateSE, setOpenCreateSE] = useState(false);
  const [newTeamSE, setNewTeamSE] = useState({ name: "", email: "" });
  const [creatingTeamSE, setCreatingTeamSE] = useState(false);

  const [openCreateRev, setOpenCreateRev] = useState(false);
  const [newTeamRev, setNewTeamRev] = useState({ name: "", email: "" });
  const [creatingTeamRev, setCreatingTeamRev] = useState(false);

  // Reviewer requests
  const [reviewerRequests, setReviewerRequests] = useState<ReviewerRequest[]>([]);
  const [reviewerRequestsLoading, setReviewerRequestsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

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
      const needsDecision = papersData.filter((p) => p.status === "sub_editor_approved").length;

      setStats({
        total: papersData.length,
        pending,
        assigned,
        reviewed,
        needsDecision,
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

  // Multi-role combined view state
  const [myAssignedPapers, setMyAssignedPapers] = useState<any[]>([]);
  const [myReviewAssignments, setMyReviewAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchPapers();
      fetchJournals();
      // If user also has sub_editor role, fetch their assigned papers
      if (user?.roles?.includes("sub_editor")) {
        fetch(`${url}/subEditor/getAssignedPapers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => setMyAssignedPapers(d.papers || d.data || []))
          .catch(() => {});
      }
      // If user also has reviewer role, fetch their review assignments
      if (user?.roles?.includes("reviewer")) {
        fetch(`${url}/reviewer/getAssignedPapers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => setMyReviewAssignments(d.papers || d.data || []))
          .catch(() => {});
      }
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

  const fetchStaff = () => {
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
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const fetchReviewerRequests = async () => {
    try {
      setReviewerRequestsLoading(true);
      const res = await fetch(`${url}/subEditor/pending-reviewer-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviewerRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewerRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (token && dashboardTab === "team") {
      fetchReviewerRequests();
    }
  }, [token, dashboardTab]);

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update issue status");

      // Optimistic update in journals state
      setJournals((prev) =>
        prev.map((j) => ({
          ...j,
          issues: j.issues.map((iss) =>
            iss.id === issueId ? { ...iss, status: newStatus } : iss,
          ),
        })),
      );

      toast({
        title: "Issue Status Updated",
        description: `Issue ${newStatus === "closed" ? "closed" : "opened for submissions"} successfully.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Update Failed",
        description: e.message || "Could not update issue status.",
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

  const createAndAssignSubEditor = async () => {
    if (!newSubEditor.name || !newSubEditor.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    if (!selectedPaper) return;
    try {
      setCreatingSubEditor(true);
      const journalId = selectedPaper.journalId ?? selectedJournalId;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newSubEditor.name,
          email: newSubEditor.email,
          role: "sub_editor",
          journal_id: journalId,
          paper_id: selectedPaper.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");

      toast({ title: "Invitation Sent", description: `${newSubEditor.name} will be assigned as sub-editor upon acceptance.` });
      setNewSubEditor({ name: "", email: "" });
      setOpenDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingSubEditor(false);
    }
  };

  const assignExistingReviewer = async () => {
    if (!selectedPaper || !selectedReviewerId) return;
    try {
      setAssigningReviewer(true);
      const res = await fetch(`${url}/subEditor/assignReviewer/${selectedPaper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewerId: selectedReviewerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign reviewer");
      toast({ title: "Success", description: "Reviewer assigned successfully" });
      setSelectedReviewerId("");
      setOpenReviewerDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigningReviewer(false);
    }
  };

  const createAndAssignReviewer = async () => {
    if (!newReviewer.name || !newReviewer.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    if (!selectedPaper) return;
    try {
      setCreatingReviewer(true);
      const journalId = selectedPaper.journalId ?? selectedJournalId;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newReviewer.name,
          email: newReviewer.email,
          role: "reviewer",
          journal_id: journalId,
          paper_id: selectedPaper.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");

      toast({ title: "Invitation Sent", description: `${newReviewer.name} will be assigned as reviewer upon acceptance.` });
      setNewReviewer({ name: "", email: "" });
      setOpenReviewerDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingReviewer(false);
    }
  };

  // Team tab: invite sub-editor without paper assignment
  const createTeamSubEditor = async () => {
    if (!newTeamSE.name || !newTeamSE.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    try {
      setCreatingTeamSE(true);
      const journalId = selectedJournalId ?? journals[0]?.id ?? undefined;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newTeamSE.name,
          email: newTeamSE.email,
          role: "sub_editor",
          journal_id: journalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newTeamSE.name} will appear as Associate Editor upon acceptance.` });
      setNewTeamSE({ name: "", email: "" });
      setOpenCreateSE(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingTeamSE(false);
    }
  };

  // Team tab: invite reviewer without paper assignment
  const createTeamReviewer = async () => {
    if (!newTeamRev.name || !newTeamRev.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    try {
      setCreatingTeamRev(true);
      const journalId = selectedJournalId ?? journals[0]?.id ?? undefined;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newTeamRev.name,
          email: newTeamRev.email,
          role: "reviewer",
          journal_id: journalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newTeamRev.name} will appear as Reviewer upon acceptance.` });
      setNewTeamRev({ name: "", email: "" });
      setOpenCreateRev(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingTeamRev(false);
    }
  };

  const handleReviewerRequest = async (requestId: string, action: "approved" | "rejected") => {
    try {
      setProcessingRequestId(requestId);
      const res = await fetch(`${url}/subEditor/reviewer-requests/${requestId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process request");
      toast({
        title: action === "approved" ? "Request Approved" : "Request Rejected",
        description: `Reviewer request has been ${action}.`,
      });
      fetchReviewerRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const submitCeDecision = async () => {
    if (!ceDecisionPaper || !ceDecisionAction) return;
    try {
      setSubmittingCeDecision(true);
      const res = await fetch(`${url}/chiefEditor/decide/${ceDecisionPaper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision: ceDecisionAction, decision_note: ceDecisionNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit decision");
      toast({ title: "Decision Submitted", description: `Paper has been ${ceDecisionAction}.` });
      setCeDecisionPaper(null);
      setCeDecisionAction("");
      setCeDecisionNote("");
      fetchPapers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingCeDecision(false);
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
      case "assigned_to_sub_editor":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "sub_editor_approved":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileEdit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "assigned":
      case "assigned_to_sub_editor":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "reviewed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "sub_editor_approved":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
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

        {/* Top-level dashboard tabs */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-8 mt-6">
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

              {stats.needsDecision > 0 && (
                <Card className="glass-card border-l-4 border-l-orange-500 cursor-pointer" onClick={() => setActiveTab("sub_editor_approved")}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Needs Decision
                        </p>
                        <p className="text-3xl font-bold mt-2 text-orange-600">{stats.needsDecision}</p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

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
                          <div>
                            <h3
                              className="font-semibold text-lg cursor-pointer hover:text-blue-600"
                              onClick={() => handleJournalClick(journal.id)}
                            >
                              {journal.title}
                              {journal.acronym && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({journal.acronym})
                                </span>
                              )}
                            </h3>
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              {journal.issn && <span>ISSN: {journal.issn}</span>}
                              {journal.status && (
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {journal.status}
                                </Badge>
                              )}
                              {journal.expiry_at && (
                                <span>
                                  Expires:{" "}
                                  {new Date(journal.expiry_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {journal.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {journal.description}
                              </p>
                            )}
                          </div>
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
                                    <p className="text-muted-foreground text-xs">
                                      Publishes:{" "}
                                      {new Date(
                                        issue.publishedAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {issue.status === "closed" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-red-100 text-red-800"
                                      >
                                        <Lock className="h-3 w-3 mr-1" /> Closed
                                      </Badge>
                                    ) : issue.status === "draft" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800"
                                      >
                                        <FileEdit className="h-3 w-3 mr-1" /> Draft
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-100 text-green-800"
                                      >
                                        <Unlock className="h-3 w-3 mr-1" /> Open
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

            {/* Journal selector dropdown above papers list */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                    {/* Journal filter dropdown */}
                    <div className="w-full sm:w-56">
                      <Select
                        value={selectedJournalId ?? "all"}
                        onValueChange={(val) => {
                          if (val === "all") {
                            clearFilters();
                          } else {
                            handleJournalClick(val);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Journals" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Journals</SelectItem>
                          {journals.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedJournalId && selectedJournal && (
                      <Badge variant="secondary" className="gap-1">
                        <Filter className="h-3 w-3" />
                        Journal: {selectedJournal.title}
                      </Badge>
                    )}

                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search papers by title or author..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
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
                    <Button
                      variant={activeTab === "sub_editor_approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("sub_editor_approved")}
                      className={activeTab !== "sub_editor_approved" && stats.needsDecision > 0 ? "border-orange-400 text-orange-600" : ""}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Needs Decision
                      {stats.needsDecision > 0 && (
                        <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-xs">
                          {stats.needsDecision}
                        </Badge>
                      )}
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
                    <CardFooter className="pt-0 flex flex-wrap gap-2">
                      {paper.status === "sub_editor_approved" ? (
                        <>
                          <div className="w-full text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Sub-editor approved — your final decision required
                          </div>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("accepted"); }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-amber-400 text-amber-700 hover:bg-amber-50"
                            onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("revision"); }}
                          >
                            <FileEdit className="h-4 w-4 mr-1" />
                            Revision
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-400 text-red-700 hover:bg-red-50"
                            onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("rejected"); }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                            onClick={() => {
                              setSelectedPaper(paper);
                              setOpenDialog(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Editor
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 group-hover:border-purple-300 group-hover:text-purple-700 transition-colors"
                            onClick={() => {
                              setSelectedPaper(paper);
                              setSelectedReviewerId("");
                              setNewReviewer({ name: "", email: "" });
                              setOpenReviewerDialog(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Assign Reviewer
                          </Button>

                          {!paper.issueId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedPaper(paper);
                                setOpenIssueDialog(true);
                              }}
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              Assign Issue
                            </Button>
                          )}
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}


            {/* ===== COMBINED VIEW: Sub-Editor Assignments (if user has sub_editor role) ===== */}
            {user?.roles?.includes("sub_editor") && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-foreground">My Assigned Papers (as Associate Editor)</h2>
                  <Badge variant="secondary">{myAssignedPapers.length}</Badge>
                </div>
                {myAssignedPapers.length === 0 ? (
                  <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No papers currently assigned to you as Associate Editor.</CardContent></Card>
                ) : (
                  <div className="grid gap-3">
                    {myAssignedPapers.map((p: any) => (
                      <Card key={p.id} className="glass-card">
                        <CardContent className="py-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.journal_name || p.journal?.title}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">{p.status?.replace(/_/g, " ")}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== COMBINED VIEW: Reviewer Assignments (if user has reviewer role) ===== */}
            {user?.roles?.includes("reviewer") && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-foreground">My Review Assignments</h2>
                  <Badge variant="secondary">{myReviewAssignments.length}</Badge>
                </div>
                {myReviewAssignments.length === 0 ? (
                  <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No review assignments currently.</CardContent></Card>
                ) : (
                  <div className="grid gap-3">
                    {myReviewAssignments.map((p: any) => (
                      <Card key={p.id} className="glass-card">
                        <CardContent className="py-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.journal_name || p.journal?.title}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">{p.status?.replace(/_/g, " ")}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ===== TEAM TAB ===== */}
          <TabsContent value="team" className="space-y-8 mt-6">
            <Tabs value={teamTab} onValueChange={setTeamTab}>
              <TabsList>
                <TabsTrigger value="sub_editors">Associate Editors</TabsTrigger>
                <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
                <TabsTrigger value="reviewer_requests">
                  Pending Reviewer Requests
                  {reviewerRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                      {reviewerRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Associate Editors sub-tab */}
              <TabsContent value="sub_editors" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Associate Editors</h2>
                  <Button onClick={() => setOpenCreateSE(true)} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Associate Editor
                  </Button>
                </div>

                {subEditors.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="pt-12 pb-12 text-center">
                      <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Associate Editors</h3>
                      <p className="text-muted-foreground">Add associate editors to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subEditors.map((se) => (
                      <Card key={se.id} className="glass-card">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-800">
                                {se.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{se.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{se.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviewers sub-tab */}
              <TabsContent value="reviewers" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Reviewers</h2>
                  <Button onClick={() => setOpenCreateRev(true)} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Reviewer
                  </Button>
                </div>

                {reviewers.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="pt-12 pb-12 text-center">
                      <UserCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Reviewers</h3>
                      <p className="text-muted-foreground">Add reviewers to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviewers.map((r) => (
                      <Card key={r.id} className="glass-card">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-800">
                                {r.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{r.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Pending Reviewer Requests sub-tab */}
              <TabsContent value="reviewer_requests" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Pending Reviewer Requests</h2>
                  <Button variant="outline" size="sm" onClick={fetchReviewerRequests} disabled={reviewerRequestsLoading}>
                    {reviewerRequestsLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                {reviewerRequestsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
                  </div>
                ) : reviewerRequests.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="pt-12 pb-12 text-center">
                      <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                      <p className="text-muted-foreground">All reviewer requests have been processed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviewerRequests.map((req) => (
                      <Card key={req.id} className="glass-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base line-clamp-2">{req.paper_title}</CardTitle>
                          <CardDescription className="text-xs">
                            Requested by: {req.sub_editor_name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-3">
                          <div className="bg-muted/50 rounded-md p-3 space-y-1">
                            <p className="text-sm font-medium">Suggested Reviewer</p>
                            <p className="text-sm">{req.suggested_name}</p>
                            <p className="text-xs text-muted-foreground">{req.suggested_email}</p>
                          </div>
                          {req.keywords && req.keywords.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Keywords
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {req.keywords.map((kw, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleReviewerRequest(req.id, "approved")}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleReviewerRequest(req.id, "rejected")}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* ===== DIALOGS ===== */}

        {/* Assign Sub-Editor to paper dialog */}
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
                  <Label className="text-sm font-medium">Select Sub-Editor</Label>
                  {subEditors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sub-editors available.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {subEditors.map((se) => {
                        const paperKeywords: string[] = selectedPaper?.keywords ?? [];
                        const overlap = (se.keywords ?? []).filter((k) => paperKeywords.includes(k));
                        const isSelected = subEditorId === se.id;
                        return (
                          <div
                            key={se.id}
                            onClick={() => setSubEditorId(se.id)}
                            className={`rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {se.profile_pic_url
                                  ? <img src={se.profile_pic_url} alt={se.username} className="h-full w-full object-cover" />
                                  : <span className="text-sm font-semibold text-primary">{se.username.slice(0, 2).toUpperCase()}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{se.username}</p>
                                  {overlap.length > 0 && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Best Match</Badge>}
                                </div>
                                {se.degrees && se.degrees.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{se.degrees.join(", ")}</p>
                                )}
                                {se.keywords && se.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {se.keywords.map((k, i) => (
                                      <Badge key={i} variant="outline" className={`text-xs ${overlap.includes(k) ? "border-green-400 text-green-700" : ""}`}>{k}</Badge>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Currently handling {se.active_assignments ?? 0} paper{se.active_assignments !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button className="w-full" onClick={assignSubEditor} disabled={!subEditorId}>
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
                  <p className="text-xs text-muted-foreground">An invitation email will be sent. They will be assigned to this paper when they accept.</p>
                  <Input
                    placeholder="Full Name"
                    value={newSubEditor.name}
                    onChange={(e) => setNewSubEditor((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newSubEditor.email}
                    onChange={(e) => setNewSubEditor((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Button
                    className="w-full"
                    onClick={createAndAssignSubEditor}
                    disabled={creatingSubEditor || !newSubEditor.name || !newSubEditor.email}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingSubEditor ? "Sending..." : "Send Invitation"}
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

        <Dialog open={openReviewerDialog} onOpenChange={setOpenReviewerDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign Reviewer
              </DialogTitle>
            </DialogHeader>

            {selectedPaper && (
              <div className="space-y-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="font-medium text-foreground text-sm">{selectedPaper.title}</p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Existing Reviewer</Label>
                  {reviewers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviewers available.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {reviewers.map((r) => {
                        const paperKeywords: string[] = selectedPaper?.keywords ?? [];
                        const overlap = (r.keywords ?? []).filter((k) => paperKeywords.includes(k));
                        const isSelected = selectedReviewerId === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReviewerId(r.id)}
                            className={`rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {r.profile_pic_url
                                  ? <img src={r.profile_pic_url} alt={r.username} className="h-full w-full object-cover" />
                                  : <span className="text-sm font-semibold text-purple-700">{r.username.slice(0, 2).toUpperCase()}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{r.username}</p>
                                  {overlap.length > 0 && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Best Match</Badge>}
                                </div>
                                {r.degrees && r.degrees.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.degrees.join(", ")}</p>
                                )}
                                {r.keywords && r.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {r.keywords.map((k, i) => (
                                      <Badge key={i} variant="outline" className={`text-xs ${overlap.includes(k) ? "border-green-400 text-green-700" : ""}`}>{k}</Badge>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Currently reviewing {r.active_assignments ?? 0} paper{r.active_assignments !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button className="w-full" onClick={assignExistingReviewer} disabled={!selectedReviewerId || assigningReviewer}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {assigningReviewer ? "Assigning..." : "Assign Reviewer"}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Invite New Reviewer</Label>
                  <p className="text-xs text-muted-foreground">An invitation email will be sent. They will be assigned to this paper when they accept.</p>
                  <Input
                    placeholder="Full Name"
                    value={newReviewer.name}
                    onChange={(e) => setNewReviewer((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newReviewer.email}
                    onChange={(e) => setNewReviewer((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Button
                    className="w-full"
                    onClick={createAndAssignReviewer}
                    disabled={creatingReviewer || !newReviewer.name || !newReviewer.email}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingReviewer ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <div className="text-xs text-muted-foreground">{reviewers.length} available reviewers</div>
              <Button variant="ghost" onClick={() => setOpenReviewerDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team tab: Create Associate Editor dialog (no paper required) */}
        <Dialog open={openCreateSE} onOpenChange={setOpenCreateSE}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Associate Editor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">An invitation email will be sent. They will set their own password when they accept.</p>
              <Input
                placeholder="Full Name"
                value={newTeamSE.name}
                onChange={(e) => setNewTeamSE((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={newTeamSE.email}
                onChange={(e) => setNewTeamSE((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpenCreateSE(false); setNewTeamSE({ name: "", email: "" }); }}>
                Cancel
              </Button>
              <Button
                onClick={createTeamSubEditor}
                disabled={creatingTeamSE || !newTeamSE.name || !newTeamSE.email}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {creatingTeamSE ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team tab: Create Reviewer dialog (no paper required) */}
        <Dialog open={openCreateRev} onOpenChange={setOpenCreateRev}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Reviewer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">An invitation email will be sent. They will set their own password when they accept.</p>
              <Input
                placeholder="Full Name"
                value={newTeamRev.name}
                onChange={(e) => setNewTeamRev((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={newTeamRev.email}
                onChange={(e) => setNewTeamRev((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpenCreateRev(false); setNewTeamRev({ name: "", email: "" }); }}>
                Cancel
              </Button>
              <Button
                onClick={createTeamReviewer}
                disabled={creatingTeamRev || !newTeamRev.name || !newTeamRev.email}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {creatingTeamRev ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CE Final Decision Dialog */}
        <Dialog open={!!ceDecisionPaper} onOpenChange={(open) => { if (!open) { setCeDecisionPaper(null); setCeDecisionAction(""); setCeDecisionNote(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Final Decision — {ceDecisionAction === "accepted" ? "Accept" : ceDecisionAction === "rejected" ? "Reject" : "Request Revision"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground line-clamp-2">{ceDecisionPaper?.title}</p>
              <div className="space-y-2">
                <Label htmlFor="ce-note">Decision Note (optional)</Label>
                <textarea
                  id="ce-note"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a note for the author or editorial record..."
                  value={ceDecisionNote}
                  onChange={(e) => setCeDecisionNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setCeDecisionPaper(null); setCeDecisionAction(""); setCeDecisionNote(""); }}>
                Cancel
              </Button>
              <Button
                onClick={submitCeDecision}
                disabled={submittingCeDecision}
                className={ceDecisionAction === "accepted" ? "bg-green-600 hover:bg-green-700 text-white" : ceDecisionAction === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                {submittingCeDecision ? "Submitting..." : `Confirm ${ceDecisionAction === "accepted" ? "Accept" : ceDecisionAction === "rejected" ? "Reject" : "Revision"}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
