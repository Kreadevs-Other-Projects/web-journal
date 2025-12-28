import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  UserPlus,
  ChevronRight,
  Star,
  Award,
  Briefcase,
} from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

// Sample data
const incomingSubmissions = [
  {
    id: "SUB-2024-001",
    title:
      "Machine Learning Applications in Climate Modeling: A Comprehensive Survey",
    author: "Dr. Sarah Wilson",
    category: "Artificial Intelligence",
    submittedDate: "2024-01-25",
    status: "submitted" as const,
    keywords: ["Machine Learning", "Climate", "Neural Networks"],
    abstract:
      "This paper provides a comprehensive review of machine learning techniques...",
  },
  {
    id: "SUB-2024-002",
    title: "Quantum Computing Approaches to Cryptographic Security",
    author: "Prof. James Chen",
    category: "Quantum Computing",
    submittedDate: "2024-01-24",
    status: "submitted" as const,
    keywords: ["Quantum", "Cryptography", "Security"],
    abstract:
      "An exploration of quantum computing implications for modern cryptographic systems...",
  },
  {
    id: "SUB-2024-003",
    title: "Sustainable Urban Development Through Smart City Technologies",
    author: "Michael Zhang",
    category: "Urban Planning",
    submittedDate: "2024-01-23",
    status: "submitted" as const,
    keywords: ["Smart City", "IoT", "Sustainability"],
    abstract: "Investigating the integration of IoT devices and AI systems...",
  },
  {
    id: "SUB-2024-004",
    title: "Advances in Natural Language Processing for Healthcare",
    author: "Dr. Emily Brown",
    category: "Healthcare AI",
    submittedDate: "2024-01-22",
    status: "submitted" as const,
    keywords: ["NLP", "Healthcare", "AI"],
    abstract:
      "A study on applying NLP techniques to medical records and clinical notes...",
  },
];

const subEditors = [
  {
    id: "SE-001",
    name: "Dr. Emily Brown",
    email: "emily.b@lab.edu",
    expertise: ["Artificial Intelligence", "Machine Learning", "Data Science"],
    assignedPapers: 5,
    completedPapers: 42,
    avgProcessingTime: 12,
    rating: 4.8,
    workload: 65,
    avatar: null,
  },
  {
    id: "SE-002",
    name: "Prof. Robert Taylor",
    email: "rtaylor@uni.edu",
    expertise: ["Quantum Computing", "Physics", "Cryptography"],
    assignedPapers: 3,
    completedPapers: 38,
    avgProcessingTime: 10,
    rating: 4.9,
    workload: 40,
    avatar: null,
  },
  {
    id: "SE-003",
    name: "Dr. Lisa Park",
    email: "lpark@institute.org",
    expertise: ["Urban Planning", "IoT", "Sustainability"],
    assignedPapers: 4,
    completedPapers: 35,
    avgProcessingTime: 14,
    rating: 4.7,
    workload: 55,
    avatar: null,
  },
  {
    id: "SE-004",
    name: "Dr. Michael Chen",
    email: "mchen@research.org",
    expertise: ["Healthcare AI", "NLP", "Bioinformatics"],
    assignedPapers: 6,
    completedPapers: 51,
    avgProcessingTime: 11,
    rating: 4.9,
    workload: 80,
    avatar: null,
  },
];

const weeklyStats = [
  { day: "Mon", submissions: 12, processed: 8 },
  { day: "Tue", submissions: 15, processed: 11 },
  { day: "Wed", submissions: 18, processed: 14 },
  { day: "Thu", submissions: 14, processed: 12 },
  { day: "Fri", submissions: 20, processed: 15 },
  { day: "Sat", submissions: 8, processed: 6 },
  { day: "Sun", submissions: 5, processed: 4 },
];

const categoryDistribution = [
  { name: "AI/ML", value: 35, color: "hsl(var(--primary))" },
  { name: "Quantum", value: 20, color: "hsl(var(--info))" },
  { name: "Healthcare", value: 25, color: "hsl(var(--success))" },
  { name: "Urban", value: 12, color: "hsl(var(--warning))" },
  { name: "Other", value: 8, color: "hsl(var(--muted-foreground))" },
];

export default function ChiefEditorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<
    (typeof incomingSubmissions)[0] | null
  >(null);
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);

  const filteredSubmissions = incomingSubmissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || sub.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAssign = () => {
    console.log(
      "Assigning paper",
      selectedPaper?.id,
      "to editor",
      selectedEditor
    );
    setAssignModalOpen(false);
    setSelectedPaper(null);
    setSelectedEditor(null);
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 80) return "text-destructive";
    if (workload >= 60) return "text-warning";
    return "text-success";
  };

  const getWorkloadBg = (workload: number) => {
    if (workload >= 80) return "bg-destructive";
    if (workload >= 60) return "bg-warning";
    return "bg-success";
  };

  const getMatchingEditors = (paper: (typeof incomingSubmissions)[0]) => {
    return subEditors.filter((editor) =>
      editor.expertise.some(
        (exp) =>
          paper.category.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(paper.category.toLowerCase().split(" ")[0])
      )
    );
  };

  return (
    <DashboardLayout role="chief_editor" userName="Dr. Lisa Park">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif-outfit text-3xl font-bold">
              Chief Editor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage submissions and sub-editor assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="py-2 px-4">
              <Calendar className="h-4 w-4 mr-2" />
              Today: {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "New Submissions",
              value: 24,
              change: "+8",
              icon: FileText,
              color: "text-primary",
              trend: "up",
            },
            {
              label: "Pending Assignment",
              value: 12,
              icon: Clock,
              color: "text-warning",
            },
            {
              label: "Under Review",
              value: 45,
              icon: Users,
              color: "text-info",
            },
            {
              label: "Accepted This Month",
              value: 18,
              change: "+3",
              icon: CheckCircle2,
              color: "text-success",
              trend: "up",
            },
            {
              label: "Rejection Rate",
              value: "15%",
              change: "-2%",
              icon: XCircle,
              color: "text-muted-foreground",
              trend: "down",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50",
                        stat.color
                      )}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.change && (
                      <Badge
                        className={cn(
                          "text-xs",
                          stat.trend === "up"
                            ? "bg-success/10 text-success"
                            : "bg-info/10 text-info"
                        )}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    {typeof stat.value === "number" ? (
                      <AnimatedCounter
                        end={stat.value}
                        className="text-2xl font-bold"
                      />
                    ) : (
                      <span className="text-2xl font-bold">{stat.value}</span>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions Queue */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incoming Submissions</CardTitle>
                    <CardDescription>
                      Papers awaiting sub-editor assignment
                    </CardDescription>
                  </div>
                  <Badge className="bg-warning/10 text-warning">
                    {incomingSubmissions.length} pending
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search submissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 input-glow"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Artificial Intelligence">
                        AI/ML
                      </SelectItem>
                      <SelectItem value="Quantum Computing">Quantum</SelectItem>
                      <SelectItem value="Healthcare AI">Healthcare</SelectItem>
                      <SelectItem value="Urban Planning">Urban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-3">
                    <AnimatePresence>
                      {filteredSubmissions.map((submission, index) => (
                        <motion.div
                          key={submission.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group"
                        >
                          <Card className="border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs shrink-0"
                                    >
                                      {submission.id}
                                    </Badge>
                                    <Badge className="text-xs bg-primary/10 text-primary shrink-0">
                                      {submission.category}
                                    </Badge>
                                    <StatusBadge status={submission.status} />
                                  </div>

                                  <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                    {submission.title}
                                  </h3>

                                  <p className="text-xs text-muted-foreground mb-2">
                                    by {submission.author} • Submitted{" "}
                                    {new Date(
                                      submission.submittedDate
                                    ).toLocaleDateString()}
                                  </p>

                                  <div className="flex flex-wrap gap-1">
                                    {submission.keywords.map((keyword) => (
                                      <Badge
                                        key={keyword}
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPaper(submission);
                                      setAssignModalOpen(true);
                                    }}
                                    className="btn-physics"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Weekly Activity Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="submissions"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="processed"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <RePieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {categoryDistribution.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sub-Editors Section */}
        <Card className="glass-card">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sub-Editor Directory</CardTitle>
                <CardDescription>
                  Workload and performance overview
                </CardDescription>
              </div>
              <Button variant="outline" className="btn-physics">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subEditors.map((editor, index) => (
                <motion.div
                  key={editor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={editor.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {editor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {editor.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {editor.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Workload
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              getWorkloadColor(editor.workload)
                            )}
                          >
                            {editor.workload}%
                          </span>
                        </div>
                        <Progress
                          value={editor.workload}
                          className={cn(
                            "h-1.5",
                            getWorkloadBg(editor.workload)
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="text-center p-2 rounded-lg bg-muted/30">
                            <p className="text-lg font-bold">
                              {editor.assignedPapers}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Active
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/30">
                            <p className="text-lg font-bold">
                              {editor.completedPapers}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Completed
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-accent fill-accent" />
                            <span className="text-sm font-medium">
                              {editor.rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {editor.avgProcessingTime}d avg
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {editor.expertise.slice(0, 2).map((exp) => (
                            <Badge
                              key={exp}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {exp}
                            </Badge>
                          ))}
                          {editor.expertise.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{editor.expertise.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="glass-card sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-serif-outfit">
              Assign to Sub-Editor
            </DialogTitle>
            <DialogDescription>
              Select a sub-editor to handle this submission
            </DialogDescription>
          </DialogHeader>

          {selectedPaper && (
            <div className="space-y-4 py-4">
              {/* Paper Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedPaper.id}
                  </Badge>
                  <Badge className="text-xs bg-primary/10 text-primary">
                    {selectedPaper.category}
                  </Badge>
                </div>
                <h4 className="font-semibold mb-1">{selectedPaper.title}</h4>
                <p className="text-sm text-muted-foreground">
                  by {selectedPaper.author}
                </p>
              </div>

              {/* Recommended Editors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">
                    Recommended Based on Expertise
                  </span>
                </div>

                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {subEditors.map((editor) => {
                      const isMatching =
                        getMatchingEditors(selectedPaper).includes(editor);
                      return (
                        <motion.div
                          key={editor.id}
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all",
                            selectedEditor === editor.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                            isMatching && "ring-1 ring-accent/50"
                          )}
                          onClick={() => setSelectedEditor(editor.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                                  {editor.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {editor.name}
                                  </h4>
                                  {isMatching && (
                                    <Badge className="text-[10px] bg-accent/10 text-accent">
                                      Best Match
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {editor.expertise.map((exp) => (
                                    <Badge
                                      key={exp}
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {exp}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  getWorkloadColor(editor.workload)
                                )}
                              >
                                {editor.workload}% load
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 text-accent fill-accent" />
                                {editor.rating}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedEditor}
              className="btn-physics"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Assign Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
