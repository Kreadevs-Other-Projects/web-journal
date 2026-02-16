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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  BookOpen,
  Settings,
  Calendar,
  Globe,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Mail,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/components/ui/use-toast";

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  chief_editor_id: string;
  owner_id: string;
  status: string;
  description: string;
  website_url: string;
  created_at: string;
  updated_at: string;
}

interface Editor {
  id: string;
  username: string;
  email: string;
}

export default function OwnerDashboard(): JSX.Element {
  const { user, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [chiefEditors, setChiefEditors] = useState<Editor[]>([]);
  const [editorDialog, setEditorDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [loadingEditors, setLoadingEditors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/journal/getOwnerJournal/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJournals(data.journals ?? []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch journals",
        variant: "destructive",
      });
    }
  };

  const fetchChiefEditors = async () => {
    try {
      const res = await fetch(`${url}/owner/getChief-Editor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setChiefEditors(data.data);
      } else {
        toast({
          title: "Failed to fetch chief editor",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error fetching chief editor",
        description: e.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const removeEditor = async (editorId: string) => {
    if (!selectedJournal) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this editor?",
    );
    if (!confirmed) return;

    setChiefEditors((prev) => prev.filter((e) => e.id !== editorId));

    try {
      const res = await fetch(
        `${url}/owner/journal/${selectedJournal.id}/editor/${editorId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to remove editor");

      toast({
        title: "Editor Removed",
        description: "The editor has been removed successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to remove editor",
        variant: "destructive",
      });
      fetchChiefEditors();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      active: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      inactive: { variant: "destructive", icon: XCircle },
      draft: { variant: "outline", icon: AlertCircle },
    };
    const config = variants[status.toLowerCase()] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredJournals = journals.filter((journal) => {
    const matchesSearch =
      journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.issn.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" ||
      journal.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalJournals: journals.length,
    activeJournals: journals.filter((j) => j.status.toLowerCase() === "active")
      .length,
    pendingJournals: journals.filter(
      (j) => j.status.toLowerCase() === "pending",
    ).length,
    totalEditors: chiefEditors.length,
  };

  useEffect(() => {
    if (!isLoading && user?.role === "owner") fetchJournals();
  }, [user, isLoading]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );

  if (!user || user.role !== "owner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-white">
              Unauthorized Access
            </h2>
            <p className="text-muted-foreground">
              You don't have permission to view this page.
            </p>
          </div>
        </Card>
      </div>
    );

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Full authority over journals and editorial roles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Editor
            </Button>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Journal
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Journals
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalJournals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.activeJournals} active this month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Journals
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.activeJournals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(
                  (stats.activeJournals / stats.totalJournals) * 100 || 0
                ).toFixed(1)}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Editors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalEditors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {stats.totalJournals} journals
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Authority Level
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">Full</div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete editorial control
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="journals" className="space-y-4">
          <TabsList className="glass-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journals">Journals</TabsTrigger>
            <TabsTrigger value="editors">Editors</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="journals" className="space-y-4">
            {/* Search and Filter Bar */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search journals by title, acronym, or ISSN..."
                      className="w-full pl-10 pr-4 py-2 bg-background/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 bg-background/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journals Table */}
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-700">
                        <TableHead className="text-white">
                          Journal Details
                        </TableHead>
                        <TableHead className="text-white">ISSN</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">
                          Chief Editor
                        </TableHead>
                        <TableHead className="text-white">Created</TableHead>
                        <TableHead className="text-white text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJournals.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No journals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredJournals.map((journal) => (
                          <TableRow
                            key={journal.id}
                            className="border-b border-gray-700 hover:bg-gray-800/50"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-white">
                                  {journal.title}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                                    {journal.acronym}
                                  </span>
                                  {journal.website_url && (
                                    <a
                                      href={journal.website_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary"
                                    >
                                      <Globe className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {journal.issn}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(journal.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {journal.chief_editor_id
                                      ?.slice(0, 2)
                                      .toUpperCase() || "CE"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate max-w-[100px]">
                                  {journal.chief_editor_id || "Not assigned"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  journal.created_at,
                                ).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedJournal(journal);
                                    fetchChiefEditors();
                                    setEditorDialog(true);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editors">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Chief Editors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chiefEditors.map((editor) => (
                    <Card
                      key={editor.id}
                      className="bg-background/50 border border-gray-700"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {editor.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-white">
                                {editor.username}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {editor.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Chief Editor</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor Management Dialog */}
      <Dialog open={editorDialog} onOpenChange={setEditorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Chief Editors - {selectedJournal?.title}
            </DialogTitle>
          </DialogHeader>

          {loadingEditors ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {chiefEditors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No chief editors assigned to this journal</p>
                    <Button variant="outline" className="mt-4 gap-2">
                      <UserPlus className="h-4 w-4" />
                      Assign Chief Editor
                    </Button>
                  </div>
                ) : (
                  chiefEditors.map((editor) => (
                    <div
                      key={editor.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {editor.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">
                            {editor.username}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {editor.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => removeEditor(editor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
