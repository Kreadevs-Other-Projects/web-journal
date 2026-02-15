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
  FileText,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Paper {
  id: string;
  title: string;
  JournalId: string;
  author_id: string;
  authors?: string;
  author_email?: string;
  created_at: string;
  status: string;
  abstract?: string;
}

export default function PublisherPapersDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const statusMap: Record<string, string[]> = {
    all: ["pending", "approved", "submitted"],
    pending: ["pending", "submitted"],
    approved: ["approved"],
  };

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/papers/getAllPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch papers");

      const data = await res.json();

      console.log(data);

      setPapers(
        Array.isArray(data?.papers)
          ? data.papers
          : data?.papers
            ? [data.papers]
            : [],
      );
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

  const sendPaymentRequest = async () => {
    if (!selectedPaper || !paymentAmount.trim()) {
      console.log("Validation failed: Missing paper or payment amount");
      return;
    }

    try {
      setSendingEmail(true);
      console.log("Preparing payment request:", {
        paperId: selectedPaper.id,
        authorId: selectedPaper.author_id,
        pricePerPage: parseFloat(paymentAmount),
        authorEmail: selectedPaper.author_email,
      });

      const res = await fetch(`${url}/paperPayment/createPaperPayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paperId: selectedPaper.id,
          authorId: selectedPaper.author_id,
          pages: 1,
          pricePerPage: parseFloat(paymentAmount),
          // username: selectedPaper.authors,
          journalName: selectedPaper.JournalId,
          issueLabel: "Issue 1",
          authorEmail: selectedPaper.author_email,
        }),
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) throw new Error(data.message || "Failed to send payment");

      toast({
        title: "Payment Sent",
        description: `Payment request sent to ${selectedPaper.authors}`,
      });

      setEmailModalOpen(false);
      setPaymentAmount("");
    } catch (err: any) {
      console.error("Payment request error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send payment",
      });
    } finally {
      setSendingEmail(false);
      console.log("Email sending state reset");
    }
  };

  useEffect(() => {
    if (user && token) fetchPapers();
  }, [user, token]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case "pending":
      case "submitted":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {status}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {status}
          </Badge>
        );
    }
  };

  const filteredPapers = papers.filter((paper) =>
    statusMap[tab].includes(paper.status.toLowerCase()),
  );

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">
            Publisher Papers Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button onClick={fetchPapers} variant="outline" size="sm">
              Refresh
            </Button>
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="bg-background rounded-lg p-1"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-gray-400 text-lg">No papers found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="glass-card border border-gray-700 hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-lg text-white">
                          {paper.title}
                        </span>
                      </div>
                      {paper.authors && (
                        <p className="text-sm font-normal text-muted-foreground mt-1">
                          {paper.authors}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(paper.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(paper.created_at).toLocaleDateString()}
                  </p>
                  {paper.abstract && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedPaper(paper);
                      setEmailModalOpen(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4" /> Send Payment Request
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Payment Request</DialogTitle>
            </DialogHeader>

            {selectedPaper && (
              <div className="space-y-4">
                <p>
                  To:{" "}
                  <span className="font-medium">
                    {selectedPaper.author_email}
                  </span>
                </p>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="paymentAmount"
                    className="text-sm font-medium"
                  >
                    Amount (USD)
                  </label>
                  <input
                    id="paymentAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    className="w-full p-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailModalOpen(false);
                      setPaymentAmount("");
                    }}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendPaymentRequest}
                    disabled={sendingEmail || !paymentAmount.trim()}
                  >
                    {sendingEmail ? "Sending..." : "Send Payment"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
