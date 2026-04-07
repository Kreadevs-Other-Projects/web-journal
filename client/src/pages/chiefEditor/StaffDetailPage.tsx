import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  degrees: string[] | null;
  keywords: string[] | null;
  profile_pic_url: string | null;
}

interface Assignment {
  paper_id: string;
  paper_title: string;
  journal_name: string;
  status: string;
  assigned_at: string;
  decision?: string | null;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-2xl uppercase">
      {letters}
    </div>
  );
}

export default function StaffDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedId, paperId, journalId, role, scrollPosition, fromPath } =
    (location.state || {}) as {
      selectedId?: string;
      paperId?: string;
      journalId?: string;
      role?: string;
      scrollPosition?: number;
      fromPath?: string;
    };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [pastAssignments, setPastAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !userId) return;
    // Fetch user profile from editorial board / user list
    Promise.all([
      fetch(`${url}/chiefEditor/getSubEditors`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${url}/chiefEditor/getReviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([seData, rvData]) => {
        const allUsers = [
          ...(seData.data || []).map((u: any) => ({ ...u, role: "sub_editor" })),
          ...(rvData.data || []).map((u: any) => ({ ...u, role: "reviewer" })),
        ];
        const found = allUsers.find((u) => u.id === userId);
        if (found) setProfile(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, userId]);

  const handleSelectAndBack = (newSelectedId: string) => {
    navigate(fromPath || -1 as any, {
      state: {
        restoredSelectedId: newSelectedId,
        scrollPosition,
      },
    });
  };

  const handleBack = () => {
    navigate(fromPath || -1 as any, {
      state: {
        restoredSelectedId: selectedId,
        scrollPosition,
      },
    });
  };

  const roleLabel = profile?.role === "sub_editor" ? "Associate Editor" : "Reviewer";

  if (loading) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="text-center py-20 text-muted-foreground">Staff member not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to All {role === "sub_editor" ? "Associate Editors" : "Reviewers"}
        </Button>

        {/* Header */}
        <div className="flex items-center gap-5">
          {profile.profile_pic_url ? (
            <img
              src={`${url}/${profile.profile_pic_url}`}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <Initials name={profile.username} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.username}</h1>
            <Badge variant="outline" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>

        {/* Contact */}
        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent>
            <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
              <Mail className="h-4 w-4" />
              {profile.email}
            </a>
          </CardContent>
        </Card>

        {/* Degrees */}
        {profile.degrees && profile.degrees.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Degrees</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {profile.degrees.map((d, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{d}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Keywords */}
        {profile.keywords && profile.keywords.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Keywords / Expertise</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.keywords.map((kw) => (
                  <span key={kw} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {kw}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleBack}>
            Back
          </Button>
          {paperId && (
            <Button
              className="flex-1 gap-1.5"
              onClick={() => handleSelectAndBack(profile.id)}
            >
              <UserCheck className="h-4 w-4" />
              Select This Person
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
