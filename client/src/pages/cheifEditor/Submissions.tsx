import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, UserPlus } from "lucide-react";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  status: string;
}

export default function ChiefEditor() {
  const { user, token } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const [subEditors, setSubEditors] = useState<
    { id: string; username: string }[]
  >([]);
  const [reviewers, setReviewers] = useState<
    { id: string; username: string }[]
  >([]);

  const [subEditorId, setSubEditorId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  /* ---------------- FETCH DATA ---------------- */

  const fetchPapers = async () => {
    const res = await fetch(`${url}/cheifEditor/getPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPapers(data.data || []);
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch(`${url}/cheifEditor/getSubEditors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubEditors(data.data || []));

    fetch(`${url}/cheifEditor/getReviewers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setReviewers(data.data || []));
  }, [token]);

  /* ---------------- ACTIONS ---------------- */

  const assignSubEditor = async () => {
    if (!selectedPaper || !subEditorId) return;

    await fetch(`${url}/cheifEditor/assignSubEditor/${selectedPaper.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subEditorId }),
    });

    setSubEditorId("");
    setOpenDialog(false);
    fetchPapers();
  };

  const assignReviewer = async () => {
    if (!selectedPaper || !reviewerId) return;

    await fetch(`${url}/cheifEditor/assignReviewer/${selectedPaper.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reviewerId }),
    });

    setReviewerId("");
    setOpenDialog(false);
    fetchPapers();
  };

  /* ---------------- UI ---------------- */

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Papers Management
          </h1>
          <p className="text-muted-foreground">
            Assign sub-editors and reviewers to submitted papers
          </p>
        </div>

        {/* PAPERS GRID */}
        {papers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No papers available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <Card
                key={paper.id}
                className="glass-card hover:shadow-glow transition"
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Badge variant="outline">Status: {paper.status}</Badge>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedPaper(paper);
                      setOpenDialog(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Roles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ACTION DIALOG */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Paper Assignments</DialogTitle>
            </DialogHeader>

            {selectedPaper && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <b>Paper:</b> {selectedPaper.title}
                </p>

                {/* SUB EDITOR */}
                <div className="space-y-2">
                  <Label>Select Sub-Editor</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={subEditorId}
                    onChange={(e) => setSubEditorId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {subEditors.map((se) => (
                      <option key={se.id} value={se.id}>
                        {se.username}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    onClick={assignSubEditor}
                    disabled={!subEditorId}
                  >
                    Assign Sub-Editor
                  </Button>
                </div>

                {/* REVIEWER */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Select Reviewer</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.username}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    onClick={assignReviewer}
                    disabled={!reviewerId}
                  >
                    Assign Reviewer
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
