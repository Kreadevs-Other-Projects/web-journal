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
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
  status: string;
}

interface Reviewer {
  id: string;
  username: string;
  email: string;
}

export default function RevisionPaper() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [status, setStatus] = useState("");
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [openReviewers, setOpenReviewers] = useState(false);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/subEditor/getSubEditorPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to fetch sub-editor papers:", errorData.message);
        toast({
          title: "Error fetching papers",
          description: errorData.message || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      const assignedPapers = (data.data || []).filter(
        (paper: { status: string }) => paper.status === "pending_revision",
      );
      setPapers(assignedPapers);
    } catch (err) {
      console.error("Error fetching sub-editor papers:", err);
      toast({
        title: "Error",
        description: "Failed to fetch papers.",
        variant: "destructive",
      });
    }
  };

  const fetchReviewers = async (paperId: string) => {
    try {
      const res = await fetch(
        `${url}/subEditor/getReviewersForPaper/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setReviewers(data.data || []);
      setOpenReviewers(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch reviewers",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async () => {
    if (!selectedPaper) return;

    if (!status) {
      toast({
        title: "Invalid action",
        description: "Please select a status before updating.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(
        `${url}/subEditor/updateSubEditorPaperStatus/${selectedPaper.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update paper status");
      }

      toast({
        title: "Success",
        description: `Paper status updated to "${status}".`,
      });

      setSelectedPaper(null);
      fetchPapers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      });
    }
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

        <Dialog open={openReviewers} onOpenChange={setOpenReviewers}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigned Reviewers</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {reviewers.length === 0 && <p>No reviewers assigned</p>}
              {reviewers.map((r) => (
                <div key={r.id} className="border rounded p-2">
                  <p>
                    <b>{r.username}</b>
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
