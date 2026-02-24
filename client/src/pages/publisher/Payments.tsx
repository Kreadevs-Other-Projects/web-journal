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
import { Eye } from "lucide-react";

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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${url}/publisher/getJournalPayments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log(data);

      if (!res.ok) throw new Error(data.message || "Failed to fetch payments");
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
      <div className="space-y-4">
        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length === 0 ? (
          <p>No payments found for this journal.</p>
        ) : (
          payments.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>
                  {p.issue_id ? `Issue ${p.issue_id}` : "First Issue / Renewal"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <p>Amount: {p.amount} PKR</p>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                  </div>
                  <p>Created: {new Date(p.created_at).toLocaleDateString()}</p>
                </div>

                {p.transaction_pic ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedReceipt(`${url}${p.transaction_pic}`)
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Receipt
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No receipt uploaded
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <img
              src={selectedReceipt}
              alt="Transaction receipt"
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
