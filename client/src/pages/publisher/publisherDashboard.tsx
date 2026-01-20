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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookOpen, PlusCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { log } from "console";

interface Journal {
  id: string;
  name: string;
  slug: string;
  issn: string;
}

interface JournalIssue {
  id: string;
  year: number;
  volume?: number | null;
  issue?: number | null;
  label: string;
  published_at?: string | null;
}

export default function PublisherDashboard() {
  const { user, token } = useAuth();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [issuesByJournal, setIssuesByJournal] = useState<
    Record<string, JournalIssue[]>
  >({});

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);

  const [issueForm, setIssueForm] = useState({
    year: new Date().getFullYear(),
    volume: "",
    issue: "",
    label: "",
  });

  const fetchJournals = async () => {
    const res = await fetch(`${url}/publisher/getJournals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setJournals(json.data ?? []);
  };

  const fetchIssues = async (journalId: string) => {
    const res = await fetch(
      `${url}/journal-issue/getJournalIssues/${journalId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const json = await res.json();

    setIssuesByJournal((prev) => ({
      ...prev,
      [journalId]: json.issues ?? [],
    }));
  };

  const createIssue = async () => {
    if (!selectedJournal || !issueForm.label || !issueForm.year) {
      return;
    }

    try {
      const response = await fetch(
        `${url}/journal-issue/addJournalIssue/${selectedJournal}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            year: issueForm.year,
            volume: issueForm.volume ? Number(issueForm.volume) : null,
            issue: issueForm.issue ? Number(issueForm.issue) : null,
            label: issueForm.label,
          }),
        },
      );

      if (!response.ok) {
        return;
      }

      setIssueForm({
        year: new Date().getFullYear(),
        volume: "",
        issue: "",
        label: "",
      });

      setIssueModalOpen(false);

      await fetchIssues(selectedJournal);
    } catch (error) {}
  };

  const publishIssue = async (issueId: string, journalId: string) => {
    await fetch(`${url}/publisher/publishIssue/${issueId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchIssues(journalId);
  };

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  useEffect(() => {
    journals.forEach((j) => fetchIssues(j.id));
  }, [journals]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Publisher Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((j) => (
            <Card key={j.id} className="glass-card">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="flex gap-2 items-center">
                    <BookOpen className="h-5 w-5" />
                    {j.name}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedJournal(j.id);
                      setIssueModalOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Issue
                  </Button>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {issuesByJournal[j.id]?.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No issues created
                  </p>
                )}

                {issuesByJournal[j.id]?.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex justify-between items-center bg-background/40 rounded-lg p-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{issue.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.year}
                        {issue.volume && ` • Vol ${issue.volume}`}
                        {issue.issue && ` • Issue ${issue.issue}`}
                      </p>
                    </div>

                    {issue.published_at ? (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Published
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => publishIssue(issue.id, j.id)}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Journal Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={issueForm.year}
                onChange={(e) =>
                  setIssueForm((p) => ({
                    ...p,
                    year: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label>Volume (optional)</Label>
              <Input
                value={issueForm.volume}
                onChange={(e) =>
                  setIssueForm((p) => ({ ...p, volume: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Issue (optional)</Label>
              <Input
                value={issueForm.issue}
                onChange={(e) =>
                  setIssueForm((p) => ({ ...p, issue: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Label</Label>
              <Input
                placeholder="Vol 1, Issue 1 (2026)"
                value={issueForm.label}
                onChange={(e) =>
                  setIssueForm((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createIssue}>Create Issue</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
