import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { Plus, FileText } from "lucide-react";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface Paper {
  id: string;
  title: string;
  status: string;
  authors?: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  submitted: { label: "Submitted", variant: "secondary" },
  under_review: { label: "Under Review", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  published: { label: "Published", variant: "default" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AuthorDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${url}/paper/getPapersByAuthor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPapers(data.papers);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const recentSubmissions = papers.filter((p) => p.status !== "published");
  const publishedArticles = papers.filter((p) => p.status === "published");

  return (
    <DashboardLayout
      role={(user?.role as UserRole) ?? "author"}
      userName={user?.username}
    >
      <PageTransition>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.username || "Author"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track your submissions and manage your research papers.
              </p>
            </div>
            <Button onClick={() => navigate("/author/submit")}>
              <Plus className="h-4 w-4 mr-2" /> Submit Paper
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left panel — Recent Submissions */}
            <div className="border rounded-lg flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="font-semibold">Recent Submissions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/author/submit")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Submit Paper
                </Button>
              </div>
              <div className="overflow-y-auto flex-1 max-h-[60vh]">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Loading…
                  </div>
                ) : recentSubmissions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No submissions yet.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {recentSubmissions.map((paper) => (
                      <li key={paper.id} className="px-4 py-3 flex flex-col gap-1">
                        <span className="font-medium text-sm leading-snug">
                          {paper.title}
                        </span>
                        <div className="flex items-center justify-between">
                          <StatusBadge status={paper.status} />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(paper.updated_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right panel — Published Articles */}
            <div className="border rounded-lg flex flex-col">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold">Publisher</h2>
                <p className="text-xs text-muted-foreground">Published Articles</p>
              </div>
              <div className="overflow-y-auto flex-1 max-h-[60vh]">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Loading…
                  </div>
                ) : publishedArticles.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No published articles yet.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {publishedArticles.map((paper) => (
                      <li key={paper.id} className="px-4 py-3 flex flex-col gap-1">
                        <span className="font-medium text-sm leading-snug">
                          {paper.title}
                        </span>
                        {paper.authors && (
                          <span className="text-xs text-muted-foreground">
                            {paper.authors}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={paper.status} />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(paper.updated_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
