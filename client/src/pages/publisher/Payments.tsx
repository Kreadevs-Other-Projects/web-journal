import { useEffect, useState, useRef } from "react";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Check, X, Loader2, CreditCard, FileText, ImageIcon } from "lucide-react";
import { getFileUrl } from "@/lib/utils";
import { UserRole } from "@/lib/roles";

interface PaperPayment {
  id: string;
  paper_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  paper_title: string;
  journal_name: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
  created_at: string;
  rejection_reason?: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    payment_review: { label: "Receipt Uploaded", className: "bg-blue-100 text-blue-800 border-blue-300" },
    success: { label: "Approved", className: "bg-green-100 text-green-800 border-green-300" },
    failed: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-300" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={`border text-xs ${cfg.className} hover:${cfg.className}`}>{cfg.label}</Badge>;
}

export default function PublisherPayments() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [pending, setPending] = useState<PaperPayment[]>([]);
  const [all, setAll] = useState<PaperPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaperPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch(`${url}/payments/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${url}/payments/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [pd, ad] = await Promise.all([pendingRes.json(), allRes.json()]);
      if (pd.success) setPending(pd.payments);
      if (ad.success) setAll(ad.payments);
    } catch {
      toast({ title: "Error loading payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [token]);

  const handleApprove = async (payment: PaperPayment) => {
    setProcessing(payment.paper_id);
    try {
      const res = await fetch(`${url}/payments/paper/${payment.paper_id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Payment approved", description: "Paper moved to editorial workflow." });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a rejection reason.", variant: "destructive" });
      return;
    }
    setProcessing(rejectTarget.paper_id);
    try {
      const res = await fetch(`${url}/payments/paper/${rejectTarget.paper_id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Receipt rejected", description: "Author has been notified." });
      setRejectTarget(null);
      setRejectionReason("");
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const PaymentCard = ({ payment }: { payment: PaperPayment }) => {
    const isPdf = payment.receipt_url?.endsWith(".pdf");
    const receiptFullUrl = payment.receipt_url ? getFileUrl(payment.receipt_url) : null;

    return (
      <Card className="mb-3">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{payment.paper_title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{payment.journal_name}</p>
              <p className="text-xs text-muted-foreground">{payment.author_name} · {payment.author_email}</p>
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Invoice</p>
              <p className="font-mono font-medium">{payment.invoice_number || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-bold text-sm">{payment.currency} {Number(payment.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Receipt Uploaded</p>
              <p>{formatDate(payment.receipt_uploaded_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p>{formatDate(payment.created_at)}</p>
            </div>
          </div>

          {/* Receipt thumbnail */}
          {receiptFullUrl && (
            <div className="flex items-center gap-2">
              {!isPdf ? (
                <div
                  className="h-16 w-16 rounded-md border overflow-hidden cursor-pointer shrink-0 bg-muted"
                  onClick={() => setViewReceiptUrl(receiptFullUrl)}
                >
                  <img src={receiptFullUrl} alt="Receipt" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className="h-16 w-16 rounded-md border flex flex-col items-center justify-center cursor-pointer bg-muted shrink-0 gap-1"
                  onClick={() => window.open(receiptFullUrl, "_blank")}
                >
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">PDF</span>
                </div>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => window.open(receiptFullUrl, "_blank")}>
                <Eye className="h-3 w-3" /> View Receipt
              </Button>
            </div>
          )}

          {payment.rejection_reason && (
            <p className="text-xs text-red-600 dark:text-red-400">Rejection reason: {payment.rejection_reason}</p>
          )}

          {/* Action buttons for payment_review status */}
          {payment.status === "payment_review" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(payment)}
                disabled={processing === payment.paper_id}
              >
                {processing === payment.paper_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Approve Payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => { setRejectTarget(payment); setRejectionReason(""); }}
                disabled={processing === payment.paper_id}
              >
                <X className="h-3 w-3" /> Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout role={(user?.role as UserRole) ?? "publisher"} userName={user?.username}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Paper Payments</h1>
            <p className="text-muted-foreground text-sm">Review and approve author payment receipts.</p>
          </div>
          {pending.length > 0 && (
            <Badge className="ml-auto bg-orange-500 text-white">{pending.length} pending</Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending Review {pending.length > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="all">All Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pending.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">No receipts pending review.</div>
              ) : (
                pending.map((p) => <PaymentCard key={p.id} payment={p} />)
              )}
            </TabsContent>

            <TabsContent value="all">
              {all.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">No payment records yet.</div>
              ) : (
                all.map((p) => <PaymentCard key={p.id} payment={p} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Receipt image viewer */}
      <Dialog open={!!viewReceiptUrl} onOpenChange={() => setViewReceiptUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
          {viewReceiptUrl && (
            <img src={viewReceiptUrl} alt="Receipt" className="w-full rounded-md border" />
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection reason modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectionReason(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Receipt</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Please provide a reason. The author will be notified by email.</p>
            <div>
              <Label className="text-sm mb-1.5 block">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt is unclear, incorrect amount, wrong account…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectionReason(""); }}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={processing === rejectTarget?.paper_id}
            >
              {processing === rejectTarget?.paper_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
