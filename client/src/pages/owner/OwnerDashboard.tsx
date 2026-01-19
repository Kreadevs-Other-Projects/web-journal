import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, BookOpen, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Journal {
  id: string;
  name: string;
  issn: string;
}

interface Editor {
  id: string;
  username: string;
  email: string;
}

export default function OwnerDashboard(): JSX.Element {
  const { user, token, isLoading } = useAuth();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [editorDialog, setEditorDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  const fetchJournals = async () => {
    const res = await fetch(`${url}/publisher/journal/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setJournals(data.journals ?? []);
  };

  const fetchEditors = async (journalId: string) => {
    const res = await fetch(`${url}/owner/journal/${journalId}/editors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEditors(data.editors ?? []);
  };

  useEffect(() => {
    if (!isLoading && user?.role === "owner") fetchJournals();
  }, [user, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== "owner") return <div>Unauthorized</div>;

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-white">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Full authority over journals and editorial roles
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Journals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {journals.length}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Editors
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {editors.length}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Authority
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Final editorial control
            </CardContent>
          </Card>
        </div>

        {/* JOURNAL MANAGEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((j) => (
            <Card key={j.id} className="glass-card">
              <CardHeader>
                <CardTitle>{j.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs">ISSN: {j.issn}</p>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedJournal(j);
                    fetchEditors(j.id);
                    setEditorDialog(true);
                  }}
                >
                  Manage Editors
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={editorDialog} onOpenChange={setEditorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editors – {selectedJournal?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {editors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No editors assigned
              </p>
            )}

            {editors.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between border rounded p-2"
              >
                <div>
                  <p className="font-medium">{e.username}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await fetch(
                      `${url}/owner/journal/${selectedJournal?.id}/editor/${e.id}`,
                      {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    fetchEditors(selectedJournal!.id);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
