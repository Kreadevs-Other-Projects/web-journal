import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  status: string;
}

export default function ChiefEditor() {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [subEditorId, setSubEditorId] = useState("");
  const [reviewers, setReviewers] = useState<
    { id: string; username: string }[]
  >([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [decision, setDecision] = useState("accepted");
  const [decisionNote, setDecisionNote] = useState("");
  const [openDecision, setOpenDecision] = useState(false);
  const [subEditors, setSubEditors] = useState<
    { id: string; username: string }[]
  >([]);

  const fetchPapers = async () => {
    const res = await fetch(`${url}/cheifEditor/getPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPapers(data.data || []);
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    if (token) {
      fetch(`${url}/cheifEditor/getSubEditors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("padi", data);
          setSubEditors(data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching chief editors:", err);
        });
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetch(`${url}/cheifEditor/getReviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Reviewers:", data);
          setReviewers(data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching reviewers:", err);
        });
    }
  }, [token]);

  const assignSubEditor = async () => {
    if (!selectedPaper || !subEditorId) {
      alert("Please select a sub-editor");
      return;
    }

    try {
      const res = await fetch(
        `${url}/cheifEditor/assignSubEditor/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subEditorId }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to assign sub-editor");
        return;
      }

      alert("Sub-editor assigned successfully");
      setSubEditorId("");
      fetchPapers();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const assignReviewer = async () => {
    if (!selectedPaper || !selectedReviewer) {
      alert("Please select a reviewer");
      return;
    }

    try {
      const res = await fetch(
        `${url}/cheifEditor/assignReviewer/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewerId: selectedReviewer }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to assign reviewer");
        return;
      }

      alert("Reviewer assigned successfully");
      setSelectedReviewer("");
      fetchPapers();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while assigning reviewer");
    }
  };

  const saveDecision = async () => {
    if (!selectedPaper) return;
    await fetch(`${url}/editorDecision/decide/${selectedPaper.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decision, decision_note: decisionNote }),
    });
    alert("Decision saved");
    setOpenDecision(false);
  };

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">
          Chief Editor Dashboard
        </h1>

        {/* <Label className="text-white pr-2">Select Journal</Label>
        <select
          className="w-64 border rounded"
          value={selectedJournal}
          onChange={(e) => {
            setSelectedJournal(e.target.value);
            fetchPapers(e.target.value);
          }}
        >
          <option value="">-- Select Journal --</option>
          {journals.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {papers.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Status: <b>{p.status}</b>
                </p>
                <Button size="sm" onClick={() => setSelectedPaper(p)}>
                  Assign / Decide
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPaper && (
          <div className="mt-4 space-y-2 border p-4 rounded">
            <h2 className="font-bold text-white">Paper Actions</h2>

            <div className="space-y-2">
              <Label className="text-white">Select Sub-Editor</Label>
              <select
                className="w-full border rounded p-2"
                value={subEditorId}
                onChange={(e) => setSubEditorId(e.target.value)}
              >
                <option value="">-- Select Sub-Editor --</option>
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

            <div className="space-y-2 mt-2">
              <Label className="text-white">Select Reviewer</Label>
              <select
                className="w-full border rounded p-2"
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
              >
                <option value="">-- Select Reviewer --</option>
                {reviewers.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.username}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={assignReviewer}
                disabled={!selectedReviewer}
              >
                Assign Reviewer
              </Button>
            </div>

            <div>
              <Button size="sm" onClick={() => setOpenDecision(true)}>
                Make Decision
              </Button>
            </div>
          </div>
        )}

        <Dialog open={openDecision} onOpenChange={setOpenDecision}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editor Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Decision</Label>
              <select
                className="w-full border rounded"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="pending_revision">Pending Revision</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <Label>Decision Note</Label>
              <Input
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={saveDecision}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
