import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  status: string;
}

interface Journal {
  id: string;
  title: string;
}

const STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "published",
];

export default function Papers() {
  const { user, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [issues, setIssues] = useState<{ id: string; label: string }[]>([]);

  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState("submitted");

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [createdPaperId, setCreatedPaperId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardBrand: "visa",
    name: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    category: "",
    keywords: "",
    journal_id: "",
    issue_id: "",
  });

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
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load papers",
      });
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchPapers();
      fetchJournals();
    }
  }, [user, isLoading]);

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

      const paperId = data.data.id;
      setCreatedPaperId(paperId);

      const payRes = await fetch(
        `${url}/paperPayment/createPaperPayment/${paperId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message);

      setPaymentId(payData.payment.id);
      setPendingPayment(payData.payment);

      setOpen(false);
      setPaymentOpen(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submit Failed",
        description: err.message,
      });
    }
  };

  const confirmPayment = async () => {
    if (!paymentId) return;

    try {
      setPayLoading(true);

      const res = await fetch(
        `${url}/paperPayment/payPaperPayment/${paymentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transaction_id: "TX-" + Date.now(),
            provider: "manual",
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Payment Successful",
        description: "Paper submission completed",
      });

      setPaymentOpen(false);
      setPaymentForm({
        cardBrand: "visa",
        name: "",
        cardNumber: "",
        expiry: "",
        cvc: "",
      });
      fetchPapers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: err.message,
      });
    } finally {
      setPayLoading(false);
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

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Unauthorized</div>;

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Papers</h1>

          {user.role === "author" && (
            <Button onClick={() => setOpen(true)}>Submit Paper</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {p.abstract.slice(0, 120)}...
                </p>

                <p className="text-xs">
                  Status: <b>{p.status}</b>
                </p>

                {(user.role === "chief_editor" ||
                  user.role === "owner" ||
                  user.role === "publisher") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPaper(p);
                      setStatus(p.status);
                      setStatusOpen(true);
                    }}
                  >
                    Update Status
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Paper</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Abstract</Label>
              <Input
                placeholder="Abstract"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div>
              <Label>Keywords</Label>
              <Input
                placeholder="Keywords (comma separated)"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>

            <div>
              <Label>Journal</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.journal_id}
                onChange={(e) =>
                  setForm({ ...form, journal_id: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Journal
                </option>
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Journal Issue</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.issue_id}
                onChange={(e) => setForm({ ...form, issue_id: e.target.value })}
              >
                <option value="" disabled>
                  Select Issue
                </option>
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    Issue {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submitPaper}>Continue to Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Payment Details
              {pendingPayment ? (
                <span className="block text-sm text-muted-foreground font-normal mt-1">
                  Issue saved as <span className="font-semibold">Pending</span>.
                  Pay to activate.
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="glass-card p-4 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Pay for</p>
                  <p className="font-semibold truncate">
                    {pendingPayment?.paper_id || "Paper"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status after save:{" "}
                    <span className="font-semibold">Pending</span>
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Card</span>
                    <span className="text-xs font-semibold uppercase">
                      {paymentForm.cardBrand === "visa" ? "VISA" : "MASTERCARD"}
                    </span>
                  </div>
                  <div className="mt-4 text-sm tracking-widest text-foreground/90">
                    •••• •••• ••••{" "}
                    {paymentForm.cardNumber.replace(/\s/g, "").slice(-4) ||
                      "----"}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{paymentForm.name || "Cardholder"}</span>
                    <span>{paymentForm.expiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmPayment();
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentForm((p) => ({ ...p, cardBrand: "visa" }))
                  }
                  className={`btn-physics rounded-full px-3 py-1.5 text-xs font-semibold border ${paymentForm.cardBrand === "visa" ? "bg-primary/10 text-primary border-primary/30 glow-primary" : "bg-background/30 text-muted-foreground border-border/60"}`}
                >
                  VISA
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentForm((p) => ({ ...p, cardBrand: "mastercard" }))
                  }
                  className={`btn-physics rounded-full px-3 py-1.5 text-xs font-semibold border ${paymentForm.cardBrand === "mastercard" ? "bg-primary/10 text-primary border-primary/30 glow-primary" : "bg-background/30 text-muted-foreground border-border/60"}`}
                >
                  MasterCard
                </button>
              </div>

              <div className="text-left">
                <Label>Billing name</Label>
                <Input
                  placeholder="Name on card"
                  value={paymentForm.name}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="text-left">
                <Label>Card information</Label>
                <div className="mt-2 rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
                  <div className="px-4 py-3">
                    <Input
                      placeholder="1234 1234 1234 1234"
                      value={paymentForm.cardNumber}
                      onChange={(e) =>
                        setPaymentForm((p) => ({
                          ...p,
                          cardNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="h-px bg-border/60" />
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-3">
                      <Input
                        placeholder="MM / YY"
                        value={paymentForm.expiry}
                        onChange={(e) =>
                          setPaymentForm((p) => ({
                            ...p,
                            expiry: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="px-4 py-3 border-l border-border/60">
                      <Input
                        placeholder="CVC"
                        value={paymentForm.cvc}
                        onChange={(e) =>
                          setPaymentForm((p) => ({ ...p, cvc: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaymentOpen(false)}
                  disabled={payLoading}
                >
                  Pay later
                </Button>
                <Button
                  type="submit"
                  className="btn-physics"
                  disabled={payLoading}
                >
                  {payLoading ? "Processing..." : "Pay now"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Status</Label>
              <select
                className="w-full border rounded-md p-2 mt-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
