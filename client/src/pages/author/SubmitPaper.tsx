import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  Upload,
  Loader2,
  BookOpen,
  Sparkles,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface Journal {
  id: string;
  title: string;
  available_slots?: number | null;
}

interface Reference {
  text: string;
  link: string;
}

interface AuthorDetail {
  name: string;
  email: string;
  affiliation: string;
  orcid: string;
}

interface CorrespondingAuthorDetail {
  name: string;
  email: string;
  affiliation: string;
  phone: string;
}

interface JournalPolicies {
  oa_policy: string | null;
  peer_review_policy: string | null;
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
  const [authorDetails, setAuthorDetails] = useState<AuthorDetail[]>([
    { name: "", email: "", affiliation: "", orcid: "" },
  ]);
  const [correspondingAuthorDetails, setCorrespondingAuthorDetails] = useState<
    CorrespondingAuthorDetail[]
  >([{ name: "", email: "", affiliation: "", phone: "" }]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [references, setReferences] = useState<Reference[]>([
    { text: "", link: "" },
  ]);
  const [manuscript, setManuscript] = useState<File | null>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractedBanner, setExtractedBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [guidelines, setGuidelines] = useState<string | null>(null);
  const [guidelinesRead, setGuidelinesRead] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Journal policies
  const [journalPolicies, setJournalPolicies] = useState<JournalPolicies>({
    oa_policy: null,
    peer_review_policy: null,
  });
  const [showPolicies, setShowPolicies] = useState(false);

  // Additional information (collapsible)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [articleType, setArticleType] = useState("");
  const [category, setCategory] = useState("");
  const [conflictOfInterest, setConflictOfInterest] = useState("");
  const [fundingInfo, setFundingInfo] = useState("");
  const [dataAvailability, setDataAvailability] = useState("");
  const [ethicalApproval, setEthicalApproval] = useState("");
  const [authorContributions, setAuthorContributions] = useState("");

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
      fetch(
        `${url}/papers/keyword-suggestions?q=${encodeURIComponent(keywordInput)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
        .then((r) => r.json())
        .then((d) => setKeywordSuggestions(d.keywords || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput, token]);

  useEffect(() => {
    if (!journalId) {
      setGuidelines(null);
      setGuidelinesRead(false);
      setJournalPolicies({ oa_policy: null, peer_review_policy: null });
      return;
    }
    fetch(`${url}/journal/${journalId}/guidelines`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGuidelines(d.guidelines || null);
      })
      .catch(() => {});

    // Fetch journal policies
    fetch(`${url}/journal/getJournal/${journalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const j = d.journal || d;
        if (j) {
          setJournalPolicies({
            oa_policy: j.oa_policy || null,
            peer_review_policy: j.peer_review_policy || null,
          });
        }
      })
      .catch(() => {});

    setGuidelinesRead(false);
  }, [journalId, token]);

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

  const addRow = <T,>(
    arr: T[],
    setter: (v: T[]) => void,
    empty: T,
    max?: number,
  ) => {
    if (max && arr.length >= max) return;
    setter([...arr, empty]);
  };

  const removeRow = <T,>(arr: T[], setter: (v: T[]) => void, idx: number) => {
    setter(arr.filter((_, i) => i !== idx));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "tex", "latex"].includes(ext || "")) {
      toast({
        title: "Invalid file type",
        description: "Only .docx, .pdf and .tex/.latex files are accepted.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }
    setManuscript(file);
    setExtractedBanner(false);

    if (ext === "docx") {
      setExtracting(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${url}/papers/extract-metadata`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (data.success) {
          if (data.title) setTitle(data.title);
          if (data.abstract) setAbstract(data.abstract);
          if (Array.isArray(data.keywords) && data.keywords.length > 0)
            setKeywords(data.keywords.slice(0, 5));
          if (Array.isArray(data.authors) && data.authors.length > 0) {
            setAuthorDetails(
              data.authors.map((name: string) => ({
                name,
                email: "",
                affiliation: "",
                orcid: "",
              })),
            );
          }
          if (Array.isArray(data.references) && data.references.length > 0) {
            setReferences(
              data.references
                .slice(0, 5)
                .map((t: string) => ({ text: t, link: "" })),
            );
          }
          setExtractedBanner(true);
        }
      } catch {
        // extraction failed silently — form stays empty
      } finally {
        setExtracting(false);
      }
    }
  };

  const validate = (): string | null => {
    if (!journalId) return "Please select a journal.";
    if (guidelines && !guidelinesRead)
      return "Please confirm you have read the author guidelines and submission policies before submitting.";
    if (!title.trim()) return "Title is required.";
    if (title.length > 200) return "Title cannot exceed 200 characters.";
    if (!abstract.trim()) return "Abstract is required.";
    if (abstract.length < 100)
      return "Abstract must be at least 100 characters.";
    if (abstract.length > 3000)
      return "Abstract cannot exceed 3000 characters.";
    if (authorDetails.filter((a) => a.name.trim()).length === 0)
      return "At least one author name is required.";
    if (!articleType) return "Please select an article type.";
    if (keywords.length === 0) return "At least one keyword is required.";
    if (keywords.length > 5) return "Maximum 5 keywords allowed.";
    if (correspondingAuthorDetails.filter((c) => c.name.trim()).length > 5)
      return "Maximum 5 corresponding authors allowed.";
    if (references.filter((r) => r.text.trim()).length > 5)
      return "Maximum 5 references allowed.";
    if (!manuscript) return "Please upload your manuscript.";
    return null;
  };

  const handleOpenReview = () => {
    const err = validate();
    if (err) {
      toast({
        title: "Validation error",
        description: err,
        variant: "destructive",
      });
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

      const filledAuthors = authorDetails.filter((a) => a.name.trim());
      formData.append("author_details", JSON.stringify(filledAuthors));
      formData.append(
        "author_names",
        JSON.stringify(filledAuthors.map((a) => a.name)),
      );

      const filledCorresponding = correspondingAuthorDetails.filter((c) =>
        c.name.trim(),
      );
      formData.append(
        "corresponding_author_details",
        JSON.stringify(filledCorresponding),
      );
      formData.append(
        "corresponding_authors",
        JSON.stringify(filledCorresponding.map((c) => c.name)),
      );

      formData.append("keywords", JSON.stringify(keywords));
      formData.append(
        "paper_references",
        JSON.stringify(references.filter((r) => r.text.trim())),
      );
      if (manuscript) formData.append("manuscript", manuscript);

      // Additional fields
      if (articleType) formData.append("article_type", articleType);
      if (category) formData.append("category", category);
      if (conflictOfInterest)
        formData.append("conflict_of_interest", conflictOfInterest);
      if (fundingInfo) formData.append("funding_info", fundingInfo);
      if (dataAvailability)
        formData.append("data_availability", dataAvailability);
      if (ethicalApproval) formData.append("ethical_approval", ethicalApproval);
      if (authorContributions)
        formData.append("author_contributions", authorContributions);

      const res = await fetch(`${url}/papers/createPaper`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");

      toast({
        title: "Paper submitted!",
        description: "Your paper has been submitted successfully.",
      });
      navigate("/author");
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setShowReview(false);
    }
  };

  const selectedJournal = journals.find((j) => j.id === journalId);

  const renderPolicyContent = (content: string | null) => {
    if (!content)
      return (
        <p className="text-sm text-muted-foreground">No policy available.</p>
      );
    if (content.trimStart().startsWith("<")) {
      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      );
    }
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {content}
      </p>
    );
  };

  return (
    <DashboardLayout
      role={(user?.role as UserRole) ?? "author"}
      userName={user?.username}
    >
      <PageTransition>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Submit a Paper</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fill in all fields and upload your manuscript to submit.
            </p>
          </div>

          <div className="space-y-6">
            {/* 0. Upload Manuscript First (auto-extraction for .docx) */}
            <div>
              <Label className="mb-1.5 block">Upload Manuscript *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {extracting ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Extracting metadata…</span>
                  </div>
                ) : manuscript ? (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">
                      {manuscript.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManuscript(null);
                        setExtractedBanner(false);
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
                      Click to upload{" "}
                      <span className="font-medium text-foreground">.docx</span>
                      ,{" "}
                      <span className="font-medium text-foreground">.pdf</span>{" "}
                      or{" "}
                      <span className="font-medium text-foreground">
                        .tex/.latex
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 10MB · .docx files will auto-fill the form fields
                      below
                    </p>
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

            {/* Extraction success banner */}
            {extractedBanner && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Metadata extracted from your document
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please review and correct the pre-filled fields below if
                    needed.
                  </p>
                </div>
              </div>
            )}

            {/* 1. Select Journal */}
            <div>
              <Label className="mb-1.5 block">Select Journal *</Label>
              {loadingJournals ? (
                <p className="text-sm text-muted-foreground">
                  Loading journals…
                </p>
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
                          {j.available_slots != null && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({j.available_slots} slot
                              {j.available_slots !== 1 ? "s" : ""} left)
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Author Guidelines & Policies Acknowledgement */}
            {journalId && guidelines && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="guidelines-read"
                    checked={guidelinesRead}
                    onCheckedChange={(checked) => setGuidelinesRead(!!checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="guidelines-read"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I have read and agree to the author guidelines and
                      submission policies
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Please read the guidelines and policies for this journal
                      before submitting.
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

            {/* Journal Policies collapsible panel */}
            {journalId &&
              (journalPolicies.oa_policy ||
                journalPolicies.peer_review_policy) && (
                <div className="rounded-lg border border-border">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
                    onClick={() => setShowPolicies((v) => !v)}
                  >
                    <span>View Journal Policies</span>
                    {showPolicies ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showPolicies && (
                    <div className="px-4 pb-4">
                      <Tabs defaultValue="oa-policy">
                        <TabsList className="mb-3">
                          <TabsTrigger value="oa-policy">OA Policy</TabsTrigger>
                          <TabsTrigger value="peer-review">
                            Peer Review Policy
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="oa-policy">
                          {renderPolicyContent(journalPolicies.oa_policy)}
                        </TabsContent>
                        <TabsContent value="peer-review">
                          {renderPolicyContent(
                            journalPolicies.peer_review_policy,
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              )}

            {/* 2. Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Title *</Label>
                <span
                  className={`text-xs ${title.length > 200 ? "text-destructive" : "text-muted-foreground"}`}
                >
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
                <span
                  className={`text-xs ${abstract.length > 3000 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {abstract.length}/500
                </span>
              </div>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                maxLength={500}
                placeholder="Provide a brief summary of your research (100–500 characters)"
                rows={6}
              />
              {abstract.length > 0 && abstract.length < 100 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - abstract.length} more characters needed
                </p>
              )}
            </div>

            {/* 4. Author Details */}
            <div>
              <Label className="mb-1.5 block">Author(s) *</Label>
              <div className="space-y-4">
                {authorDetails.map((author, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border p-4 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Author {i + 1}
                      </span>
                      {authorDetails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            removeRow(authorDetails, setAuthorDetails, i)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          Full Name *
                        </Label>
                        <Input
                          value={author.name}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                name: e.target.value,
                              },
                            )
                          }
                          placeholder="Dr. Jane Smith"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Email *</Label>
                        <Input
                          type="email"
                          value={author.email}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                email: e.target.value,
                              },
                            )
                          }
                          placeholder="jane@university.edu"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Affiliation/Institution *
                        </Label>
                        <Input
                          value={author.affiliation}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                affiliation: e.target.value,
                              },
                            )
                          }
                          placeholder="University of Science"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">ORCID</Label>
                        <Input
                          value={author.orcid}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                orcid: e.target.value,
                              },
                            )
                          }
                          placeholder="0000-0000-0000-0000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  addRow(authorDetails, setAuthorDetails, {
                    name: "",
                    email: "",
                    affiliation: "",
                    orcid: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add another author
              </Button>
            </div>

            {/* 5. Corresponding Authors */}
            <div>
              <Label className="mb-1.5 block">
                Corresponding Author(s){" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <div className="space-y-4">
                {correspondingAuthorDetails.map((ca, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Corresponding Author {i + 1}
                      </span>
                      {correspondingAuthorDetails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            removeRow(
                              correspondingAuthorDetails,
                              setCorrespondingAuthorDetails,
                              i,
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          Full Name *
                        </Label>
                        <Input
                          value={ca.name}
                          onChange={(e) =>
                            updateArrayField(
                              correspondingAuthorDetails,
                              setCorrespondingAuthorDetails,
                              i,
                              { ...ca, name: e.target.value },
                            )
                          }
                          placeholder="Dr. Jane Smith"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Email *</Label>
                        <Input
                          type="email"
                          value={ca.email}
                          onChange={(e) =>
                            updateArrayField(
                              correspondingAuthorDetails,
                              setCorrespondingAuthorDetails,
                              i,
                              { ...ca, email: e.target.value },
                            )
                          }
                          placeholder="jane@university.edu"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Affiliation *
                        </Label>
                        <Input
                          value={ca.affiliation}
                          onChange={(e) =>
                            updateArrayField(
                              correspondingAuthorDetails,
                              setCorrespondingAuthorDetails,
                              i,
                              { ...ca, affiliation: e.target.value },
                            )
                          }
                          placeholder="University of Science"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Phone</Label>
                        <Input
                          type="tel"
                          value={ca.phone}
                          onChange={(e) =>
                            updateArrayField(
                              correspondingAuthorDetails,
                              setCorrespondingAuthorDetails,
                              i,
                              { ...ca, phone: e.target.value },
                            )
                          }
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {correspondingAuthorDetails.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    addRow(
                      correspondingAuthorDetails,
                      setCorrespondingAuthorDetails,
                      { name: "", email: "", affiliation: "", phone: "" },
                      5,
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add corresponding author
                </Button>
              )}
            </div>

            {/* 6. Keywords */}
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

            {/* 7. References */}
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

            {/* 8. Article Type (required, always visible) */}
            <div>
              <Label className="mb-1.5 block">Article Type *</Label>
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select article type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Original Research">
                    Original Research
                  </SelectItem>
                  <SelectItem value="Review Article">Review Article</SelectItem>
                  <SelectItem value="Case Report">Case Report</SelectItem>
                  <SelectItem value="Editorial">Editorial</SelectItem>
                  <SelectItem value="Commentary">Commentary</SelectItem>
                  <SelectItem value="Letter to Editor">
                    Letter to Editor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 9. Additional Information (collapsible) */}
            <div className="rounded-lg border border-border">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
                onClick={() => setShowAdditionalInfo((v) => !v)}
              >
                <span>Additional Information</span>
                {showAdditionalInfo ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showAdditionalInfo && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Category/Subject Area */}
                  <div>
                    <Label className="mb-1.5 block">
                      Category / Subject Area
                    </Label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Computer Science, Medicine"
                    />
                  </div>

                  {/* Conflict of Interest */}
                  <div>
                    <Label className="mb-1.5 block">
                      Conflict of Interest Statement
                    </Label>
                    <Textarea
                      value={conflictOfInterest}
                      onChange={(e) => setConflictOfInterest(e.target.value)}
                      placeholder="The authors declare no conflict of interest"
                      rows={3}
                    />
                  </div>

                  {/* Funding Information */}
                  <div>
                    <Label className="mb-1.5 block">Funding Information</Label>
                    <Textarea
                      value={fundingInfo}
                      onChange={(e) => setFundingInfo(e.target.value)}
                      placeholder="List grant numbers and funding bodies"
                      rows={3}
                    />
                  </div>

                  {/* Data Availability */}
                  <div>
                    <Label className="mb-1.5 block">
                      Data Availability Statement
                    </Label>
                    <Textarea
                      value={dataAvailability}
                      onChange={(e) => setDataAvailability(e.target.value)}
                      placeholder="Describe where data can be accessed"
                      rows={3}
                    />
                  </div>

                  {/* Ethical Approval */}
                  <div>
                    <Label className="mb-1.5 block">Ethical Approval</Label>
                    <Textarea
                      value={ethicalApproval}
                      onChange={(e) => setEthicalApproval(e.target.value)}
                      placeholder="IRB number or 'Not applicable'"
                      rows={2}
                    />
                  </div>

                  {/* Author Contributions */}
                  <div>
                    <Label className="mb-1.5 block">Author Contributions</Label>
                    <Textarea
                      value={authorContributions}
                      onChange={(e) => setAuthorContributions(e.target.value)}
                      placeholder="Who did what"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Manuscript already uploaded at top */}

            {/* Submit button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/author")}
              >
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
              {articleType && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Article Type
                  </p>
                  <p>{articleType}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Authors</p>
                <ul className="space-y-1 mt-1">
                  {authorDetails
                    .filter((a) => a.name.trim())
                    .map((a, i) => (
                      <li key={i}>
                        <span className="font-medium">{a.name}</span>
                        {a.affiliation && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {a.affiliation}
                          </span>
                        )}
                        {a.email && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {a.email}
                          </span>
                        )}
                        {a.orcid && (
                          <span className="text-muted-foreground">
                            {" "}
                            · ORCID: {a.orcid}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              {correspondingAuthorDetails.filter((c) => c.name.trim()).length >
                0 && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Corresponding Authors
                  </p>
                  <ul className="space-y-1 mt-1">
                    {correspondingAuthorDetails
                      .filter((c) => c.name.trim())
                      .map((c, i) => (
                        <li key={i}>
                          <span className="font-medium">{c.name}</span>
                          {c.affiliation && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {c.affiliation}
                            </span>
                          )}
                          {c.email && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {c.phone}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywords.map((k) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
              {references.filter((r) => r.text.trim()).length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    References
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {references
                      .filter((r) => r.text.trim())
                      .map((r, i) => (
                        <li key={i}>
                          {r.text}
                          {r.link && (
                            <span className="text-muted-foreground">
                              {" "}
                              — {r.link}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {/* Additional info summary */}
              {conflictOfInterest && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Conflict of Interest
                  </p>
                  <p className="whitespace-pre-wrap">{conflictOfInterest}</p>
                </div>
              )}
              {fundingInfo && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Funding Information
                  </p>
                  <p className="whitespace-pre-wrap">{fundingInfo}</p>
                </div>
              )}
              {dataAvailability && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Data Availability
                  </p>
                  <p className="whitespace-pre-wrap">{dataAvailability}</p>
                </div>
              )}
              {ethicalApproval && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Ethical Approval
                  </p>
                  <p className="whitespace-pre-wrap">{ethicalApproval}</p>
                </div>
              )}
              {authorContributions && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Author Contributions
                  </p>
                  <p className="whitespace-pre-wrap">{authorContributions}</p>
                </div>
              )}
              {category && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Category / Subject Area
                  </p>
                  <p>{category}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Manuscript</p>
                <p>{manuscript?.name}</p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowReview(false)}
                disabled={submitting}
              >
                Back to Edit
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirm Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Guidelines Modal */}
        <Dialog
          open={showGuidelinesModal}
          onOpenChange={setShowGuidelinesModal}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Author Guidelines</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {guidelines || "No guidelines available."}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setGuidelinesRead(true);
                  setShowGuidelinesModal(false);
                }}
              >
                I have read the guidelines
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardLayout>
  );
}
