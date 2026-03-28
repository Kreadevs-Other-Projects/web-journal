import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  BookOpen,
  Calendar,
  Globe,
  FileText,
  User,
  Mail,
  Hash,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Layers,
  Bell,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { title } from "process";

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface JournalIssue {
  id: string;
  issue: number;
  volume: number;
  year: number;
  label: string;
  issueStatus: string;
  article_index: number;
  created_at: string;
  published_at: string;
  updated_at: string | null;
  paper_count?: number;
}

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  description: string;
  status: string;
  website_url: string;
  owner_id: string;
  chief_editor_id: string | null;
  created_at: string;
  updated_at?: string | null;
  chief_editor: User | null;
  owner: User;
  issues: JournalIssue[];
  is_taken_down?: boolean;
  takedown_reason?: string;

  // These fields are populated by the new LEFT JOIN subquery
  chief_editor_invitation_status?:
    | "pending"
    | "expired"
    | "accepted"
    | "cancelled";
  chief_editor_email?: string;
}

/* PAYMENT_DISABLED: Payment step hidden per client instruction
function calcProration(
  issues: JournalIssue[],
  selectedIssue: JournalIssue,
  fullAmount: number,
) {
  const firstIssue = issues.find((i) => i.article_index === 1);
  if (!firstIssue) return null;
  const startDate = new Date(firstIssue.created_at);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysRemaining = Math.max(
    0,
    Math.round(
      (endDate.getTime() - new Date(selectedIssue.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  return {
    proratedAmount: parseFloat(
      ((fullAmount * daysRemaining) / totalDays).toFixed(2),
    ),
  };
}
*/

export default function PublisherDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // PAYMENT_DISABLED: const [invoiceAmount, setInvoiceAmount] = useState<number | "">("");
  const [approving, setApproving] = useState(false);
  // PAYMENT_DISABLED: const [sendingInvoice, setSendingInvoice] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<JournalIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [pendingRequestsOpen, setPendingRequestsOpen] = useState(false);
  const [issueRequests, setIssueRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [resetingIssues, setResetingIssues] = useState(false);
  const [replaceCEOpen, setReplaceCEOpen] = useState(false);
  const [replaceCEStep, setReplaceCEStep] = useState<"confirm" | "invite">(
    "confirm",
  );
  const [replacingCE, setReplacingCE] = useState(false);
  const [invitingCE, setInvitingCE] = useState(false);
  const [newCEForm, setNewCEForm] = useState({ name: "", email: "" });
  const [issuePreview, setIssuePreview] = useState<{ label: string; volume: number; issue: number; year: number } | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);

  const statusMap: Record<string, string[]> = {
    all: ["draft", "active", "suspended", "archived"],
    pending: ["draft"],
    approved: ["active"],
  };

  const [tab, setTab] = useState("all");

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch journals");
      const json = await res.json();
      console.log(json);

      setJournals(json.journals ?? []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load journals",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveJournal = async (journalId: string, issueId: string) => {
    try {
      setApproving(true);

      const res = await fetch(`${url}/publisher/approveJournal/${journalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ issueId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to approve payment");
      }
      toast({
        title: "Success",
        description: "Journal issue approved successfully",
      });

      fetchJournals();
      setDetailsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Approval failed",
      });
    } finally {
      setApproving(false);
    }
  };

  const fetchIssuePreview = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/journal-issue/${journalId}/next-issue-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setIssuePreview(data.preview);
    } catch {}
  };

  const createIssue = async () => {
    if (!selectedJournal) return;
    try {
      setCreatingIssue(true);
      const res = await fetch(
        `${url}/journal-issue/addJournalIssue/${selectedJournal.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create issue");
      toast({ title: "Success", description: `Issue created: ${data.issue?.label}` });
      setCreateIssueOpen(false);
      setIssuePreview(null);
      fetchJournals();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setCreatingIssue(false);
    }
  };

  const fetchPendingIssueRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch(`${url}/journal-issue/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIssueRequests(data.requests || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch requests",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const reviewIssueRequest = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setReviewingRequest(requestId);
      const res = await fetch(
        `${url}/journal-issue/requests/${requestId}/review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: status }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: status === "approved" ? "Request Approved" : "Request Rejected",
        description: data.message || "Done.",
      });
      setIssueRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (status === "approved") fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setReviewingRequest(null);
    }
  };

  /* PAYMENT_DISABLED: Payment step hidden per client instruction
  const sendInvoice = async (journalId: string, issueId: string) => {
    if (!invoiceAmount || invoiceAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid invoice amount",
      });
      return;
    }

    try {
      setSendingInvoice(true);

      const endpoint = `${url}/publisher/sendInvoice`;

      const payload = {
        journalId,
        issueId,
        amount: invoiceAmount,
      };

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      const res = await fetch(endpoint, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send invoice");
      }

      toast({
        title: "Invoice Sent",
        description: `Invoice of ${invoiceAmount} PKR sent to the journal owner`,
      });

      setInvoiceAmount("");
      setDetailsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Invoice Failed",
        description: err.message || "Could not send invoice",
      });
    } finally {
      setSendingInvoice(false);
    }
  };
  */

  const replaceChiefEditor = async () => {
    if (!selectedJournal) return;
    try {
      setReplacingCE(true);
      const res = await fetch(
        `${url}/publisher/journals/${selectedJournal.id}/chief-editor`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Chief Editor Removed",
        description: "You can now invite a new chief editor.",
      });
      setReplaceCEStep("invite");
      // Refresh journal list in background so card reflects null CE
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setReplacingCE(false);
    }
  };

  const inviteNewCE = async () => {
    if (!selectedJournal || !newCEForm.name || !newCEForm.email) return;
    try {
      setInvitingCE(true);
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCEForm.name,
          email: newCEForm.email,
          role: "chief_editor",
          journal_id: selectedJournal.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newCEForm.email}`,
      });
      setReplaceCEOpen(false);
      setReplaceCEStep("confirm");
      setNewCEForm({ name: "", email: "" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setInvitingCE(false);
    }
  };
  const [resending, setResending] = useState(false);

  // Takedown state
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [takedownTarget, setTakedownTarget] = useState<{ type: "journal"; id: string; title: string } | null>(null);
  const [takedownReason, setTakedownReason] = useState("");
  const [takedownProcessing, setTakedownProcessing] = useState(false);

  const resendInvitation = async () => {
    // Only proceed if we have a journal and an email to send to
    if (!selectedJournal || !selectedJournal.chief_editor_email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found to resend the invitation.",
      });
      return;
    }

    try {
      setResending(true);
      const res = await fetch(`${url}/invitations/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journal_id: selectedJournal.id,
          email: selectedJournal.chief_editor_email,
          role: "chief_editor",
          title: selectedJournal.title,
          chiefEditorName: selectedJournal.chief_editor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Resend failed");

      toast({
        title: "Invitation Resent",
        description: `A fresh invitation was sent to ${selectedJournal.chief_editor_email}`,
      });

      fetchJournals(); // Refresh list to change status from 'expired' to 'pending'
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setResending(false);
    }
  };

  const handleIssueReset = async () => {
    if (resetingIssues) return;
    if (!window.confirm("This will close ALL open journal issues platform-wide. Continue?")) return;
    setResetingIssues(true);
    try {
      const res = await fetch(`${url}/publisher/issues/reset-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      toast({ title: "Issues Reset", description: data.message });
      fetchJournals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResetingIssues(false);
    }
  };

  const handleTakedown = async () => {
    if (!takedownTarget || !takedownReason.trim()) return;
    setTakedownProcessing(true);
    try {
      const res = await fetch(`${url}/publisher/journals/${takedownTarget.id}/takedown`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: takedownReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Journal taken down", description: `"${takedownTarget.title}" is now hidden from public view.` });
      setTakedownModalOpen(false);
      setTakedownReason("");
      setTakedownTarget(null);
      fetchJournals();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setTakedownProcessing(false);
    }
  };

  const handleRestoreJournal = async (journalId: string, journalTitle: string) => {
    try {
      const res = await fetch(`${url}/publisher/journals/${journalId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Journal restored", description: `"${journalTitle}" is now visible to the public.` });
      fetchJournals();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-500/20 text-green-400 border-green-500/30"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          >
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="default"
            className="bg-red-500/20 text-red-400 border-red-500/30"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge
            variant="default"
            className="bg-gray-500/20 text-gray-400 border-gray-500/30"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  useEffect(() => {
    if (!detailsModalOpen) {
      setSelectedIssue(null);
    }
  }, [detailsModalOpen]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Publisher Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage journals and process approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 rounded-lg align-item-center">
              <p className="text-sm text-muted-foreground">
                Total Journals:{" "}
                <span className="text-xl font-bold text-foreground">
                  {journals.length}
                </span>
              </p>
            </div>
            <Button onClick={fetchJournals} variant="outline" size="sm">
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 relative"
              onClick={() => {
                fetchPendingIssueRequests();
                setPendingRequestsOpen(true);
              }}
            >
              <Bell className="h-4 w-4" /> Issue Requests
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleIssueReset}
              disabled={resetingIssues}
            >
              <RotateCcw className="h-4 w-4" />
              {resetingIssues ? "Resetting..." : "Reset Issues"}
            </Button>
            <Button
              onClick={() => navigate("/publisher/create-journal")}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Journal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.filter((j) => j.status === "draft").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.filter((j) => j.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.reduce(
                      (acc, journal) => acc + journal.issues.length,
                      0,
                    )}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Journals</h2>
            <Tabs value={tab} onValueChange={setTab} className="w-[300px]">
              <TabsList className="glass-card">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Draft</TabsTrigger>
                <TabsTrigger value="approved">Active</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : journals.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-muted-foreground text-lg">
                  No journals found
                </p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  Journals will appear here once submitted
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {journals
                .filter((journal) => statusMap[tab].includes(journal.status))
                .map((journal) => (
                  <Card
                    key={journal.id}
                    className={`glass-card hover:shadow-lg transition-all duration-300 hover:border-blue-500/50 cursor-pointer group ${journal.is_taken_down ? "border-red-500/40 opacity-75" : ""}`}
                    onClick={() => {
                      (console.log({ journal }), setSelectedJournal(journal));
                      setDetailsModalOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-blue-500 transition-colors flex-1 min-w-0">
                          <BookOpen className="h-5 w-5 shrink-0" />
                          <span className="line-clamp-1">{journal.title}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          {journal.is_taken_down ? (
                            <Badge className="border text-xs bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                              <ShieldOff className="h-3 w-3 mr-1" />Taken Down
                            </Badge>
                          ) : (
                            getStatusBadge(journal.status)
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {journal.is_taken_down ? (
                                <DropdownMenuItem
                                  className="text-green-600 gap-2"
                                  onClick={() => handleRestoreJournal(journal.id, journal.title)}
                                >
                                  <ShieldCheck className="h-4 w-4" /> Restore Journal
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-red-600 gap-2"
                                  onClick={() => {
                                    setTakedownTarget({ type: "journal", id: journal.id, title: journal.title });
                                    setTakedownReason("");
                                    setTakedownModalOpen(true);
                                  }}
                                >
                                  <ShieldOff className="h-4 w-4" /> Take Down Journal
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{journal.issn}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {journal.description}
                        </p>
                        {journal.is_taken_down && journal.takedown_reason && (
                          <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                            Reason: {journal.takedown_reason}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(journal.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {journal.issues.length} issues
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground"
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </div>

        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                {selectedJournal?.title}
              </DialogTitle>
              <DialogDescription>
                Complete journal information and management
              </DialogDescription>
            </DialogHeader>

            {selectedJournal && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-card rounded-lg">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        ISSN: {selectedJournal.issn}
                      </div>
                      {getStatusBadge(selectedJournal.status)}
                    </div>
                    <p className="text-gray-700">
                      {selectedJournal.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-white">
                      {new Date(
                        selectedJournal.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Website URL</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-4 w-4 text-blue-400" />
                          {selectedJournal.website_url ? (
                            <a
                              href={selectedJournal.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {selectedJournal.website_url}
                            </a>
                          ) : (
                            <span className="text-gray-600">Not provided</span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p>
                          {selectedJournal.updated_at
                            ? new Date(
                                selectedJournal.updated_at,
                              ).toLocaleString()
                            : "Never"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        People
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Owner Section */}
                      <div>
                        <p className="text-sm text-gray-600">Owner</p>
                        <div className="flex items-center gap-2 mt-2">
                          <User className="h-4 w-4 text-green-400" />
                          <div>
                            <p>{selectedJournal.owner.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedJournal.owner.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Chief Editor Section */}
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">Chief Editor</p>
                          <div className="flex gap-2">
                            {/* THE FIX: Resend button appears ONLY when status is 'expired' */}
                            {selectedJournal.chief_editor_invitation_status ===
                              "expired" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resendInvitation();
                                }}
                                disabled={resending}
                              >
                                <Bell className="h-3 w-3" />
                                {resending ? "Sending..." : "Resend"}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplaceCEStep(
                                  selectedJournal.chief_editor
                                    ? "confirm"
                                    : "invite",
                                );
                                setReplaceCEOpen(true);
                              }}
                            >
                              {selectedJournal.chief_editor
                                ? "Replace"
                                : "Invite"}
                            </Button>
                          </div>
                        </div>

                        {selectedJournal.chief_editor ? (
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-purple-400" />
                            <div>
                              <p>{selectedJournal.chief_editor.name}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {selectedJournal.chief_editor.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <p
                              className={`text-sm flex items-center gap-1 ${
                                selectedJournal.chief_editor_invitation_status ===
                                "expired"
                                  ? "text-red-400 font-medium"
                                  : "text-amber-400"
                              }`}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {selectedJournal.chief_editor_invitation_status ===
                              "expired"
                                ? `Invitation to ${selectedJournal.chief_editor_email || "editor"} has expired`
                                : "No chief editor — invitation pending or not yet sent"}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Journal Issues
                        <Badge variant="outline" className="ml-2">
                          {selectedJournal.issues.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateIssueOpen(true);
                          if (selectedJournal) fetchIssuePreview(selectedJournal.id);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Create New Issue
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedJournal.issues.map((issue) => {
                      const isSelected = selectedIssue?.id === issue.id;

                      return (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                             ${
                               isSelected
                                 ? "bg-blue-500/20 border border-blue-500"
                                 : "glass-card hover:bg-white/5"
                             }`}
                        >
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {issue.label}
                              {isSelected && (
                                <Badge className="bg-blue-500 text-white">
                                  Selected
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-400">
                              Volume {issue.volume} • Issue {issue.issue} •{" "}
                              {issue.year}
                            </p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="text-sm text-muted-foreground">
                              {issue.issueStatus}
                            </p>
                            {issue.paper_count != null && (
                              <div className="mt-1">
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  {issue.paper_count}/99 papers
                                </p>
                                <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                      width: `${Math.min((issue.paper_count / 99) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* PAYMENT_DISABLED: Payment step hidden per client instruction */}
                {/* Invoice Management card removed */}
                <Card className="glass-card border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Issue Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        onClick={() =>
                          approveJournal(
                            selectedJournal.id,
                            selectedIssue?.id ?? "",
                          )
                        }
                        disabled={approving || !selectedIssue}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        size="lg"
                      >
                        {approving ? (
                          "Approving..."
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Selected Issue
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="flex gap-2 pt-6 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={createIssueOpen} onOpenChange={(open) => { setCreateIssueOpen(open); if (!open) setIssuePreview(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Create New Issue
              </DialogTitle>
              <DialogDescription>{selectedJournal?.title}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {issuePreview ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Next issue</p>
                  <p className="text-xl font-semibold text-foreground">{issuePreview.label}</p>
                  <p className="text-sm text-muted-foreground">{issuePreview.year}</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                  Loading preview…
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateIssueOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createIssue} disabled={creatingIssue}>
                {creatingIssue ? "Creating..." : "Create Issue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={pendingRequestsOpen} onOpenChange={setPendingRequestsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pending Issue Requests
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject new issue requests from journal
              managers.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            {requestsLoading ? (
              <div className="py-8 text-center text-gray-400">Loading...</div>
            ) : issueRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No pending issue requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issueRequests.map((req) => (
                  <Card key={req.id} className="border border-border">
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-foreground text-base">
                              {req.label}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {req.journal_title || "Journal"}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1.5"
                              disabled={reviewingRequest === req.id}
                              onClick={() =>
                                reviewIssueRequest(req.id, "approved")
                              }
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              disabled={reviewingRequest === req.id}
                              onClick={() =>
                                reviewIssueRequest(req.id, "rejected")
                              }
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Volume
                            </p>
                            <p className="font-medium text-foreground">
                              {req.volume ?? "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Issue No.
                            </p>
                            <p className="font-medium text-foreground">
                              {req.issue_no ?? "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Year
                            </p>
                            <p className="font-medium text-foreground">
                              {req.year ?? new Date().getFullYear()}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Requested by:{" "}
                            <span className="font-medium text-foreground">
                              {req.requested_by_name || "Journal Manager"}
                            </span>
                          </span>
                          <span>
                            {new Date(req.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
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
        open={replaceCEOpen}
        onOpenChange={(open) => {
          setReplaceCEOpen(open);
          if (!open) {
            setReplaceCEStep("confirm");
            setNewCEForm({ name: "", email: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {replaceCEStep === "confirm"
                ? "Replace Chief Editor"
                : "Invite New Chief Editor"}
            </DialogTitle>
            <DialogDescription>
              {replaceCEStep === "confirm"
                ? `This will remove ${selectedJournal?.chief_editor?.name ?? "the current chief editor"} from ${selectedJournal?.title} and cancel any pending invitations.`
                : "Enter the details of the new chief editor to send them an invitation."}
            </DialogDescription>
          </DialogHeader>

          {replaceCEStep === "confirm" ? (
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setReplaceCEOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={replacingCE}
                onClick={replaceChiefEditor}
              >
                {replacingCE ? "Removing..." : "Remove & Continue"}
              </Button>
            </DialogFooter>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={newCEForm.name}
                    onChange={(e) =>
                      setNewCEForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newCEForm.email}
                    onChange={(e) =>
                      setNewCEForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReplaceCEOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={invitingCE || !newCEForm.name || !newCEForm.email}
                  onClick={inviteNewCE}
                >
                  {invitingCE ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Takedown confirmation modal */}
      <Dialog open={takedownModalOpen} onOpenChange={(open) => { if (!open) { setTakedownModalOpen(false); setTakedownReason(""); setTakedownTarget(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" /> Take Down Journal
            </DialogTitle>
            <DialogDescription>
              This will hide <strong>{takedownTarget?.title}</strong> and all its issues and papers from public view. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm mb-1.5 block">Reason for Takedown <span className="text-red-500">*</span></Label>
              <Textarea
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                placeholder="e.g., Copyright violation, inappropriate content, author request…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTakedownModalOpen(false); setTakedownReason(""); setTakedownTarget(null); }}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleTakedown}
              disabled={!takedownReason.trim() || takedownProcessing}
            >
              {takedownProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              Confirm Takedown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
