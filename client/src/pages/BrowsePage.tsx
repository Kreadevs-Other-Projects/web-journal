import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  BookOpen,
  ChevronDown,
  X,
  Download,
  ExternalLink,
  Grid3X3,
  List,
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

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  category: string;
  keywords: string[];
  publishedAt: string;
  year: number;
  doi?: string;
  citations: number;
}

// Sample data
const samplePapers: Paper[] = [
  {
    id: "CONF-2026-001",
    title: "Advances in Quantum Machine Learning: A Comprehensive Survey",
    authors: ["Dr. Alice Chen", "Prof. Robert Martinez", "Dr. Emily Watson"],
    abstract:
      "This paper presents a comprehensive survey of recent advances in quantum machine learning, exploring the intersection of quantum computing and artificial intelligence...",
    category: "Machine Learning",
    keywords: [
      "Quantum Computing",
      "Machine Learning",
      "AI",
      "Neural Networks",
    ],
    publishedAt: "December 15, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.001",
    citations: 42,
  },
  {
    id: "CONF-2026-002",
    title:
      "Sustainable Energy Systems: Integrating Renewable Sources with Smart Grids",
    authors: ["Prof. James Wilson", "Dr. Sarah Kim"],
    abstract:
      "We propose a novel framework for integrating renewable energy sources with existing smart grid infrastructure, addressing key challenges in energy distribution...",
    category: "Energy Systems",
    keywords: [
      "Renewable Energy",
      "Smart Grid",
      "Sustainability",
      "Power Systems",
    ],
    publishedAt: "December 10, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.002",
    citations: 28,
  },
  {
    id: "CONF-2026-003",
    title:
      "Deep Learning Approaches for Natural Language Understanding in Healthcare",
    authors: ["Dr. Michael Brown", "Dr. Lisa Anderson", "Prof. David Lee"],
    abstract:
      "This study explores the application of deep learning models for natural language understanding in healthcare settings, with a focus on clinical documentation...",
    category: "Healthcare AI",
    keywords: ["NLP", "Healthcare", "Deep Learning", "Clinical Text"],
    publishedAt: "December 8, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.003",
    citations: 35,
  },
  {
    id: "CONF-2026-004",
    title:
      "Blockchain-Based Supply Chain Transparency: Implementation and Challenges",
    authors: ["Dr. Jennifer Taylor"],
    abstract:
      "We present a blockchain-based solution for enhancing supply chain transparency, analyzing implementation challenges and proposing practical solutions...",
    category: "Blockchain",
    keywords: [
      "Blockchain",
      "Supply Chain",
      "Transparency",
      "Distributed Systems",
    ],
    publishedAt: "December 5, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.004",
    citations: 19,
  },
  {
    id: "CONF-2026-005",
    title:
      "Neuromorphic Computing: Bridging the Gap Between Biology and Silicon",
    authors: ["Prof. Thomas Garcia", "Dr. Anna White", "Dr. Kevin Zhang"],
    abstract:
      "This paper explores neuromorphic computing architectures that mimic biological neural networks, presenting novel circuit designs and learning algorithms...",
    category: "Computer Architecture",
    keywords: ["Neuromorphic", "Hardware", "Neural Networks", "Computing"],
    publishedAt: "December 1, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.005",
    citations: 51,
  },
  {
    id: "CONF-2026-006",
    title: "Privacy-Preserving Machine Learning: Federated Learning at Scale",
    authors: ["Dr. Rachel Green", "Prof. Mark Davis"],
    abstract:
      "We present novel techniques for privacy-preserving machine learning using federated learning approaches that can scale to millions of devices...",
    category: "Privacy & Security",
    keywords: ["Federated Learning", "Privacy", "Machine Learning", "Security"],
    publishedAt: "November 28, 2025",
    year: 2026,
    doi: "10.1234/conf.2026.006",
    citations: 38,
  },
];

const categories = [
  "All Categories",
  "Machine Learning",
  "Energy Systems",
  "Healthcare AI",
  "Blockchain",
  "Computer Architecture",
  "Privacy & Security",
];

const years = ["All Years", "2026", "2025", "2024", "2023"];

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredPapers = samplePapers.filter((paper) => {
    const matchesSearch =
      searchQuery === "" ||
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some((a) =>
        a.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      paper.keywords.some((k) =>
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All Categories" ||
      paper.category === selectedCategory;

    const matchesYear =
      selectedYear === "All Years" || paper.year.toString() === selectedYear;

    return matchesSearch && matchesCategory && matchesYear;
  });

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif-roboto text-xl font-semibold">
              JournalHub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login?action=submit">
              <Button
                size="sm"
                className="bg-gradient-primary hover:opacity-90"
              >
                Submit Paper
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-24 pb-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif-outfit-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Published <span className="text-gradient-primary">Papers</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore peer-reviewed research from Conference 2026 and previous
              years.
            </p>
          </motion.div>

          {/* Search and filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            {/* Main search */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search papers by title, author, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base input-glow"
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
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-12 px-4",
                  showFilters && "bg-primary text-primary-foreground"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Expandable filters */}
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
                        <SelectTrigger className="w-32">
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
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
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
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8 p-0"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filters */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {filteredPapers.length} papers found
              </span>
              {selectedYear !== "All Years" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {selectedYear}
                  <button onClick={() => setSelectedYear("All Years")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategory !== "All Categories" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-accent">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("All Categories")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Papers grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <StaggerContainer
            className={cn(
              "gap-6",
              viewMode === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col max-w-4xl mx-auto"
            )}
          >
            {filteredPapers.map((paper) => (
              <StaggerItem key={paper.id}>
                <motion.article
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPaper(paper)}
                  className={cn(
                    "glass-card p-6 cursor-pointer group transition-all duration-300",
                    "hover:border-primary/30 hover:shadow-glow"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {paper.id}
                    </span>
                    <span className="text-xs text-accent font-medium">
                      {paper.citations} citations
                    </span>
                  </div>

                  <h3 className="font-serif-outfit text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {paper.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-3">
                    {paper.authors.join(", ")}
                  </p>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {paper.abstract}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {paper.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{paper.category}</span>
                    <span>{paper.publishedAt}</span>
                  </div>
                </motion.article>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {filteredPapers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif-outfit-outfit text-xl font-semibold text-foreground mb-2">
                No papers found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Paper detail modal */}
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
              className="glass-card w-full max-w-3xl max-h-[80vh] overflow-y-auto p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-sm text-muted-foreground font-mono">
                  {selectedPaper.id}
                </span>
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

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <span className="text-primary font-medium">
                  {selectedPaper.category}
                </span>
                <span className="text-muted-foreground">
                  Published: {selectedPaper.publishedAt}
                </span>
                <span className="text-accent">
                  {selectedPaper.citations} citations
                </span>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Authors
                </h4>
                <p className="text-muted-foreground">
                  {selectedPaper.authors.join(", ")}
                </p>
              </div>

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
                  Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPaper.doi && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    DOI
                  </h4>
                  <a
                    href={`https://doi.org/${selectedPaper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedPaper.doi}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-border/50">
                <Button className="btn-physics bg-gradient-primary hover:opacity-90">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="btn-physics">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Cite Paper
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
