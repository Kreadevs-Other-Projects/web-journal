import { useEffect, useState, ChangeEvent } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookOpen, Users, Edit3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Journal {
  id: string;
  name: string;
  slug: string;
}

interface Paper {
  id: string;
  title: string;
  status: string;
}

interface AssignForm {
  userId: string;
}

export default function ChiefEditorDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignPaperId, setAssignPaperId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState<AssignForm>({ userId: "" });
  const [statusForm, setStatusForm] = useState<string>("");

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/cheifEditor/getChiefEditorJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch journals");
      }

      const data = await res.json();
      const journals = data.data ?? [];
      setJournals(journals);
    } catch (e) {
      toast({
        title: "Error",
        description: "Unable to load journals.",
        variant: "destructive",
      });
    }
  };

  const fetchPapers = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/cheifEditor/getPapers/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch papers");
      }

      const data = await res.json();
      setPapers(data.data ?? []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Unable to load papers for this journal.",
        variant: "destructive",
      });
    }
  };

  const handleAssignClick = (paperId: string) => {
    setAssignPaperId(paperId);
    setAssignForm({ userId: "" });
    setAssignModalOpen(true);
  };

  const submitAssignSubEditor = async () => {
    if (!assignPaperId) return;

    try {
      await fetch(`${url}/cheifEditor/assignSubEditor/${assignPaperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignForm),
      });

      setAssignModalOpen(false);

      toast({
        title: "Sub Editor Assigned",
        description: "The sub editor has been assigned successfully.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Assignment Failed",
        description: "Unable to assign sub editor.",
        variant: "destructive",
      });
    }
  };

  const submitAssignReviewer = async () => {
    if (!assignPaperId) return;

    try {
      await fetch(`${url}/cheifEditor/assignReviewer/${assignPaperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignForm),
      });

      setAssignModalOpen(false);

      toast({
        title: "Reviewer Assigned",
        description: "The reviewer has been assigned successfully.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Assignment Failed",
        description: "Unable to assign reviewer.",
        variant: "destructive",
      });
    }
  };

  const updatePaperStatus = async (paperId: string) => {
    if (!statusForm) {
      toast({
        title: "Status Required",
        description: "Please enter a status before updating.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetch(`${url}/cheifEditor/updatePaperStatus/${paperId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusForm }),
      });

      toast({
        title: "Status Updated",
        description: "Paper status has been updated successfully.",
      });

      setStatusForm("");
      if (selectedJournal) fetchPapers(selectedJournal.id);
    } catch (e) {
      console.error(e);
      toast({
        title: "Update Failed",
        description: "Could not update paper status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">
          Chief Editor Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((j) => (
            <Card key={j.id} className="glass-card">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setSelectedJournal(j);
                    fetchPapers(j.id);
                  }}
                >
                  <BookOpen className="h-5 w-5" /> {j.name}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {selectedJournal && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Papers in {selectedJournal.name}
            </h2>
            <div className="space-y-3">
              {papers.map((p) => (
                <Card key={p.id} className="glass-card">
                  <CardContent className="flex flex-col gap-2">
                    <p>
                      <strong>Title:</strong> {p.title}
                    </p>
                    <p>
                      <strong>Status:</strong> {p.status}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="btn-physics"
                        onClick={() => handleAssignClick(p.id)}
                      >
                        <Users className="h-4 w-4 mr-1" /> Assign
                      </Button>

                      <Input
                        placeholder="Update status"
                        value={statusForm}
                        onChange={(e) => setStatusForm(e.target.value)}
                        className="w-[150px]"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePaperStatus(p.id)}
                      >
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sub Editor / Reviewer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Label>User ID (Sub Editor or Reviewer)</Label>
            <Input
              value={assignForm.userId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAssignForm({ userId: e.target.value })
              }
              placeholder="Enter user ID"
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAssignSubEditor}>Assign Sub Editor</Button>
              <Button onClick={submitAssignReviewer}>Assign Reviewer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
