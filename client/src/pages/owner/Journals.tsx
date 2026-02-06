import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
import {
  Plus,
  BookOpen,
  Link as LinkIcon,
  Pencil,
  Trash2,
  FilePlus2,
  Edit3,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { generateAcronym } from "../../../../server/src/utils/acronym";

interface Journal {
  id: string;
  title: string;
  acronym: string;
  description?: string;
  issn: string;
  website_url?: string;
  created_at: string;
}

interface JournalForm {
  title: string;
  acronym: string;
  description: string;
  issn: string;
  website_url: string;
  chief_editor_id: string;
}

interface JournalIssue {
  id: string;
  journal_id: string;
  year: number;
  volume?: number | null;
  issue?: number | null;
  label: string;
  published_at?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at?: string;
}

interface Publisher {
  id: string;
  username: string;
  role: string;
  status: string;
}

const isActiveIssue = (issue: JournalIssue) =>
  issue?.is_active === true || issue?.status === "active";

export default function Journals(): JSX.Element {
  const { user, token, isLoading } = useAuth();
  const { toast } = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [issuesModalOpen, setIssuesModalOpen] = useState(false);
  const [selectedJournalIssues, setSelectedJournalIssues] = useState<
    JournalIssue[]
  >([]);

  const [chiefEditors, setChiefEditors] = useState<Publisher[]>([]);

  const [form, setForm] = useState<JournalForm>({
    title: "",
    acronym: "",
    description: "",
    issn: "",
    website_url: "",
    chief_editor_id: "",
  });

  const [issuesLoading, setIssuesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<JournalIssue | null>(null);
  const [activeJournalForIssue, setActiveJournalForIssue] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [issuesByJournal, setIssuesByJournal] = useState<
    Record<string, JournalIssue[]>
  >({});

  const [issueForm, setIssueForm] = useState({
    year: new Date().getFullYear(),
    volume: "",
    issue: "",
    label: "",
    published_at: "",
  });

  const [newJournalModalOpen, setNewJournalModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"journal" | "chief-editor">(
    "journal",
  );

  const [newChiefEditorForm, setNewChiefEditorForm] = useState({
    username: "",
    email: "",
  });
  const [creatingChiefEditor, setCreatingChiefEditor] = useState(false);

  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [currentJournalName, setCurrentJournalName] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingPaymentIssue, setPendingPaymentIssue] =
    useState<JournalIssue | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    cardBrand: "visa" as "visa" | "mastercard",
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const fetchJournals = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${url}/journal/getOwnerJournal/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const list: Journal[] = data.journals ?? [];
        setJournals(list);
      } else {
        toast({
          title: "Failed to fetch journals",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error fetching journals",
        description: e.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const openJournalIssues = async (id: string, name: string) => {
    setCurrentJournalId(id);
    setCurrentJournalName(name);
    setIssuesModalOpen(true);

    try {
      const res = await fetch(`${url}/journal-issue/getJournalIssues/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSelectedJournalIssues(data.issues || []);
      } else {
        toast({
          title: "Failed to fetch issues",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const fetchIssuesForJournal = async (journalId: string) => {
    setIssuesLoading(true);
    try {
      const res = await fetch(
        `${url}/journal-issue/getJournalIssues/${journalId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();

      if (data.success) {
        const list: JournalIssue[] = data.issues ?? [];
        setIssuesByJournal((prev) => ({ ...prev, [journalId]: list }));
        return list;
      } else {
        toast({
          title: "Failed to fetch issues",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error fetching issues",
        description: e.message || "Something went wrong.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchAllIssuesForCards = async (list: Journal[]) => {
    if (!list.length) return;
    try {
      await Promise.all(list.map((j) => fetchIssuesForJournal(j.id)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      (async () => {
        await fetchJournals();
        await fetchChiefEditors();
      })();
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (journals.length && token) {
      fetchAllIssuesForCards(journals);
    }
  }, [journals.length, token]);

  const fetchChiefEditors = async () => {
    try {
      const res = await fetch(`${url}/owner/getChief-Editor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setChiefEditors(data.data);
      } else {
        toast({
          title: "Failed to fetch chief editor",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error fetching chief editor",
        description: e.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const createJournal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${url}/journal/addJournal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors && data.errors.length) {
          data.errors.forEach((err: any) => {
            toast({
              title: `Error in ${err.field.replace("body.", "")}`,
              description: err.message,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Journal created",
        description: "Journal saved successfully",
      });

      setNewJournalModalOpen(false);
      setForm({
        title: "",
        acronym: "",
        description: "",
        issn: "",
        website_url: "",
        chief_editor_id: "",
      });

      await fetchJournals();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJournal = async () => {
    if (!selectedJournal) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${url}/journal/updateJournal/${selectedJournal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Journal Updated",
          description: `${form.title} has been successfully updated.`,
        });

        setEditOpen(false);
        setSelectedJournal(null);
        await fetchJournals();
      } else {
        throw new Error(data.message || "Failed to update journal");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e.message || "Failed to update journal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async () => {
    if (!selectedJournal) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${url}/journal/deleteJournal/${selectedJournal.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Journal Deleted",
          description: `${selectedJournal.title} has been removed.`,
        });

        setDeleteOpen(false);
        setSelectedJournal(null);
        await fetchJournals();
      } else {
        throw new Error(data.message || "Failed to delete journal");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e.message || "Failed to delete journal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIssueChange = (e: ChangeEvent<HTMLInputElement>) =>
    setIssueForm({ ...issueForm, [e.target.name]: e.target.value });

  const resetIssueForm = () => {
    setEditingIssue(null);
    setIssueForm({
      year: new Date().getFullYear(),
      volume: "",
      issue: "",
      label: "",
      published_at: "",
    });
  };

  const openApplyIssueModal = async (journal: Journal) => {
    setActiveJournalForIssue({ id: journal.id, name: journal.title });
    resetIssueForm();
    setModalOpen(true);

    await fetchIssuesForJournal(journal.id);
  };

  const openEditActiveIssueModal = async (journal: Journal) => {
    setActiveJournalForIssue({ id: journal.id, name: journal.title });

    const list =
      issuesByJournal[journal.id] ?? (await fetchIssuesForJournal(journal.id));
    const active = list.find(isActiveIssue);

    if (!active) {
      resetIssueForm();
      setModalOpen(true);
      return;
    }

    setEditingIssue(active);
    setIssueForm({
      year: active.year,
      volume: active.volume?.toString() || "",
      issue: active.issue?.toString() || "",
      label: active.label || "",
      published_at: active.published_at || "",
    });
    setModalOpen(true);
  };

  const handleIssueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeJournalForIssue?.id) return;

    const journalId = activeJournalForIssue.id;

    setIssuesLoading(true);
    try {
      const endpoint = editingIssue
        ? `${url}/journal-issue/updateJournalIssue/${editingIssue.id}`
        : `${url}/journal-issue/addJournalIssue/${journalId}`;
      const method = editingIssue ? "PUT" : "POST";

      const payload: any = {
        ...issueForm,
        year: Number(issueForm.year),
        volume: issueForm.volume ? Number(issueForm.volume) : undefined,
        issue: issueForm.issue ? Number(issueForm.issue) : undefined,
        published_at: issueForm.published_at || undefined,
        label: issueForm.label?.trim(),
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        await fetchIssuesForJournal(journalId);

        toast({
          title: editingIssue ? "Issue Updated" : "Issue Created",
          description: `Issue for ${activeJournalForIssue.name} has been saved.`,
        });

        setModalOpen(false);

        if (!editingIssue) {
          let createdIssue: JournalIssue | null =
            data.issue ?? data.journalIssue ?? data.createdIssue ?? null;

          if (!createdIssue) {
            const list = await fetchIssuesForJournal(journalId);
            createdIssue = list?.[0] ?? null;
          }

          setPendingPaymentIssue(createdIssue);
          setPaymentOpen(true);
        }

        setEditingIssue(null);
        setActiveJournalForIssue(null);
        setIssueForm({
          year: new Date().getFullYear(),
          volume: "",
          issue: "",
          label: "",
          published_at: "",
        });
      } else {
        throw new Error(data.message || "Failed to save issue");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to save issue",
        variant: "destructive",
      });
    } finally {
      setIssuesLoading(false);
    }
  };

  const journalHasActiveIssue = (journalId: string) => {
    const list = issuesByJournal[journalId] ?? [];
    return list.some(isActiveIssue);
  };

  const handleCreateChiefEditor = async () => {
    setCreatingChiefEditor(true);
    try {
      const res = await fetch(`${url}/owner/createChiefEditor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newChiefEditorForm),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create Chief Editor");
      }

      toast({
        title: "Chief Editor Created",
        description: `Password: ${data.password} (shown only once)`,
      });

      setNewChiefEditorForm({ username: "", email: "" });
      await fetchChiefEditors();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreatingChiefEditor(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Unauthorized</div>;

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">Journals</h1>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setModalMode("chief-editor");
                setNewJournalModalOpen(true);
              }}
              className="btn-physics flex items-center gap-2 px-4 py-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Chief Editor
            </Button>

            <Button
              onClick={() => {
                setModalMode("journal");
                setNewJournalModalOpen(true);
              }}
              className="btn-physics flex items-center gap-2 px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              New Journal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((j) => {
            const hasActive = journalHasActiveIssue(j.id);

            return (
              <Card key={j.id} className="glass-card">
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => openJournalIssues(j.id, j.title)}
                  >
                    <BookOpen className="h-5 w-5" />
                    {j.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                  <p className="text-xs">Acronym: {j.acronym}</p>
                  <p className="text-xs">ISSN: {j.issn}</p>

                  {j.website_url ? (
                    <a
                      href={j.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-primary"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Website
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Website: <span className="italic">Optional</span>
                    </p>
                  )}

                  <div className="pt-2">
                    {!hasActive ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full btn-physics"
                        onClick={() => openApplyIssueModal(j)}
                      >
                        <FilePlus2 className="h-4 w-4 mr-2" />
                        Apply for Issue
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full btn-physics"
                        onClick={() => openEditActiveIssueModal(j)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Issue
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedJournal(j);
                        setForm({
                          title: j.title,
                          acronym: j.acronym,
                          description: j.description ?? "",
                          issn: j.issn,
                          website_url: j.website_url ?? "",
                          chief_editor_id: (j as any).chief_editor_id ?? "",
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
            );
          })}
        </div>
      </div>

      <Dialog open={newJournalModalOpen} onOpenChange={setNewJournalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "journal" ? "Create Journal" : "Add Chief Editor"}
            </DialogTitle>
          </DialogHeader>

          {modalMode === "journal" ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Journal Title</Label>
                  <Input
                    placeholder="e.g., International Journal of Computing"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                        acronym: generateAcronym(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>
                    Acronym{" "}
                    <span className="text-muted-foreground text-xs">
                      (Auto-generated)
                    </span>
                  </Label>
                  <Input
                    placeholder="Auto-generated from title"
                    value={form.acronym}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label>
                    Description{" "}
                    <span className="text-muted-foreground text-xs">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    placeholder="Short description about the journal (optional)"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>ISSN</Label>
                  <Input
                    placeholder="e.g., 1234-5678"
                    value={form.issn}
                    onChange={(e) => setForm({ ...form, issn: e.target.value })}
                  />
                </div>

                <div>
                  <Label>
                    Website URL{" "}
                    <span className="text-muted-foreground text-xs">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    placeholder="e.g., https://journalwebsite.com (optional)"
                    value={form.website_url}
                    onChange={(e) =>
                      setForm({ ...form, website_url: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Chief Editor</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.chief_editor_id}
                    onChange={(e) =>
                      setForm({ ...form, chief_editor_id: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select Chief Editor
                    </option>
                    {chiefEditors.length > 0 ? (
                      chiefEditors.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username}
                        </option>
                      ))
                    ) : (
                      <option disabled>No Chief Editor found</option>
                    )}
                  </select>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setNewJournalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createJournal}
                  disabled={!form.chief_editor_id || loading}
                >
                  {loading ? "Saving..." : "Save Journal"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Username</Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={newChiefEditorForm.username}
                    onChange={(e) =>
                      setNewChiefEditorForm({
                        ...newChiefEditorForm,
                        username: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    placeholder="e.g., john@example.com"
                    type="email"
                    value={newChiefEditorForm.email}
                    onChange={(e) =>
                      setNewChiefEditorForm({
                        ...newChiefEditorForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setNewJournalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChiefEditor}
                  disabled={
                    creatingChiefEditor ||
                    !newChiefEditorForm.username ||
                    !newChiefEditorForm.email
                  }
                >
                  {creatingChiefEditor ? "Creating..." : "Create Chief Editor"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Journal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Journal Title</Label>
              <Input
                placeholder="e.g., International Journal of Computing"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    acronym: generateAcronym(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>
                Acronym{" "}
                <span className="text-muted-foreground text-xs">
                  (Auto-generated)
                </span>
              </Label>
              <Input
                placeholder="Auto-generated from title"
                value={form.acronym}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <Label>
                Description{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                placeholder="Short description about the journal (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>ISSN</Label>
              <Input
                placeholder="e.g., 1234-5678"
                value={form.issn}
                onChange={(e) => setForm({ ...form, issn: e.target.value })}
              />
            </div>

            <div>
              <Label>
                Website URL{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                placeholder="e.g., https://journalwebsite.com (optional)"
                value={form.website_url}
                onChange={(e) =>
                  setForm({ ...form, website_url: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Chief Editor</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.chief_editor_id}
                onChange={(e) =>
                  setForm({ ...form, chief_editor_id: e.target.value })
                }
              >
                <option value="">Select Chief Editor</option>
                {chiefEditors.length > 0 ? (
                  chiefEditors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username}
                    </option>
                  ))
                ) : (
                  <option disabled>No Chief Editor found</option>
                )}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={updateJournal}
              disabled={!form.chief_editor_id || loading}
            >
              {loading ? "Saving..." : "Update Journal"}
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
            <strong>{selectedJournal?.title}</strong>? This cannot be undone.
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIssue ? "Edit Issue" : "Add Issue"}
              {activeJournalForIssue?.name ? (
                <span className="block text-sm text-muted-foreground font-normal mt-1">
                  Journal: {activeJournalForIssue.name}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleIssueSubmit} className="space-y-3">
            <div>
              <Label>Year</Label>
              <Input
                name="year"
                placeholder="e.g., 2026"
                value={issueForm.year}
                onChange={handleIssueChange}
              />
            </div>

            <div>
              <Label>
                Volume{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                name="volume"
                placeholder="e.g., 1"
                value={issueForm.volume}
                onChange={handleIssueChange}
              />
            </div>

            <div>
              <Label>
                Issue{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                name="issue"
                placeholder="e.g., 2"
                value={issueForm.issue}
                onChange={handleIssueChange}
              />
            </div>

            <div>
              <Label>Label</Label>
              <Input
                name="label"
                placeholder="e.g., Special Issue on AI"
                value={issueForm.label}
                onChange={handleIssueChange}
              />
            </div>

            <div>
              <Label>
                Published At{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Input
                type="datetime-local"
                name="published_at"
                value={issueForm.published_at}
                onChange={handleIssueChange}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={issuesLoading}>
                {issuesLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-left">
              Payment Details
              {pendingPaymentIssue ? (
                <span className="block text-sm text-muted-foreground font-normal mt-1">
                  Issue saved as <span className="font-semibold">Pending</span>.
                  Pay to activate.
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="glass-card p-4 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Pay for</p>
                  <p className="font-semibold truncate">
                    {activeJournalForIssue?.name || "Journal Issue"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status after save:{" "}
                    <span className="font-semibold">Pending</span>
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Card</span>
                    <span className="text-xs font-semibold uppercase">
                      {paymentForm.cardBrand === "visa" ? "VISA" : "MASTERCARD"}
                    </span>
                  </div>
                  <div className="mt-4 text-sm tracking-widest text-foreground/90">
                    •••• •••• ••••{" "}
                    {paymentForm.cardNumber.replace(/\s/g, "").slice(-4) ||
                      "----"}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {paymentForm.name ? paymentForm.name : "Cardholder"}
                    </span>
                    <span>{paymentForm.expiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentForm((p) => ({ ...p, cardBrand: "visa" }))
                  }
                  className={`btn-physics rounded-full px-3 py-1.5 text-xs font-semibold border ${
                    paymentForm.cardBrand === "visa"
                      ? "bg-primary/10 text-primary border-primary/30 glow-primary"
                      : "bg-background/30 text-muted-foreground border-border/60"
                  }`}
                >
                  VISA
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentForm((p) => ({ ...p, cardBrand: "mastercard" }))
                  }
                  className={`btn-physics rounded-full px-3 py-1.5 text-xs font-semibold border ${
                    paymentForm.cardBrand === "mastercard"
                      ? "bg-primary/10 text-primary border-primary/30 glow-primary"
                      : "bg-background/30 text-muted-foreground border-border/60"
                  }`}
                >
                  MasterCard
                </button>
              </div>

              <div className="text-left">
                <Label>Billing name</Label>
                <Input
                  className="input-glow"
                  placeholder="Name on card"
                  value={paymentForm.name}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="text-left">
                <Label>Card information</Label>

                <div className="mt-2 rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
                  <div className="px-4 py-3">
                    <Input
                      className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 input-glow"
                      placeholder="1234 1234 1234 1234"
                      value={paymentForm.cardNumber}
                      onChange={(e) =>
                        setPaymentForm((p) => ({
                          ...p,
                          cardNumber: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="h-px bg-border/60" />

                  <div className="grid grid-cols-2">
                    <div className="px-4 py-3">
                      <Input
                        className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 input-glow"
                        placeholder="MM / YY"
                        value={paymentForm.expiry}
                        onChange={(e) =>
                          setPaymentForm((p) => ({
                            ...p,
                            expiry: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="px-4 py-3 border-l border-border/60">
                      <Input
                        className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 input-glow"
                        placeholder="CVC"
                        value={paymentForm.cvc}
                        onChange={(e) =>
                          setPaymentForm((p) => ({ ...p, cvc: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Your issue stays{" "}
                  <span className="font-semibold">Pending</span> if you close
                  this and pay later.
                </p>
              </div>

              <DialogFooter className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaymentOpen(false)}
                  disabled={payLoading}
                >
                  Pay later
                </Button>

                <Button
                  type="submit"
                  className="btn-physics"
                  disabled={payLoading}
                >
                  {payLoading ? "Processing..." : "Pay now"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issuesModalOpen} onOpenChange={setIssuesModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Issues – {currentJournalName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedJournalIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No issues found for this journal.
              </p>
            ) : (
              selectedJournalIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-border/60 p-3 bg-background/40"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {issue.label || "Untitled Issue"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Year: {issue.year}
                        {issue.volume && ` • Vol ${issue.volume}`}
                        {issue.issue && ` • Issue ${issue.issue}`}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        isActiveIssue(issue)
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {isActiveIssue(issue) ? "Active" : "Pending"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssuesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
