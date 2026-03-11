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

  /* PAYMENT_DISABLED: Payment step hidden per client instruction */
  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-white font-bold">Journal Payments</h1>
          <p className="text-muted-foreground text-sm">
            Payment management is temporarily unavailable.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
