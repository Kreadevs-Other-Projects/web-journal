import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle2, Circle, Clock, BookOpen, ExternalLink, Loader2, FileText, CreditCard, AlertTriangle } from "lucide-react";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface PaymentRecord {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
  rejection_reason?: string;
}

interface TrackingData {
  paper: {
    id: string;
    title: string;
    status: string;
    submitted_at?: string;
    accepted_at?: string;
    published_at?: string;
    updated_at?: string;
    abstract?: string;
    category?: string;
    keywords?: string[];
    author_names?: string[];
    corresponding_authors?: string[];
    journal_title: string;
    issue_label?: string;
    issue_volume?: number;
    issue_number?: number;
    issue_year?: number;
  };
  status_log: Array<{
    status: string;
    changed_at: string;
  }>;
  reviews: Array<{
    decision: string;
    comments: string;
    submitted_at: string;
  }>;
  publication?: {
    doi?: string;
    published_at?: string;
    issue_label?: string;
    volume?: number;
    year?: number;
  } | null;
  latest_version_number: number;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "decision", label: "Decision" },
  { key: "published", label: "Published" },
];

function getStageIndex(status: string): number {
  if (status === "awaiting_payment" || status === "payment_review") return 0;
  if (status === "submitted" || status === "assigned_to_sub_editor") return 0;
  if (status === "under_review" || status === "resubmitted" || status === "pending_revision") return 1;
  if (status === "accepted" || status === "rejected") return 2;
  if (status === "published") return 3;
  return 0;
}

export default function TrackPaper() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const fetchTracking = () => {
    fetch(`${url}/papers/${paperId}/tracking`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchPayment = () => {
    fetch(`${url}/payments/paper/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPayment(d.payment); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTracking();
    fetchPayment();
  }, [paperId, token]);

  const handleRevisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "tex", "latex"].includes(ext || "")) {
      toast({ title: "Invalid file", description: "Only .docx, .pdf and .tex/.latex allowed.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("manuscript", file);
      fd.append("version_number", String((data?.latest_version_number || 1) + 1));
      const res = await fetch(`${url}/papers/${paperId}/revision`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const resp = await res.json();
      if (!resp.success) throw new Error(resp.message || "Upload failed");
      toast({ title: "Revision submitted", description: "Your revised manuscript has been uploaded." });
      fetchTracking();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "pdf"].includes(ext || "")) {
      toast({ title: "Invalid file", description: "Only JPG, PNG or PDF receipts accepted.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append("receipt", file);
      const res = await fetch(`${url}/payments/paper/${paperId}/upload-receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const resp = await res.json();
      if (!resp.success) throw new Error(resp.message || "Upload failed");
      toast({ title: "Receipt uploaded", description: "Awaiting publisher review." });
      fetchTracking();
      fetchPayment();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
      if (receiptRef.current) receiptRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={(user?.role as UserRole) ?? "author"} userName={user?.username}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout role={(user?.role as UserRole) ?? "author"} userName={user?.username}>
        <div className="p-6 text-center text-muted-foreground">Paper not found.</div>
      </DashboardLayout>
    );
  }

  const { paper, status_log, reviews, publication } = data;
  const currentStageIdx = getStageIndex(paper.status);

  return (
    <DashboardLayout role={(user?.role as UserRole) ?? "author"} userName={user?.username}>
      <PageTransition>
        <div className="p-6 max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/author")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>

          {/* Header */}
          <div className="mb-6 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> {paper.journal_title}
              </span>
              {(paper.issue_label || (paper.issue_volume && paper.issue_number)) && (
                <span className="text-sm text-muted-foreground">
                  · {paper.issue_label || `Vol ${paper.issue_volume}, Issue ${paper.issue_number}`}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-snug">{paper.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{paper.status.replace(/_/g, " ")}</Badge>
              {paper.status === "accepted" && <Badge className="bg-green-600 text-white">Accepted</Badge>}
              {paper.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
              {paper.category && <Badge variant="outline">{paper.category}</Badge>}
            </div>
          </div>

          {/* Payment Banner — shown whenever paper needs payment, with or without payment record loaded */}
          {(paper.status === "awaiting_payment" || paper.status === "payment_review") && (
            <Card className="mb-6 border-orange-400/40 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <CreditCard className="h-4 w-4" />
                  Payment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {/* Invoice details — only when payment record is loaded */}
                {payment ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 bg-white dark:bg-muted/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice #</p>
                      <p className="font-mono font-semibold text-xs mt-0.5">{payment.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Due</p>
                      <p className="font-bold text-base text-orange-700 dark:text-orange-400">{payment.currency} {Number(payment.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className="mt-0.5 bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100">
                        {payment.status === "payment_review" ? "Under Review" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Your invoice is being generated. Please refresh in a moment.</p>
                )}

                {/* Rejection notice */}
                {payment?.status === "failed" && payment.rejection_reason && (
                  <div className="flex gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Receipt Rejected</p>
                      <p className="text-xs mt-0.5">{payment.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Upload section — always show when awaiting_payment */}
                {paper.status === "awaiting_payment" && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">After completing the bank transfer, upload your payment receipt below:</p>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => receiptRef.current?.click()}
                        disabled={uploadingReceipt}
                        className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {uploadingReceipt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        {uploadingReceipt ? "Uploading…" : "Upload Receipt"}
                      </Button>
                      <span className="text-xs text-muted-foreground">JPG, PNG or PDF · max 5MB</span>
                    </div>
                    <input ref={receiptRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleReceiptUpload} />
                  </div>
                )}

                {/* Already uploaded */}
                {paper.status === "payment_review" && payment?.receipt_uploaded_at && (
                  <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Receipt submitted — awaiting publisher approval</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Uploaded on {formatDate(payment.receipt_uploaded_at)}</p>
                    </div>
                  </div>
                )}

                {/* payment_review but no receipt timestamp — generic message */}
                {paper.status === "payment_review" && !payment?.receipt_uploaded_at && (
                  <div className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Your receipt is under review.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Submission Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-start gap-0">
                {STAGES.map((stage, i) => {
                  const completed = i < currentStageIdx;
                  const active = i === currentStageIdx;
                  const logEntry = status_log.find((l) => {
                    if (stage.key === "submitted") return l.status === "submitted";
                    if (stage.key === "under_review") return l.status === "under_review" || l.status === "assigned_to_sub_editor";
                    if (stage.key === "decision") return l.status === "accepted" || l.status === "rejected" || l.status === "pending_revision";
                    if (stage.key === "published") return l.status === "published";
                    return false;
                  });
                  return (
                    <div key={stage.key} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        {i > 0 && <div className={`flex-1 h-0.5 ${completed || active ? "bg-primary" : "bg-muted"}`} />}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${completed ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"}`}>
                          {completed ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </div>
                        {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 ${completed ? "bg-primary" : "bg-muted"}`} />}
                      </div>
                      <div className="mt-2 text-center px-1">
                        <p className={`text-xs font-medium ${active ? "text-primary" : completed ? "text-foreground" : "text-muted-foreground"}`}>{stage.label}</p>
                        {logEntry && <p className="text-xs text-muted-foreground mt-0.5">{formatDate(logEntry.changed_at)}</p>}
                        {stage.key === "published" && publication?.doi && (
                          <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-center gap-0.5 mt-0.5">
                            DOI <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Date stamps */}
          <Card className="mb-6">
            <CardContent className="p-4 grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs">Submitted</p><p className="font-medium">{formatDate(paper.submitted_at)}</p></div>
              <div><p className="text-muted-foreground text-xs">Last Updated</p><p className="font-medium">{formatDate(paper.updated_at)}</p></div>
              <div><p className="text-muted-foreground text-xs">{paper.status === "published" ? "Published" : "Accepted"}</p><p className="font-medium">{formatDate(paper.status === "published" ? paper.published_at : paper.accepted_at)}</p></div>
            </CardContent>
          </Card>

          {/* Paper Details */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Paper Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {paper.author_names && paper.author_names.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Authors</p>
                  <p>{paper.author_names.join(", ")}</p>
                </div>
              )}
              {paper.corresponding_authors && paper.corresponding_authors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Corresponding Author(s)</p>
                  <p>{paper.corresponding_authors.join(", ")}</p>
                </div>
              )}
              {paper.keywords && paper.keywords.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {paper.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {paper.abstract && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Abstract</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{paper.abstract}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Feedback (blind) */}
          {reviews.length > 0 && (
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Review Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Reviewer {i + 1} · {formatDate(r.submitted_at)}</span>
                      <Badge variant={r.decision === "accept" ? "default" : r.decision === "reject" ? "destructive" : "secondary"}>
                        {r.decision}
                      </Badge>
                    </div>
                    {r.comments && <p className="text-sm text-muted-foreground leading-relaxed">{r.comments}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upload Revision */}
          {paper.status === "pending_revision" && (
            <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
              <CardHeader><CardTitle className="text-base text-amber-700 dark:text-amber-400">Revision Required</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">The editors have requested a revision. Please address the review comments and upload a revised manuscript.</p>
                <div>
                  <Button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading…" : "Upload Revision"}
                  </Button>
                  <input ref={fileRef} type="file" className="hidden" accept=".docx,.pdf,.tex,.latex" onChange={handleRevisionUpload} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publication info */}
          {publication && (
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Publication Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="space-y-1">
                  {publication.issue_label && <p><span className="text-muted-foreground">Issue:</span> {publication.issue_label}</p>}
                  {publication.volume && <p><span className="text-muted-foreground">Volume:</span> {publication.volume}</p>}
                  {publication.year && <p><span className="text-muted-foreground">Year:</span> {publication.year}</p>}
                  {publication.doi && (
                    <p><span className="text-muted-foreground">DOI:</span>{" "}
                      <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{publication.doi}</a>
                    </p>
                  )}
                </div>
                {paper.status === "published" && (
                  <Link to={`/articles/${paper.id}`}>
                    <Button className="gap-2 w-full sm:w-auto">
                      <FileText className="h-4 w-4" /> View Published Article
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Published but no publication record yet */}
          {paper.status === "published" && !publication && (
            <div className="mt-4">
              <Link to={`/articles/${paper.id}`}>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" /> View Published Article
                </Button>
              </Link>
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
