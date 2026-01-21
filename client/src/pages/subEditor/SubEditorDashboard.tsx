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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  status: string;
}

interface Reviewer {
  id: string;
  full_name: string;
  email: string;
}

export default function SubEditorDashboard() {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState("");
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [openReviewers, setOpenReviewers] = useState(false);

  const fetchPapers = async () => {
    const res = await fetch(`${url}/subEditor/getSubEditorPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPapers(data.data || []);
  };

  const fetchReviewers = async (paperId: string) => {
    const res = await fetch(
      `${url}/subEditor/getReviewersForPaper/${paperId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    setReviewers(data.data || []);
    setOpenReviewers(true);
  };

  const updateStatus = async () => {
    if (!selectedPaper) return;
    await fetch(
      `${url}/subEditor/updateSubEditorPaperStatus/${selectedPaper.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );
    setSelectedPaper(null);
    fetchPapers();
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Sub Editor Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  Status: <b>{p.status}</b>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPaper(p);
                    setStatus(p.status);
                  }}
                >
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchReviewers(p.id)}
                >
                  View Reviewers
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPaper && (
          <Dialog
            open={!!selectedPaper}
            onOpenChange={() => setSelectedPaper(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Paper Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full border rounded"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="under_review">Under Review</option>
                  <option value="pending_revision">Pending Revision</option>
                  <option value="resubmitted">Resubmitted</option>
                </select>
              </div>
              <DialogFooter>
                <Button onClick={updateStatus}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog
          open={openReviewers}
          onOpenChange={() => setOpenReviewers(false)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigned Reviewers</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {reviewers.length === 0 && <p>No reviewers assigned</p>}
              {reviewers.map((r) => (
                <div key={r.id} className="border rounded p-2">
                  <p>
                    <b>{r.full_name}</b>
                  </p>
                  <p className="text-xs">{r.email}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
