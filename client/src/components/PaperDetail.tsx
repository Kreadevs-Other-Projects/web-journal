import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimationWrappers";
import {
  BookOpen,
  Download,
  ArrowLeft,
  Calendar,
  Tag,
  FileText,
  Layers,
  Grid3X3,
  List,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { url } from "@/url";
import Navbar from "./navbar";

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

export default function JournalDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { journal } = location.state || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(!journal);

  useEffect(() => {
    // If no journal data in state, fetch it
    if (!journal) {
      // You can implement fetching logic here using the journal ID from URL
      // For now, just redirect back to browse
      navigate("/browse");
    } else {
      setLoading(false);
    }
  }, [journal, navigate]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Filter papers based on search
  const filteredPapers =
    journal?.papers.filter(
      (paper) =>
        searchQuery === "" ||
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </motion.div>

          {/* Journal Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8 border-l-4 border-l-primary"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-primary font-medium uppercase tracking-wide">
                      Journal
                    </span>
                  </div>
                  <h1 className="font-serif-outfit-outfit text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {journal.journal_title}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {journal.issue}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 text-sm text-muted-foreground shrink-0">
                <span className="font-mono text-sm bg-muted px-3 py-1.5 rounded">
                  ISSN: {journal.issn}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(journal.published_at)}
                </span>
                <span className="text-accent font-semibold text-base">
                  {journal.papers.length} paper
                  {journal.papers.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Aims & Scope */}
          {journal.aims_and_scope && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Aims &amp; Scope
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {journal.aims_and_scope}
              </p>
            </motion.div>
          )}

          {/* Search and View Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search papers in this journal..."
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
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-10 w-10 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-10 w-10 p-0 text-muted-foreground"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredPapers.length} paper
                {filteredPapers.length !== 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* Papers Grid/List */}
          {filteredPapers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif-outfit-outfit text-2xl font-semibold text-foreground mb-3">
                No papers found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search."
                  : "This journal has no papers yet."}
              </p>
            </motion.div>
          ) : (
            <StaggerContainer
              className={cn(
                "gap-6",
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col",
              )}
            >
              {filteredPapers.map((paper) => (
                <StaggerItem key={paper.id}>
                  <motion.article
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedPaper(paper)}
                    className={cn(
                      "glass-card p-6 cursor-pointer group transition-all duration-300 hover:border-primary/30 hover:shadow-glow",
                      viewMode === "list" ? "flex gap-6" : "flex flex-col",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-4",
                        viewMode === "list" ? "flex-1" : "mb-4",
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3
                        className={cn(
                          "font-serif-outfit font-semibold text-foreground group-hover:text-primary transition-colors",
                          viewMode === "list"
                            ? "text-lg"
                            : "text-base line-clamp-2",
                        )}
                      >
                        {paper.title}
                      </h3>
                    </div>

                    {viewMode === "list" ? (
                      <>
                        <p className="text-muted-foreground line-clamp-2 flex-1">
                          {paper.abstract}
                        </p>
                        <div className="flex items-center gap-4 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`${url}${paper.pdf_url}`, "_blank");
                            }}
                            className="text-primary"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <span className="text-primary text-sm font-medium">
                            View Details →
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                          {paper.abstract}
                        </p>
                        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`${url}${paper.pdf_url}`, "_blank");
                            }}
                            className="text-primary hover:text-primary/80 p-0"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download PDF
                          </Button>
                          <span className="text-primary font-medium">
                            View Details →
                          </span>
                        </div>
                      </>
                    )}
                  </motion.article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>

      {/* Paper Detail Modal */}
      <AnimatePresence>
        {selectedPaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedPaper(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-xs text-primary font-medium uppercase tracking-wide">
                    {journal.journal_title}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {journal.issue} · ISSN: {journal.issn}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 className="font-serif-outfit-outfit text-2xl font-bold text-foreground mb-4">
                {selectedPaper.title}
              </h2>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Abstract
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedPaper.abstract}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Published
                </h4>
                <p className="text-muted-foreground">
                  {formatDate(journal.published_at)}
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border/50">
                <a
                  href={`${url}${selectedPaper.pdf_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button className="btn-physics bg-gradient-primary hover:opacity-90">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="btn-physics"
                  onClick={() => setSelectedPaper(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
