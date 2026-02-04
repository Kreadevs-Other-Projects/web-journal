import { useEffect, useState } from "react";
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
  DollarSign,
} from "lucide-react";
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

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface JournalIssue {
  id: string;
  issue: number;
  label: string;
  volume: number;
  year: number;
  published_at: string;
  updated_at: string | null;
}

interface Journal {
  id: string;
  name: string;
  slug: string;
  issn: string;
  description: string;
  status: string;
  website_url: string;
  owner_id: string;
  chief_editor_id: string;
  created_at: string;
  updated_at?: string | null;
  chief_editor: User;
  owner: User;
  issues: JournalIssue[];
}

export default function PublisherDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const statusMap: Record<string, string[]> = {
    all: ["pending_payment", "draft", "active", "suspended", "archived"],
    pending: ["pending_payment", "draft"],
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
      setJournals(json.data ?? []);
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

  const approveJournal = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/publisher/approveJournal/${journalId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to approve journal");
      toast({
        title: "Success",
        description: "Journal approved successfully",
      });
      fetchJournals();
      setDetailsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Approval failed",
      });
    }
  };

  const sendInvoice = async (journalId: string) => {
    if (!invoiceAmount || invoiceAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid invoice amount",
      });
      return;
    }

    try {
      const endpoint = `${url}/publisher/sendInvoice`;

      const payload = {
        journalId,
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
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-green-500/20 text-green-400 border-green-500/30"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
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

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Publisher Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Manage journals and process approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-400">Total Journals</p>
              <p className="text-2xl font-bold text-white">{journals.length}</p>
            </div>
            <Button onClick={fetchJournals} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      journals.filter(
                        (j) => j.status.toLowerCase() === "pending",
                      ).length
                    }
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
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      journals.filter(
                        (j) => j.status.toLowerCase() === "approved",
                      ).length
                    }
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
                  <p className="text-sm text-gray-400">Total Issues</p>
                  <p className="text-2xl font-bold text-white">
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
            <h2 className="text-xl font-semibold text-white">Journals</h2>
            <Tabs value={tab} onValueChange={setTab} className="w-[300px]">
              <TabsList className="glass-card">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : journals.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">No journals found</p>
                <p className="text-gray-500 text-sm mt-1">
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
                    className="glass-card hover:shadow-lg transition-all duration-300 hover:border-blue-500/50 cursor-pointer group"
                    onClick={() => {
                      setSelectedJournal(journal);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2 text-white group-hover:text-blue-400 transition-colors">
                          <BookOpen className="h-5 w-5" />
                          <span className="line-clamp-1">{journal.name}</span>
                        </CardTitle>
                        {getStatusBadge(journal.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{journal.issn}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {journal.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
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
                    <CardFooter className="border-t border-gray-800 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-400 hover:text-white"
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
                {selectedJournal?.name}
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
                      <div>
                        <p className="text-sm text-gray-600">Chief Editor</p>
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
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Journal Issues
                      <Badge variant="outline" className="ml-2">
                        {selectedJournal.issues.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedJournal.issues.length > 0 ? (
                      <div className="space-y-3">
                        {selectedJournal.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-center justify-between p-3 glass-card rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div>
                              <p className="font-medium">{issue.label}</p>
                              <p className="text-sm text-gray-400">
                                Volume {issue.volume} • Issue {issue.issue} •{" "}
                                {issue.year}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">Created</p>
                              <p className="text-white">
                                {new Date(
                                  issue.published_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No issues published yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Invoice Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Invoice Amount (PKR)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={0}
                            step="100"
                            value={invoiceAmount}
                            onChange={(e) =>
                              setInvoiceAmount(Number(e.target.value))
                            }
                            className="flex-1 p-3 rounded-lg bg-white/5 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter invoice amount"
                          />
                          <span className="flex items-center px-4 bg-white/5 border border-gray-700 rounded-lg text-gray-400">
                            PKR
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Enter the amount to be invoiced to the journal owner
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          onClick={() => approveJournal(selectedJournal.id)}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          size="lg"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Journal
                        </Button>

                        <Button
                          onClick={() => sendInvoice(selectedJournal.id)}
                          variant="default"
                          disabled={!invoiceAmount || invoiceAmount <= 0}
                          className="flex-1"
                          size="lg"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Send Invoice
                        </Button>
                      </div>
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
      </div>
    </DashboardLayout>
  );
}
