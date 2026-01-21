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

interface Paper {
  id: string;
  title: string;
  assignment_status: string;
}

export default function ReviewerDashboard() {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [decision, setDecision] = useState("accept");
  const [comments, setComments] = useState("");

  const fetchPapers = async () => {
    const res = await fetch(`${url}/reviewer/getReviewerPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPapers(data.data || []);
  };

  const submitReview = async () => {
    if (!selectedPaper) return;
    await fetch(`${url}/reviewer/submitReview/${selectedPaper.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decision, comments }),
    });
    setSelectedPaper(null);
    setComments("");
    fetchPapers();
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reviewer Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  Assignment Status: <b>{p.assignment_status}</b>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPaper(p)}
                >
                  Submit Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Review Modal */}
        {selectedPaper && (
          <Dialog
            open={!!selectedPaper}
            onOpenChange={() => setSelectedPaper(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Decision</Label>
                <select
                  className="w-full border rounded"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="accept">Accept</option>
                  <option value="minor_revision">Minor Revision</option>
                  <option value="major_revision">Major Revision</option>
                  <option value="reject">Reject</option>
                </select>
                <Label>Comments</Label>
                <Input
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Write your comments..."
                />
              </div>
              <DialogFooter>
                <Button onClick={submitReview}>Submit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
