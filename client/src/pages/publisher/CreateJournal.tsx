import { useState } from "react";
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
import { ChevronRight, ChevronLeft, BookOpen, User } from "lucide-react";

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
  password: string;
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

const defaultStaff: StaffFields = { name: "", email: "", password: "" };

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
      if (!chiefEditor.name || !chiefEditor.email || !chiefEditor.password) {
        toast({
          title: "Missing fields",
          description: "Please fill in all Chief Editor fields",
          variant: "destructive",
        });
        return false;
      }
    }
    if (step === 2) {
      if (
        !journalManager.name ||
        !journalManager.email ||
        !journalManager.password
      ) {
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
      const payload = {
        title: journal.title,
        issn: journal.issn || undefined,
        doi: journal.doi || null,
        publisher_name: journal.publisher_name,
        type: journal.type,
        peer_review_policy: journal.peer_review_policy,
        oa_policy: journal.oa_policy,
        author_guidelines: journal.author_guidelines,
        aims_and_scope: journal.aims_and_scope || null,
        chief_editor: chiefEditor,
        journal_manager: journalManager,
      };

      const res = await fetch(`${url}/journal/publisherCreate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create journal");
      }

      toast({
        title: "Success",
        description: "Journal created successfully. Welcome emails sent.",
      });

      // Refresh JWT so new journal_manager role appears in role switcher
      try { await switchRole("publisher" as UserRole, null); } catch {}

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
                <Textarea
                  value={journal.peer_review_policy}
                  onChange={(e) =>
                    updateJournal("peer_review_policy", e.target.value)
                  }
                  rows={4}
                  placeholder="Describe the peer review process..."
                />
              </div>

              <div className="space-y-1">
                <Label>
                  OA Policy <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={journal.oa_policy}
                  onChange={(e) => updateJournal("oa_policy", e.target.value)}
                  rows={4}
                  placeholder="Describe the open access policy..."
                />
              </div>

              <div className="space-y-1">
                <Label>
                  Author Guidelines <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={journal.author_guidelines}
                  onChange={(e) =>
                    updateJournal("author_guidelines", e.target.value)
                  }
                  rows={4}
                  placeholder="Guidelines for authors submitting manuscripts..."
                />
              </div>

              <div className="space-y-1">
                <Label>Aims &amp; Scope</Label>
                <Textarea
                  value={journal.aims_and_scope}
                  onChange={(e) =>
                    updateJournal("aims_and_scope", e.target.value)
                  }
                  rows={4}
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
                <User className="h-5 w-5 text-primary" /> Create Chief Editor
              </CardTitle>
              <CardDescription>
                A new account will be created for this user and a welcome email
                sent
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
              <div className="space-y-1">
                <Label>
                  Temporary Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={chiefEditor.password}
                  onChange={(e) =>
                    updateChiefEditor("password", e.target.value)
                  }
                  placeholder="Min. 6 characters"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Create Journal Manager
              </CardTitle>
              <CardDescription>
                A new account will be created for this user and a welcome email
                sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={journalManager.name}
                  onChange={(e) =>
                    updateJournalManager("name", e.target.value)
                  }
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
              <div className="space-y-1">
                <Label>
                  Temporary Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={journalManager.password}
                  onChange={(e) =>
                    updateJournalManager("password", e.target.value)
                  }
                  placeholder="Min. 6 characters"
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
              {submitting ? "Creating..." : "Create Journal"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
