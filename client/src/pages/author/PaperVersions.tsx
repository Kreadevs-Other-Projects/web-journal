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

export default function PaperVersions({ paperId }: { paperId: string }) {
  const { user, token } = useAuth();

  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    version_label: "",
    file_url: "",
  });

  /* ---------------- FETCH VERSIONS ---------------- */

  const fetchVersions = async () => {
    const res = await fetch(
      `${url}/paper-versions/getPaperVersions/${paperId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();
    setVersions(Array.isArray(data.versions) ? data.versions : []);
  };

  useEffect(() => {
    fetchVersions();
  }, [paperId]);

  const uploadVersion = async () => {
    await fetch(`${url}/paper-versions/uploadPaperVersion/${paperId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    setOpen(false);
    setForm({ version_label: "", file_url: "" });
    fetchVersions();
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Paper Versions</h1>

          {user?.role === "publisher" && (
            <Button onClick={() => setOpen(true)}>Upload Version</Button>
          )}
        </div>

        {/* VERSION LIST */}
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

      {/* UPLOAD MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Paper Version</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Version Label</Label>
              <Input
                value={form.version_label}
                onChange={(e) =>
                  setForm({ ...form, version_label: e.target.value })
                }
              />
            </div>

            <div>
              <Label>File URL</Label>
              <Input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
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
