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

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
}

interface PaperVersion {
  id: string;
  version_label: string;
  file_url: string;
  created_at: string;
}

export default function PaperVersions() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [paperId, setPaperId] = useState("");
  const [open, setOpen] = useState(false);

  const [viewPdf, setViewPdf] = useState<PaperVersion | null>(null);

  const [versionLabel, setVersionLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/papers/getPapersByAuthor`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch papers");

      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load papers",
      });
    }
  };

  const fetchVersions = async () => {
    if (!paperId) {
      setVersions([]);
      return;
    }

    try {
      const res = await fetch(
        `${url}/paper-versions/getPaperVersions/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch versions");

      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load paper versions",
      });
      setVersions([]);
    }
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  useEffect(() => {
    fetchVersions();
  }, [paperId]);

  const uploadVersion = async () => {
    if (!paperId || !versionLabel || !file) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Paper, version label, and file are required",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("version_label", versionLabel);
      formData.append("file", file);

      const res = await fetch(
        `${url}/paper-versions/uploadPaperVersion/${paperId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      toast({
        title: "Upload Successful",
        description: "Paper version uploaded successfully",
      });

      setOpen(false);
      setVersionLabel("");
      setFile(null);
      fetchVersions();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Could not upload version",
      });
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Paper Versions</h1>

          {user?.role === "author" && (
            <Button onClick={() => setOpen(true)}>Upload Version</Button>
          )}
        </div>

        <div>
          <Label className="text-white">Select Paper</Label>
          <select
            className="w-full border rounded-md p-2"
            value={paperId}
            onChange={(e) => setPaperId(e.target.value)}
          >
            <option value="">Select Paper</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle>{v.version_label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewPdf(v)}
                  >
                    View PDF
                  </Button>
                  <a
                    href={v.file_url}
                    target="_blank"
                    className="text-sm underline text-primary"
                  >
                    Download
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Version</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Version Label</Label>
              <Input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>

            <div>
              <Label>File</Label>
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

      {viewPdf && (
        <Dialog open={!!viewPdf} onOpenChange={() => setViewPdf(null)}>
          <DialogContent className="w-[90vw] max-w-5xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Viewing: {viewPdf.version_label}</DialogTitle>
            </DialogHeader>
            <div className="h-[80vh] border">
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer fileUrl={`${url}${viewPdf.file_url}`} />
              </Worker>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewPdf(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
