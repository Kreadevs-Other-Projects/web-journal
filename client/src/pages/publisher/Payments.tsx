import { useEffect, useState } from "react";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X } from "lucide-react";

interface Payment {
  id: string;
  issue_id: string | null;
  amount: number;
  status: string;
  transaction_pic: string | null;
  created_at: string;
}

export default function Payments({ journalId }: { journalId: string }) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${url}/publisher/getJournalPayments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPayments(data.data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [journalId]);

  const updateStatus = async (id: string, status: "success" | "failed") => {
    try {
      setProcessingId(id);
      const res = await fetch(`${url}/publisher/updatePaymentStatus/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );

      toast({
        title: "Success",
        description: `Payment ${status} successfully`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Action failed",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-white font-bold">Journal Payments</h1>
          <p className="text-muted-foreground text-sm">
            Review and manage journal payments
          </p>
        </div>

        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {payments.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex justify-between items-center">
                    {p.issue_id
                      ? `Issue #${p.issue_id}`
                      : "First Issue / Renewal"}
                    <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Amount:</span>{" "}
                      <strong>{p.amount} PKR</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Date:</span>{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.transaction_pic && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedReceipt(`${url}${p.transaction_pic}`)
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    )}

                    {p.status === "pending" && (
                      <div className="flex gap-2 ml-auto">
                        <Button
                          size="sm"
                          disabled={processingId === p.id}
                          onClick={() => updateStatus(p.id, "success")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === p.id}
                          onClick={() => updateStatus(p.id, "failed")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <img
              src={selectedReceipt}
              alt="Transaction receipt"
              className="w-full rounded-md max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
