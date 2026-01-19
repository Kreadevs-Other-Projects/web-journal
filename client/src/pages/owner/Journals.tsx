import { useEffect, useState } from "react";
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
import { Plus, BookOpen, Link, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import JournalIssuesPage from "@/components/JournalIssues";

interface Journal {
  id: string;
  name: string;
  slug: string;
  description?: string;
  issn: string;
  website_url?: string;
  created_at: string;
}

interface JournalForm {
  name: string;
  slug: string;
  description: string;
  issn: string;
  website_url: string;
}

const generateSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function Journals(): JSX.Element {
  const { user, token, isLoading } = useAuth();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  const [form, setForm] = useState<JournalForm>({
    name: "",
    slug: "",
    description: "",
    issn: "",
    website_url: "",
  });

  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [currentJournalName, setCurrentJournalName] = useState("");

  const fetchJournals = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${url}/publisher/journal/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJournals(data.journals ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isLoading && user) fetchJournals();
  }, [user, isLoading]);

  const createJournal = async () => {
    setLoading(true);
    try {
      await fetch(`${url}/publisher/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm({
        name: "",
        slug: "",
        description: "",
        issn: "",
        website_url: "",
      });
      fetchJournals();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateJournal = async () => {
    if (!selectedJournal) return;
    setLoading(true);
    try {
      await fetch(`${url}/journal/updateJournal/${selectedJournal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      setEditOpen(false);
      setSelectedJournal(null);
      fetchJournals();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async () => {
    if (!selectedJournal) return;
    setLoading(true);
    try {
      await fetch(`${url}/journal/deleteJournal/${selectedJournal.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteOpen(false);
      setSelectedJournal(null);
      fetchJournals();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openJournalIssues = (id: string, name: string) => {
    setCurrentJournalId(id);
    setCurrentJournalName(name);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Unauthorized</div>;

  if (currentJournalId)
    return (
      <JournalIssuesPage
        journalId={currentJournalId}
        journalName={currentJournalName}
        token={token}
        onBack={() => setCurrentJournalId(null)}
      />
    );

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Journals</h1>
          <Button onClick={() => setOpen(true)} className="btn-physics">
            <Plus className="h-4 w-4 mr-2" />
            New Journal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((j) => (
            <Card key={j.id} className="glass-card">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => openJournalIssues(j.id, j.name)}
                >
                  <BookOpen className="h-5 w-5" />
                  {j.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-xs">Slug: {j.slug}</p>
                <p className="text-xs">ISSN: {j.issn}</p>
                {j.website_url && (
                  <a
                    href={j.website_url}
                    target="_blank"
                    className="flex items-center gap-1 text-sm text-primary"
                  >
                    <Link className="h-4 w-4" />
                    Website
                  </a>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedJournal(j);
                      setForm({
                        name: j.name,
                        slug: j.slug,
                        description: j.description ?? "",
                        issn: j.issn,
                        website_url: j.website_url ?? "",
                      });
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedJournal(j);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={open || editOpen}
        onOpenChange={() => {
          setOpen(false);
          setEditOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editOpen ? "Edit Journal" : "Create Journal"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Journal Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Slug (auto)</Label>
              <Input value={form.slug} disabled />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>ISSN</Label>
              <Input
                value={form.issn}
                onChange={(e) => setForm({ ...form, issn: e.target.value })}
              />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={form.website_url}
                onChange={(e) =>
                  setForm({ ...form, website_url: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editOpen ? updateJournal : createJournal}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{" "}
            <strong>{selectedJournal?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteJournal}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
