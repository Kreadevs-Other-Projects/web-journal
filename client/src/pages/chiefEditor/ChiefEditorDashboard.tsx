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

interface Reviewer {
  id: string;
  username: string;
  email: string;
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
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [openReviewers, setOpenReviewers] = useState(false);

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/chiefEditor/getChiefEditorJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch journals");
      }

      const data = await res.json();
      console.log(data.journal);

      const journals = data.journal ?? [];
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
      const res = await fetch(`${url}/chiefEditor/getPapers/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch papers");
      }

      const data = await res.json();
      console.log(data.papers);

      setPapers(data.papers ?? []);
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

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  const fetchReviewers = async (paperId: string) => {
    try {
      const res = await fetch(
        `${url}/subEditor/getReviewersForPaper/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setReviewers(data.data || []);
      setOpenReviewers(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load reviewers.",
        variant: "destructive",
      });
    }
  };

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
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fetchReviewers(p.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Assigned Reviewers
                      </Button>

                      <Input
                        placeholder="Update status"
                        value={statusForm}
                        onChange={(e) => setStatusForm(e.target.value)}
                        className="w-[150px]"
                      />
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePaperStatus(p.id)}
                      >
                        Update Status
                      </Button> */}
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
              {/* <Button onClick={submitAssignSubEditor}>Assign Sub Editor</Button>
              <Button onClick={submitAssignReviewer}>Assign Reviewer</Button> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openReviewers} onOpenChange={setOpenReviewers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigned Reviewers</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {reviewers.length === 0 ? (
              <p className="text-muted-foreground">
                No reviewers assigned yet.
              </p>
            ) : (
              reviewers.map((reviewer) => (
                <Card key={reviewer.id} className="p-3">
                  <p>
                    <strong>Name:</strong> {reviewer.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {reviewer.email}
                  </p>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenReviewers(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
