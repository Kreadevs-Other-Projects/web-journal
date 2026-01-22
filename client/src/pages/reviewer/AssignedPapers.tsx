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

interface Paper {
  paper_id: string;
  paper_version_id: string;
  title: string;
  paper_status: string;
  assignment_status: string;
  file_url: string;
}

export default function ReviewerDashboard() {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [decision, setDecision] = useState("accept");
  const [comments, setComments] = useState("");
  const [viewPdf, setViewPdf] = useState<Paper | null>(null);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/reviewer/getReviewerPapers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message);
        return;
      }
      setPapers(data.data || []);
    } catch (err) {
      console.error("Error fetching reviewer papers:", err);
    }
  };

  const submitReview = async () => {
    if (!selectedPaper) return;

    if (!decision || !comments.trim()) {
      alert("Please add comments before submitting review");
      return;
    }

    try {
      const res = await fetch(
        `${url}/reviewer/submitReview/${selectedPaper.paper_version_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision, comments }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit review");
        return;
      }

      alert("Review submitted successfully");
      setSelectedPaper(null);
      setComments("");
      fetchPapers();
    } catch (err) {
      console.error("Submit review error:", err);
      alert("Something went wrong while submitting review");
    }
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Assigned Papers</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.paper_version_id}>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  Assignment Status: <b>{p.paper_status}</b>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewPdf(p)}
                  >
                    View PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPaper(p)}
                  >
                    Submit Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {viewPdf && (
          <Dialog open={!!viewPdf} onOpenChange={() => setViewPdf(null)}>
            <DialogContent className="w-[90vw] max-w-5xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>Viewing: {viewPdf.title}</DialogTitle>
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
