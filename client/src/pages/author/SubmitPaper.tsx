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

interface Paper {
  id: string;
  title: string;
  abstract: string;
  category?: string;
  keywords?: string[];
  status: string;
}

interface Journal {
  id: string;
  name: string;
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

  const [papers, setPapers] = useState<Paper[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const [issues, setIssues] = useState<{ id: string; issue_number: string }[]>(
    [],
  );
  const [chiefEditors, setChiefEditors] = useState<
    { id: string; username: string }[]
  >([]);
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    category: "",
    keywords: "",
    journal_id: "",
    issue_id: "",
    chief_editor_id: "",
  });

  const [status, setStatus] = useState("submitted");

  const fetchJournals = async () => {
    const res = await fetch(`${url}/journal/getJournals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setJournals(data.journals || []);
  };

  useEffect(() => {
    if (form.journal_id && token) {
      fetch(`${url}/journal-issue/getJournalIssues/${form.journal_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setIssues(data.issues || []));
    }
  }, [form.journal_id, token]);

  useEffect(() => {
    if (token) {
      fetch(`${url}/cheifEditor/getChiefEditors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setChiefEditors(data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching chief editors:", err);
        });
    }
  }, [token]);

  const fetchPapers = async () => {
    const endpoint =
      user?.role === "author"
        ? "/papers/getPapersByAuthor"
        : "/papers/getAllPapers";

    const res = await fetch(`${url}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setPapers(data.papers || []);
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchPapers();
      fetchJournals();
    }
  }, [user, isLoading]);

  const submitPaper = async () => {
    if (!form.journal_id || !form.chief_editor_id) {
      alert("Please select a journal and chief editor");
      return;
    }

    const payload: any = {
      title: form.title,
      abstract: form.abstract,
      category: form.category,
      journal_id: form.journal_id,
      chief_editor_id: form.chief_editor_id,
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    if (form.issue_id) {
      payload.issue_id = form.issue_id;
    }

    const res = await fetch(`${url}/papers/createPaper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Create paper error:", err);
      alert(err.message || "Failed to create paper");
      return;
    }

    setOpen(false);
    fetchPapers();
  };

  const updateStatus = async () => {
    if (!selectedPaper) return;

    await fetch(`${url}/papers/updatePaperStatus/${selectedPaper.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    setStatusOpen(false);
    fetchPapers();
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
            <Input
              placeholder="Title"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Abstract"
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
            <Input
              placeholder="Category"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="Keywords (comma separated)"
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            />

            <div>
              <Label>Journal</Label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) =>
                  setForm({ ...form, journal_id: e.target.value })
                }
              >
                <option value="">Select Journal</option>
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Journal Issue (optional)</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.issue_id}
                onChange={(e) => setForm({ ...form, issue_id: e.target.value })}
              >
                <option value="">Select Issue</option>
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    Issue {i.issue_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Chief Editor</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.chief_editor_id}
                onChange={(e) =>
                  setForm({ ...form, chief_editor_id: e.target.value })
                }
              >
                <option value="">Select Chief Editor</option>
                {chiefEditors?.map((ce) => (
                  <option key={ce.id} value={ce.id}>
                    {ce.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submitPaper}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>

          <select
            className="w-full border rounded-md p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <DialogFooter>
            <Button onClick={updateStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
