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
  abstract: string;
  category: string;
  keywords: string;
  status: string;
  created_at: string;
}

export default function Papers(): JSX.Element {
  const { user, token, isLoading } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    category: "",
    keywords: "",
    journal_id: "",
  });

  const [status, setStatus] = useState("");

  const fetchPapers = async () => {
    const res = await fetch(`${url}/papers/getAllPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    setPapers(Array.isArray(data.papers) ? data.papers : []);
  };

  useEffect(() => {
    if (!isLoading && user) fetchPapers();
  }, [user, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Unauthorized</div>;

  const submitPaper = async () => {
    await fetch(`${url}/papers/createPaper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    setOpen(false);
    fetchPapers();
  };

  const updateStatus = async () => {
    if (!selectedPaper) return;
    await fetch(`${url}/papers/updatePaperStatus/${selectedPaper.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    setStatusOpen(false);
    fetchPapers();
  };

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Papers</h1>

          {user.role === "author" && (
            <Button onClick={() => setOpen(true)}>Submit Paper</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {p.abstract.slice(0, 120)}...
                </p>
                <p className="text-xs">Category: {p.category}</p>
                <p className="text-xs">
                  Status: <b>{p.status}</b>
                </p>

                {(user.role === "editor" || user.role === "owner") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPaper(p);
                      setStatus(p.status);
                      setStatusOpen(true);
                    }}
                  >
                    Update Status
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Paper</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Title"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Abstract"
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
            <Input
              placeholder="Category"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="Keywords"
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            />
            <Input
              placeholder="Journal ID"
              onChange={(e) => setForm({ ...form, journal_id: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button onClick={submitPaper}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Paper Status</DialogTitle>
          </DialogHeader>

          <Input value={status} onChange={(e) => setStatus(e.target.value)} />

          <DialogFooter>
            <Button onClick={updateStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
