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
import {
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  authors?: string;
  created_at: string;
  status: string;
  abstract?: string;
}

interface Issue {
  id: string;
  year: number;
  volume?: number | null;
  issue?: number | null;
  label: string;
  journal_id: string;
}

interface Journal {
  id: string;
  name: string;
  slug: string;
}

export default function PublishPapersPage() {
  const { user, token } = useAuth();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [papers, setPapers] = useState<Paper[]>([]);

  const [loadingJournals, setLoadingJournals] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  const [publishForm, setPublishForm] = useState({
    issue_id: "",
    year_label: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchJournals = async () => {
    try {
      setLoadingJournals(true);
      const response = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setJournals(data.data || data.journals || []);
    } catch (error: any) {
      setMessage({ type: "error", text: "Failed to fetch journals" });
    } finally {
      setLoadingJournals(false);
    }
  };

  const fetchIssues = async (journalId: string) => {
    try {
      setLoadingIssues(true);
      setIssues([]);
      setSelectedIssueId("");
      setPapers([]);

      const response = await fetch(
        `${url}/journal-issue/getJournalIssues/${journalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error: any) {
      setMessage({ type: "error", text: "Failed to fetch issues" });
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchPapers = async (issueId: string) => {
    try {
      setLoadingPapers(true);
      setPapers([]);

      const response = await fetch(`${url}/publisher/papers/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      setPapers(data?.data?.papers ?? []);
    } catch (error: any) {
      setMessage({ type: "error", text: "Failed to fetch papers" });
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleJournalChange = (journalId: string) => {
    setSelectedJournalId(journalId);
    if (journalId) {
      fetchIssues(journalId);
    } else {
      setIssues([]);
      setSelectedIssueId("");
      setPapers([]);
    }
  };

  const handleIssueChange = (issueId: string) => {
    setSelectedIssueId(issueId);
    if (issueId) {
      fetchPapers(issueId);
    } else {
      setPapers([]);
    }
  };

  const handlePublish = async () => {
    if (!selectedPaper || !publishForm.issue_id) {
      setMessage({ type: "error", text: "Please select an issue" });
      return;
    }

    try {
      setPublishing(selectedPaper.id);
      setMessage({ type: "", text: "" });

      const response = await fetch(
        `${url}/publication/publishPaper/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(publishForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to publish paper");
      }

      setMessage({ type: "success", text: "Paper published successfully!" });
      setPublishModalOpen(false);
      setSelectedPaper(null);
      setPublishForm({ issue_id: "", year_label: "" });

      // Refresh papers list
      if (selectedIssueId) {
        fetchPapers(selectedIssueId);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPublishing(null);
    }
  };

  const openPublishModal = (paper: Paper) => {
    setSelectedPaper(paper);
    setPublishForm({
      issue_id: selectedIssueId,
      year_label: "",
    });
    setMessage({ type: "", text: "" });
    setPublishModalOpen(true);
  };

  useEffect(() => {
    if (user) {
      fetchJournals();
    }
  }, [user]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Publish Papers</h1>
          <p className="mt-2 text-muted-foreground">
            Select journal and issue to view and publish accepted papers
          </p>
        </div>

        {message.text && !publishModalOpen && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">
                  Select Journal <span className="text-red-500">*</span>
                </Label>
                {loadingJournals ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading journals...</span>
                  </div>
                ) : (
                  <select
                    value={selectedJournalId}
                    onChange={(e) => handleJournalChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a journal</option>
                    {journals?.map((journal) => (
                      <option key={journal.id} value={journal.id}>
                        {journal.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">
                  Select Issue <span className="text-red-500">*</span>
                </Label>
                {loadingIssues ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading issues...</span>
                  </div>
                ) : (
                  <select
                    value={selectedIssueId}
                    onChange={(e) => handleIssueChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={!selectedJournalId}
                  >
                    <option value="">
                      {selectedJournalId
                        ? "Select an issue"
                        : "Select a journal first"}
                    </option>
                    {issues?.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.label} ({issue.year})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Papers List */}
        {loadingPapers ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading papers...</p>
            </CardContent>
          </Card>
        ) : !selectedIssueId ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-white">
                Select Journal and Issue
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a journal and issue to view accepted papers
              </p>
            </CardContent>
          </Card>
        ) : papers.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-white">
                No accepted papers
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no accepted papers for this issue.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {papers?.map((paper) => (
              <Card key={paper.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-lg text-white">
                          {paper.title}
                        </span>
                      </div>
                      {paper.authors && (
                        <p className="text-sm font-normal text-muted-foreground mt-1">
                          {paper.authors}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => openPublishModal(paper)}>
                      Publish
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      Submitted:{" "}
                      {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                      <CheckCircle className="h-3 w-3" />
                      {paper.status}
                    </span>
                  </div>
                  {paper.abstract && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {paper.abstract}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Paper</DialogTitle>
          </DialogHeader>

          {selectedPaper && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Paper:</p>
                <p className="font-medium">{selectedPaper.title}</p>
              </div>

              {message.text && publishModalOpen && (
                <div
                  className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <Label>
                  Issue <span className="text-red-500">*</span>
                </Label>
                <select
                  value={publishForm.issue_id}
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, issue_id: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select an issue</option>
                  {issues?.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.label} ({issue.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Year Label (Optional)</Label>
                <Input
                  type="text"
                  value={publishForm.year_label}
                  onChange={(e) =>
                    setPublishForm({
                      ...publishForm,
                      year_label: e.target.value,
                    })
                  }
                  placeholder="e.g., 2024"
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setPublishModalOpen(false)}
                  disabled={publishing === selectedPaper.id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing === selectedPaper.id}
                >
                  {publishing === selectedPaper.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    "Publish Paper"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
