import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  username: string;
  email: string;
}

export default function CETeam() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [subEditors, setSubEditors] = useState<TeamMember[]>([]);
  const [reviewers, setReviewers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${url}/chiefEditor/getSubEditors`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${url}/chiefEditor/getReviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([seData, rvData]) => {
        if (seData.success) setSubEditors(seData.data || []);
        if (rvData.success) setReviewers(rvData.data || []);
      })
      .catch((e) => toast({ variant: "destructive", title: "Error", description: e.message }))
      .finally(() => setLoading(false));
  }, [token]);

  const MemberCard = ({ member, role }: { member: TeamMember; role: string }) => (
    <div className="flex items-center gap-3 py-2.5 px-4 border-b border-border last:border-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={undefined} />
        <AvatarFallback className="text-xs bg-muted">
          {member.username?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.username}</p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {role.replace(/_/g, " ")}
      </Badge>
    </div>
  );

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Sub editors and reviewers in your journals</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sub Editors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Sub Editors
                  <Badge variant="secondary" className="ml-auto">{subEditors.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {subEditors.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-3">No sub editors found.</p>
                ) : (
                  subEditors.map((m) => <MemberCard key={m.id} member={m} role="sub_editor" />)
                )}
              </CardContent>
            </Card>

            {/* Reviewers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Reviewers
                  <Badge variant="secondary" className="ml-auto">{reviewers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reviewers.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-3">No reviewers found.</p>
                ) : (
                  reviewers.map((m) => <MemberCard key={m.id} member={m} role="reviewer" />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
