import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileText, Users, ArrowLeft, Eye, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  status: string;
  file_url: string;
  version?: string;
  category?: string;
  abstract?: string;
}

interface Reviewer {
  id: string;
  username: string;
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
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    setReviewers(data.data || []);
    setOpenReviewers(true);
  };

  const updateStatus = async () => {
    if (!selectedPaper || !status) return;

    await fetch(
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

    setSelectedPaper(null);
    fetchPapers();
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 bg-white"
                onClick={() => setSelectedPaper(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedPaper.title}
                </h1>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{selectedPaper.version}</Badge>
                  <Badge variant="outline">{selectedPaper.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Paper PDF
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <iframe
                    src={`${url}${selectedPaper.file_url}`}
                    className="w-full h-[75vh]"
                  />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Sub-Editor Actions</CardTitle>
                  <CardDescription>
                    Review paper & manage workflow
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <Label>Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full mt-2 rounded-md
                       bg-[#020617] text-white
                        border border-white/20
                        px-3 py-2
                        focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option
                        value="under_review"
                        className="bg-[#020617] text-white"
                      >
                        Under Review
                      </option>
                      <option
                        value="pending_revision"
                        className="bg-[#020617] text-white"
                      >
                        Pending Revision
                      </option>
                      <option
                        value="resubmitted"
                        className="bg-[#020617] text-white"
                      >
                        Resubmitted
                      </option>
                    </select>

                    <Button
                      onClick={updateStatus}
                      className="mt-3 w-full btn-physics"
                    >
                      Update Status
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fetchReviewers(selectedPaper.id)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Assigned Reviewers
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        window.open(`${url}${selectedPaper.file_url}`, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open Fullscreen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">
                Sub-Editor Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage assigned papers and review progress
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {papers.map((paper, i) => (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="glass-card hover:shadow-glow cursor-pointer"
                    onClick={() => setSelectedPaper(paper)}
                  >
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-2">
                        {paper.status}
                      </Badge>
                      <h3 className="text-lg font-semibold text-white">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {paper.abstract || "No abstract available"}
                      </p>

                      <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Latest Version
                        </span>
                        <span>{paper.version}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={openReviewers} onOpenChange={setOpenReviewers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigned Reviewers</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 space-y-2">
            {reviewers.map((r) => (
              <div key={r.id} className="border rounded p-3">
                <p className="font-medium">{r.username}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
