import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  X,
  Grid3X3,
  List,
  Layers,
  BookOpen,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimationWrappers";
import { cn } from "@/lib/utils";
import { url } from "@/url";
import Navbar from "@/components/navbar";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  pdf_url: string;
}

interface Journal {
  journal_id: string;
  journal_title: string;
  issn: string;
  aims_and_scope?: string;
  issue: string;
  published_at: string;
  papers: Paper[];
}

export default function BrowsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [selectedJournal, setSelectedJournal] = useState(
    params.get("journal") || "All Journals",
  );
  const [selectedYear, setSelectedYear] = useState(
    params.get("year") || "All Years",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (params.get("view") as "grid" | "list") || "grid",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrowse = async () => {
      try {
        const res = await fetch(`${url}/browse/getBrowseData`);
        const data = await res.json();
        if (data.success) {
          setJournals(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrowse();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set("q", searchQuery);
    if (selectedJournal !== "All Journals")
      queryParams.set("journal", selectedJournal);
    if (selectedYear !== "All Years") queryParams.set("year", selectedYear);
    if (viewMode !== "grid") queryParams.set("view", viewMode);
    navigate(`/browse?${queryParams.toString()}`, { replace: true });
  }, [searchQuery, selectedJournal, selectedYear, viewMode, navigate]);

  const journalTitles = [
    "All Journals",
    ...Array.from(new Set(journals.map((j) => j.journal_title))),
  ];

  const years = [
    "All Years",
    ...Array.from(
      new Set(
        journals.map((j) => new Date(j.published_at).getFullYear().toString()),
      ),
    ).sort((a, b) => Number(b) - Number(a)),
  ];

  const filteredJournals = journals
    .filter((journal) => {
      const matchesJournal =
        selectedJournal === "All Journals" ||
        journal.journal_title === selectedJournal;
      const matchesYear =
        selectedYear === "All Years" ||
        new Date(journal.published_at).getFullYear().toString() ===
          selectedYear;
      return matchesJournal && matchesYear;
    })
    .map((journal) => ({
      ...journal,
      papers: journal.papers.filter(
        (paper) =>
          searchQuery === "" ||
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((journal) => journal.papers.length > 0 || searchQuery === "");

  const totalPapers = filteredJournals.reduce(
    (acc, j) => acc + j.papers.length,
    0,
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleJournalClick = (journal: Journal) => {
    navigate(`/journal/${journal.journal_id}`, {
      state: { journal },
    });
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  return (
    <PageTransition className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif-outfit-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Published <span className="text-gradient-primary">Journals</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore peer-reviewed research journals and their published
              papers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search papers by title or abstract..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base input-glow text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-12 px-4",
                  showFilters && "bg-accent text-muted",
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-4 flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-32 text-muted-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={selectedJournal}
                        onValueChange={setSelectedJournal}
                      >
                        <SelectTrigger className="w-56 text-muted-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {journalTitles.map((j) => (
                            <SelectItem key={j} value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("grid")}
                        className="h-8 w-8 p-0"
                        title="Grid view"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("list")}
                        className="h-8 w-8 p-0 text-muted-foreground"
                        title="List view"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-2 text-sm mt-3">
              <span className="text-muted-foreground">
                {loading
                  ? "Loading..."
                  : `${filteredJournals.length} journal${filteredJournals.length !== 1 ? "s" : ""}, ${totalPapers} paper${totalPapers !== 1 ? "s" : ""} found`}
              </span>
              {selectedYear !== "All Years" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  Year: {selectedYear}
                  <button onClick={() => setSelectedYear("All Years")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedJournal !== "All Journals" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-accent">
                  Journal: {selectedJournal}
                  <button onClick={() => setSelectedJournal("All Journals")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-secondary">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            {/* View mode toggle outside filters when filters are closed */}
            {!showFilters && (
              <div className="flex justify-end mt-4">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("grid")}
                    className="h-8 w-8 p-0"
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className="h-8 w-8 p-0 text-muted-foreground"
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredJournals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif-outfit-outfit text-2xl font-semibold text-foreground mb-3">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </motion.div>
          ) : (
            <StaggerContainer
              className={cn(
                "gap-6 max-w-7xl mx-auto",
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col",
              )}
            >
              {filteredJournals.map((journal) => (
                <StaggerItem key={journal.journal_id}>
                  {viewMode === "grid" ? (
                    /* Grid View */
                    <motion.div
                      whileHover={{ y: -5 }}
                      onClick={() => handleJournalClick(journal)}
                      className="glass-card p-6 cursor-pointer group transition-all duration-300 hover:border-primary/30 hover:shadow-glow h-full flex flex-col"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-serif-outfit text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {journal.journal_title}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {journal.issue}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            ISSN: {journal.issn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(journal.published_at)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-sm font-medium text-accent">
                          {journal.papers.length} paper
                          {journal.papers.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                          View Journal →
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    /* List View */
                    <motion.div
                      whileHover={{ x: 5 }}
                      onClick={() => handleJournalClick(journal)}
                      className="glass-card p-6 cursor-pointer group transition-all duration-300 hover:border-primary/30 hover:shadow-glow flex items-center gap-6"
                    >
                      <div className="h-16 w-16 rounded-lg bg-gradient-primary/10 flex items-center justify-center shrink-0">
                        <Layers className="h-8 w-8 text-primary" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <h2 className="font-serif-outfit text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                            {journal.journal_title}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {journal.issue}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              ISSN: {journal.issn}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {formatDate(journal.published_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <span className="text-sm font-medium text-accent whitespace-nowrap">
                            {journal.papers.length} paper
                            {journal.papers.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform whitespace-nowrap">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
