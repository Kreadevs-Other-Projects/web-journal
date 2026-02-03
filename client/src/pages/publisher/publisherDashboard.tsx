import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
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
}

export default function PublisherDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchJournals = async () => {
    try {
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
        title: "Approved",
        description: "Journal approved and invoice sent",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Approval failed",
      });
    }
  };

  const sendInvoice = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/publisher/sendInvoice/${journalId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to send invoice");
      toast({
        title: "Invoice Sent",
        description: "Invoice sent to the journal owner",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Invoice Failed",
        description: err.message || "Could not send invoice",
      });
    }
  };

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Publisher Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((journal) => (
            <Card
              key={journal.id}
              className="glass-card cursor-pointer"
              onClick={() => {
                setSelectedJournal(journal);
                setDetailsModalOpen(true);
              }}
            >
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <BookOpen className="h-5 w-5" />
                  {journal.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Status: {journal.status}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Journal Details</DialogTitle>
            </DialogHeader>

            {selectedJournal && (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {selectedJournal.name}
                </p>
                <p>
                  <strong>ISSN:</strong> {selectedJournal.issn}
                </p>
                <p>
                  <strong>Description:</strong> {selectedJournal.description}
                </p>
                <p>
                  <strong>Status:</strong> {selectedJournal.status}
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  {selectedJournal.website_url || "N/A"}
                </p>
                <p>
                  <strong>Owner ID:</strong> {selectedJournal.owner_id}
                </p>
                <p>
                  <strong>Chief Editor ID:</strong>{" "}
                  {selectedJournal.chief_editor_id}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedJournal.created_at).toLocaleString()}
                </p>
                {selectedJournal.updated_at && (
                  <p>
                    <strong>Updated At:</strong>{" "}
                    {new Date(selectedJournal.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button onClick={() => approveJournal(selectedJournal!.id)}>
                Approve
              </Button>
              {/* <Button
                onClick={() => sendInvoice(selectedJournal!.id)}
                variant="secondary"
              >
                Send Invoice
              </Button> */}
              <Button
                variant="ghost"
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
