import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Upload, Loader2, BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface Journal {
  id: string;
  title: string;
}

interface Reference {
  text: string;
  link: string;
}

export default function SubmitPaper() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(true);

  // Form state
  const [journalId, setJournalId] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [authorNames, setAuthorNames] = useState<string[]>([""]);
  const [correspondingAuthors, setCorrespondingAuthors] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [references, setReferences] = useState<Reference[]>([{ text: "", link: "" }]);
  const [manuscript, setManuscript] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [guidelines, setGuidelines] = useState<string | null>(null);
  const [guidelinesRead, setGuidelinesRead] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  useEffect(() => {
    setLoadingJournals(true);
    fetch(`${url}/author/getAuthorJournals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJournals(data.journals);
      })
      .finally(() => setLoadingJournals(false));
  }, [token]);

  // Keyword suggestions
  useEffect(() => {
    if (!keywordInput.trim()) {
      setKeywordSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${url}/papers/keyword-suggestions?q=${encodeURIComponent(keywordInput)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setKeywordSuggestions(d.keywords || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput, token]);

  useEffect(() => {
    if (!journalId) { setGuidelines(null); setGuidelinesRead(false); return; }
    fetch(`${url}/journal/${journalId}/guidelines`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setGuidelines(d.guidelines || null); })
      .catch(() => {});
    setGuidelinesRead(false);
  }, [journalId]);

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= 5) return;
    setKeywords([...keywords, trimmed]);
    setKeywordInput("");
    setKeywordSuggestions([]);
  };

  const removeKeyword = (kw: string) =>
    setKeywords(keywords.filter((k) => k !== kw));

  const updateArrayField = <T,>(
    arr: T[],
    setter: (v: T[]) => void,
    idx: number,
    value: T,
  ) => {
    const next = [...arr];
    next[idx] = value;
    setter(next);
  };

  const addRow = <T,>(arr: T[], setter: (v: T[]) => void, empty: T, max?: number) => {
    if (max && arr.length >= max) return;
    setter([...arr, empty]);
  };

  const removeRow = <T,>(arr: T[], setter: (v: T[]) => void, idx: number) => {
    setter(arr.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "tex", "latex"].includes(ext || "")) {
      toast({ title: "Invalid file type", description: "Only .docx, .pdf and .tex/.latex files are accepted.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setManuscript(file);
  };

  const validate = (): string | null => {
    if (!journalId) return "Please select a journal.";
    if (guidelines && !guidelinesRead)
      return "Please confirm you have read the author guidelines before submitting.";
    if (!title.trim()) return "Title is required.";
    if (title.length > 200) return "Title cannot exceed 200 characters.";
    if (!abstract.trim()) return "Abstract is required.";
    if (abstract.length < 100) return "Abstract must be at least 100 characters.";
    if (abstract.length > 3000) return "Abstract cannot exceed 3000 characters.";
    if (authorNames.filter((n) => n.trim()).length === 0) return "At least one author name is required.";
    if (keywords.length === 0) return "At least one keyword is required.";
    if (keywords.length > 5) return "Maximum 5 keywords allowed.";
    if (correspondingAuthors.filter((c) => c.trim()).length > 5)
      return "Maximum 5 corresponding authors allowed.";
    if (references.filter((r) => r.text.trim()).length > 5)
      return "Maximum 5 references allowed.";
    if (!manuscript) return "Please upload your manuscript.";
    return null;
  };

  const handleOpenReview = () => {
    const err = validate();
    if (err) {
      toast({ title: "Validation error", description: err, variant: "destructive" });
      return;
    }
    setShowReview(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("journal_id", journalId);
      formData.append("title", title);
      formData.append("abstract", abstract);
      formData.append("author_names", JSON.stringify(authorNames.filter((n) => n.trim())));
      formData.append("corresponding_authors", JSON.stringify(correspondingAuthors.filter((c) => c.trim())));
      formData.append("keywords", JSON.stringify(keywords));
      formData.append("paper_references", JSON.stringify(references.filter((r) => r.text.trim())));
      if (manuscript) formData.append("manuscript", manuscript);

      const res = await fetch(`${url}/papers/createPaper`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");

      toast({ title: "Paper submitted!", description: "Your paper has been submitted successfully." });
      navigate("/author");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setShowReview(false);
    }
  };

  const selectedJournal = journals.find((j) => j.id === journalId);

  return (
    <DashboardLayout role={(user?.role as UserRole) ?? "author"} userName={user?.username}>
      <PageTransition>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Submit a Paper</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fill in all fields and upload your manuscript to submit.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Select Journal */}
            <div>
              <Label className="mb-1.5 block">Select Journal *</Label>
              {loadingJournals ? (
                <p className="text-sm text-muted-foreground">Loading journals…</p>
              ) : (
                <Select value={journalId} onValueChange={setJournalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a journal with open submissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {journals.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No journals currently open for submissions
                      </SelectItem>
                    ) : (
                      journals.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Author Guidelines Acknowledgement */}
            {journalId && guidelines && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="guidelines-read"
                    checked={guidelinesRead}
                    onCheckedChange={(checked) => setGuidelinesRead(!!checked)}
                  />
                  <div className="flex-1">
                    <label htmlFor="guidelines-read" className="text-sm font-medium cursor-pointer">
                      I have read and agree to the author guidelines
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Please read the guidelines for this journal before submitting.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuidelinesModal(true)}
                >
                  <BookOpen className="h-4 w-4 mr-2" /> Read Author Guidelines
                </Button>
              </div>
            )}

            {/* 2. Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Title *</Label>
                <span className={`text-xs ${title.length > 200 ? "text-destructive" : "text-muted-foreground"}`}>
                  {title.length}/200
                </span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Enter paper title"
              />
            </div>

            {/* 3. Abstract */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Abstract *</Label>
                <span className={`text-xs ${abstract.length > 3000 ? "text-destructive" : "text-muted-foreground"}`}>
                  {abstract.length}/3000
                </span>
              </div>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                maxLength={3000}
                placeholder="Provide a brief summary of your research (100–3000 characters)"
                rows={6}
              />
              {abstract.length > 0 && abstract.length < 100 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - abstract.length} more characters needed
                </p>
              )}
            </div>

            {/* 4. Author Names (was 3) */}
            <div>
              <Label className="mb-1.5 block">Author Name(s) *</Label>
              <div className="space-y-2">
                {authorNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) =>
                        updateArrayField(authorNames, setAuthorNames, i, e.target.value)
                      }
                      placeholder={`Author ${i + 1}`}
                    />
                    {authorNames.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(authorNames, setAuthorNames, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addRow(authorNames, setAuthorNames, "")}
              >
                <Plus className="h-4 w-4 mr-1" /> Add another author
              </Button>
            </div>

            {/* 4. Corresponding Authors */}
            <div>
              <Label className="mb-1.5 block">
                Corresponding Author(s){" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <div className="space-y-2">
                {correspondingAuthors.map((ca, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={ca}
                      onChange={(e) =>
                        updateArrayField(
                          correspondingAuthors,
                          setCorrespondingAuthors,
                          i,
                          e.target.value,
                        )
                      }
                      placeholder={`Corresponding author ${i + 1}`}
                    />
                    {correspondingAuthors.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeRow(correspondingAuthors, setCorrespondingAuthors, i)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {correspondingAuthors.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    addRow(correspondingAuthors, setCorrespondingAuthors, "", 5)
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add corresponding author
                </Button>
              )}
            </div>

            {/* 5. Keywords */}
            <div>
              <Label className="mb-1.5 block">
                Keywords *{" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {keywords.length < 5 && (
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword(keywordInput);
                        }
                      }}
                      placeholder="Type a keyword and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addKeyword(keywordInput)}
                      disabled={keywords.length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {keywordSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {keywordSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => addKeyword(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. References */}
            <div>
              <Label className="mb-1.5 block">
                References{" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <div className="space-y-3">
                {references.map((ref, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={ref.text}
                        onChange={(e) =>
                          updateArrayField(references, setReferences, i, {
                            ...ref,
                            text: e.target.value,
                          })
                        }
                        placeholder={`Reference ${i + 1}`}
                      />
                      <Input
                        value={ref.link}
                        onChange={(e) =>
                          updateArrayField(references, setReferences, i, {
                            ...ref,
                            link: e.target.value,
                          })
                        }
                        placeholder="Link (optional)"
                      />
                    </div>
                    {references.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(references, setReferences, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {references.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    addRow(references, setReferences, { text: "", link: "" }, 5)
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add reference
                </Button>
              )}
            </div>

            {/* 7. Upload Manuscript */}
            <div>
              <Label className="mb-1.5 block">Upload Manuscript *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {manuscript ? (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{manuscript.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManuscript(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload <span className="font-medium text-foreground">.docx</span>,{" "}
                      <span className="font-medium text-foreground">.pdf</span> or{" "}
                      <span className="font-medium text-foreground">.tex/.latex</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".docx,.pdf,.tex,.latex"
                onChange={handleFileChange}
              />
            </div>

            {/* Submit button */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/author")}>
                Cancel
              </Button>
              <Button type="button" onClick={handleOpenReview}>
                Review & Submit
              </Button>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        <Dialog open={showReview} onOpenChange={setShowReview}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Journal</p>
                <p>{selectedJournal?.title || journalId}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Title</p>
                <p>{title}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Abstract</p>
                <p className="whitespace-pre-wrap">{abstract}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Authors</p>
                <p>{authorNames.filter((n) => n.trim()).join(", ")}</p>
              </div>
              {correspondingAuthors.filter((c) => c.trim()).length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">Corresponding Authors</p>
                  <p>{correspondingAuthors.filter((c) => c.trim()).join(", ")}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywords.map((k) => (
                    <Badge key={k} variant="secondary">{k}</Badge>
                  ))}
                </div>
              </div>
              {references.filter((r) => r.text.trim()).length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">References</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {references
                      .filter((r) => r.text.trim())
                      .map((r, i) => (
                        <li key={i}>
                          {r.text}
                          {r.link && (
                            <span className="text-muted-foreground"> — {r.link}</span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Manuscript</p>
                <p>{manuscript?.name}</p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowReview(false)} disabled={submitting}>
                Back to Edit
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Guidelines Modal */}
        <Dialog open={showGuidelinesModal} onOpenChange={setShowGuidelinesModal}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Author Guidelines</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {guidelines || "No guidelines available."}
            </div>
            <DialogFooter>
              <Button onClick={() => { setGuidelinesRead(true); setShowGuidelinesModal(false); }}>
                I have read the guidelines
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardLayout>
  );
}
