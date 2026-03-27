import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  User,
  Upload,
  X,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface JournalFields {
  title: string;
  issn: string;
  doi: string;
  publisher_name: string;
  type: string;
  peer_review_policy: string;
  oa_policy: string;
  author_guidelines: string;
  aims_and_scope: string;
}

interface StaffFields {
  name: string;
  email: string;
}

const defaultJournal: JournalFields = {
  title: "",
  issn: "",
  doi: "",
  publisher_name: "",
  type: "",
  peer_review_policy: "",
  oa_policy: "",
  author_guidelines: "",
  aims_and_scope: "",
};

const defaultStaff: StaffFields = { name: "", email: "" };

const STEPS = ["Journal Details", "Chief Editor", "Journal Manager"];

export default function CreateJournal() {
  const { user, token, switchRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [journal, setJournal] = useState<JournalFields>(defaultJournal);
  const [chiefEditor, setChiefEditor] = useState<StaffFields>(defaultStaff);
  const [journalManager, setJournalManager] =
    useState<StaffFields>(defaultStaff);
  const [submitting, setSubmitting] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, WebP, or GIF allowed.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be under 2MB.",
        variant: "destructive",
      });
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const updateJournal = (field: keyof JournalFields, value: string) =>
    setJournal((prev) => ({ ...prev, [field]: value }));

  const updateChiefEditor = (field: keyof StaffFields, value: string) =>
    setChiefEditor((prev) => ({ ...prev, [field]: value }));

  const updateJournalManager = (field: keyof StaffFields, value: string) =>
    setJournalManager((prev) => ({ ...prev, [field]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (
        !journal.title ||
        !journal.publisher_name ||
        !journal.type ||
        !journal.peer_review_policy ||
        !journal.oa_policy ||
        !journal.author_guidelines
      ) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return false;
      }
    }
    if (step === 1) {
      if (!chiefEditor.name || !chiefEditor.email) {
        toast({
          title: "Missing fields",
          description: "Please fill in all Chief Editor fields",
          variant: "destructive",
        });
        return false;
      }
    }
    if (step === 2) {
      if (!journalManager.name || !journalManager.email) {
        toast({
          title: "Missing fields",
          description: "Please fill in all Journal Manager fields",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      formData.append("title", journal.title);
      if (journal.issn) formData.append("issn", journal.issn);
      if (journal.doi) formData.append("doi", journal.doi);
      formData.append("publisher_name", journal.publisher_name);
      formData.append("type", journal.type);
      formData.append("peer_review_policy", journal.peer_review_policy);
      formData.append("oa_policy", journal.oa_policy);
      formData.append("author_guidelines", journal.author_guidelines);
      if (journal.aims_and_scope)
        formData.append("aims_and_scope", journal.aims_and_scope);
      formData.append("chief_editor", JSON.stringify(chiefEditor));
      formData.append("journal_manager", JSON.stringify(journalManager));

      const res = await fetch(`${url}/journal/publisherCreate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create journal");
      }

      toast({
        title: "Journal Created",
        description:
          "Invitation emails sent to Chief Editor and Journal Manager.",
      });

      // Refresh JWT so new journal_manager role appears in role switcher
      try {
        await switchRole("publisher" as UserRole, null);
      } catch {}

      navigate("/publisher");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create journal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Create New Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Journal Details
              </CardTitle>
              <CardDescription>
                Fill in the core information for the new journal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-1">
                <Label>
                  Journal Cover{" "}
                  <span className="text-muted-foreground font-normal">
                    (Portrait recommended: 3:4 ratio)
                  </span>
                </Label>
                <div className="flex items-start gap-4">
                  <div
                    className="w-[90px] h-[120px] rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden shrink-0"
                    onClick={() => logoRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Cover preview"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="text-center px-1">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">
                          Upload
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Optional. JPG, PNG, WebP or GIF, max 2MB.</p>
                    <p className="text-xs mt-1">
                      Upload a portrait-oriented cover image for best display.
                    </p>
                    {logo && (
                      <button
                        type="button"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview(null);
                          if (logoRef.current) logoRef.current.value = "";
                        }}
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  onChange={handleLogoChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>
                    Journal Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={journal.title}
                    onChange={(e) => updateJournal("title", e.target.value)}
                    placeholder="e.g. Journal of Artificial Intelligence"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Publisher Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={journal.publisher_name}
                    onChange={(e) =>
                      updateJournal("publisher_name", e.target.value)
                    }
                    placeholder="e.g. GIKI Press"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ISSN</Label>
                  <Input
                    value={journal.issn}
                    onChange={(e) => updateJournal("issn", e.target.value)}
                    placeholder="e.g. 1234-567X"
                  />
                </div>
                <div className="space-y-1">
                  <Label>DOI</Label>
                  <Input
                    value={journal.doi}
                    onChange={(e) => updateJournal("doi", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={journal.type}
                    onValueChange={(v) => updateJournal("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_access">Open Access</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>
                  Peer Review Policy <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.peer_review_policy}
                  onChange={(html) => updateJournal("peer_review_policy", html)}
                  placeholder="Describe the peer review process..."
                />
              </div>

              <div className="space-y-1">
                <Label>
                  OA Policy <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.oa_policy}
                  onChange={(html) => updateJournal("oa_policy", html)}
                  placeholder="Describe the open access policy..."
                />
              </div>

              <div className="space-y-1">
                <Label>
                  Author Guidelines <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.author_guidelines}
                  onChange={(html) => updateJournal("author_guidelines", html)}
                  placeholder="Guidelines for authors submitting manuscripts..."
                />
              </div>

              <div className="space-y-1">
                <Label>Aims & Scope</Label>
                <RichTextEditor
                  value={journal.aims_and_scope}
                  onChange={(html) => updateJournal("aims_and_scope", html)}
                  placeholder="Describe the journal's aims and scope..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Invite Chief Editor
              </CardTitle>
              <CardDescription>
                An invitation email will be sent. They will set their own
                password when they accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={chiefEditor.name}
                  onChange={(e) => updateChiefEditor("name", e.target.value)}
                  placeholder="Chief Editor's full name"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={chiefEditor.email}
                  onChange={(e) => updateChiefEditor("email", e.target.value)}
                  placeholder="chief.editor@example.com"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Invite Journal Manager
              </CardTitle>
              <CardDescription>
                An invitation email will be sent. They will set their own
                password when they accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={journalManager.name}
                  onChange={(e) => updateJournalManager("name", e.target.value)}
                  placeholder="Journal Manager's full name"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={journalManager.email}
                  onChange={(e) =>
                    updateJournalManager("email", e.target.value)
                  }
                  placeholder="journal.manager@example.com"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={step === 0 ? () => navigate("/publisher") : handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {submitting ? "Creating..." : "Create Journal & Send Invites"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
