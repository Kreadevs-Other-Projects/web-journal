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

interface PaperVersion {
  id: string;
  version_label: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

interface Paper {
  id: string;
  title: string;
}

export default function PaperVersions() {
  const { user, token } = useAuth();

  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");

  const [open, setOpen] = useState(false);

  const [versionLabel, setVersionLabel] = useState("");
  const paperId = selectedPaperId;

  const [file, setFile] = useState<File | null>(null);

  const fetchAuthorPapers = async () => {
    if (!token) return;

    const res = await fetch(`${url}/papers/getPapersByAuthor`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setPapers(Array.isArray(data.papers) ? data.papers : []);
  };

  const fetchVersions = async () => {
    if (!token || !paperId) return;

    const res = await fetch(
      `${url}/paper-versions/getPaperVersions/${paperId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();
    setVersions(Array.isArray(data.versions) ? data.versions : []);
  };

  useEffect(() => {
    fetchVersions();
    fetchAuthorPapers();
  }, [paperId, token]);

  const uploadVersion = async () => {
    if (!selectedPaperId || !versionLabel || !file) {
      alert("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("version_label", versionLabel);
    formData.append("file", file);

    const res = await fetch(
      `${url}/paper-versions/uploadPaperVersion/${selectedPaperId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const data = await res.json();
    console.log("Upload response:", data);

    setOpen(false);
    setVersionLabel("");
    setFile(null);
    fetchVersions();
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Paper Versions</h1>

          {(user?.role === "publisher" || user?.role === "author") && (
            <Button onClick={() => setOpen(true)}>Upload Version</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v) => (
            <Card key={v.id} className="glass-card">
              <CardHeader>
                <CardTitle>{v.version_label}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <a
                  href={v.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  View File
                </a>

                <p className="text-xs text-muted-foreground">
                  Uploaded on {new Date(v.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Paper Version</DialogTitle>
          </DialogHeader>

          <div>
            <Label>Select Paper</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
            >
              <option value="">-- Select Paper --</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Version Label</Label>
              <Input
                placeholder="Accepted / Final Version"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>

            <div>
              <Label>Upload File (PDF)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={uploadVersion}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
