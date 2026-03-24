import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Send,
  Search,
  Users,
  Award,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  ChevronDown,
  Filter,
  Folder,
  Calendar,
  ArrowUpDown,
  FileText,
  User,
  Building,
  Hash,
  Info,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FloatingElement,
} from "@/components/AnimationWrappers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
import { url } from "@/url";

interface SearchFilters {
  query: string;
  category: string;
  year: string;
}

const stats = [
  { label: "Papers Submitted", value: 12847, suffix: "+" },
  { label: "Expert Reviewers", value: 3256, suffix: "" },
  { label: "Acceptance Rate", value: 24, suffix: "%" },
  { label: "Countries", value: 89, suffix: "" },
];

const features = [
  {
    icon: Shield,
    title: "Double-Blind Review",
    description:
      "Complete anonymity between authors and reviewers ensures unbiased evaluation.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "Average review cycle of 4-6 weeks with real-time status tracking.",
  },
  {
    icon: FileCheck,
    title: "Version Control",
    description:
      "Full revision history with diff comparison and timeline view.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Multi-stage review process with expert committee oversight.",
  },
];

const testimonials = [
  {
    quote:
      "The most streamlined peer review experience I've ever had. The platform is intuitive and the review process is transparent.",
    author: "Dr. Sarah Chen",
    role: "Professor of Computer Science, MIT",
  },
  {
    quote:
      "As a reviewer, I appreciate the clean interface and the ability to track all my assignments in one place.",
    author: "Prof. James Miller",
    role: "Research Director, Oxford University",
  },
  {
    quote:
      "Our conference proceedings have never been more organized. JournalHub transformed our workflow.",
    author: "Dr. Maria Santos",
    role: "Conference Chair, ICML 2025",
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    year: "",
  });
  const [errors, setErrors] = useState<string>("");

  // Home page real data
  const [homeJournals, setHomeJournals] = useState<any[]>([]);
  const [homePapers, setHomePapers] = useState<any[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(true);

  useEffect(() => {
    fetch(`${url}/browse/home/journals?limit=6`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setHomeJournals(d.journals || []); })
      .catch(() => {})
      .finally(() => setJournalsLoading(false));

    fetch(`${url}/browse/home/publications?limit=6`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setHomePapers(d.papers || []); })
      .catch(() => {})
      .finally(() => setPapersLoading(false));
  }, []);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (errors) setErrors("");
  };
  const validateFilters = (): boolean => {
    if (!filters.query && !filters.category && !filters.year) {
      setErrors("Please select at least one search filter");
      return false;
    }
    if (filters.query && filters.query.length < 2) {
      setErrors("Search query must be at least 2 characters");
      return false;
    }

    return true;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFilters()) {
      return;
    }

    const params = new URLSearchParams();

    if (filters.query) params.append("q", filters.query);
    if (filters.category) params.append("category", filters.category);
    if (filters.year) params.append("year", filters.year);

    navigate(`/browse?${params.toString()}`);
  };

  const categories = [
    { value: "", label: "All Categories" },
    { value: "physics", label: "Physics" },
    { value: "computer-science", label: "Computer Science" },
    { value: "mathematics", label: "Mathematics" },
    { value: "biology", label: "Biology" },
    { value: "chemistry", label: "Chemistry" },
    { value: "engineering", label: "Engineering" },
    { value: "medicine", label: "Medicine" },
    { value: "social-sciences", label: "Social Sciences" },
    { value: "arts-humanities", label: "Arts & Humanities" },
    { value: "business-economics", label: "Business & Economics" },
    { value: "environmental-science", label: "Environmental Science" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: "", label: "All Years" },
    ...Array.from({ length: currentYear - 1899 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
    })),
    { value: "older", label: "Older than 1900" },
  ];

  return (
    <PageTransition className="min-h-screen bg-background">
      <div className="noise-overlay" />

      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-30 dark:opacity-50" />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement delay={0} className="absolute top-1/4 left-[10%]">
            <div className="h-32 w-24 rounded-lg bg-gradient-to-br from-primary/35 dark:from-primary/20 to-primary/15 dark:to-primary/5 backdrop-blur-sm border border-primary/35 dark:border-primary/20 rotate-[-15deg]" />
          </FloatingElement>
          <FloatingElement delay={1} className="absolute top-1/3 right-[15%]">
            <div className="h-40 w-28 rounded-lg bg-gradient-to-br from-accent/35 dark:from-accent/20 to-accent/15 dark:to-accent/5 backdrop-blur-sm border border-accent/35 dark:border-accent/20 rotate-[10deg]" />
          </FloatingElement>
          <FloatingElement delay={2} className="absolute bottom-1/4 left-[20%]">
            <div className="h-28 w-20 rounded-lg bg-gradient-to-br from-info/35 dark:from-info/20 to-info/15 dark:to-info/5 backdrop-blur-sm border border-info/35 dark:border-info/20 rotate-[5deg]" />
          </FloatingElement>
          <FloatingElement
            delay={0.5}
            className="absolute bottom-1/3 right-[25%]"
          >
            <div className="h-36 w-26 rounded-lg bg-gradient-to-br from-success/35 dark:from-success/20 to-success/15 dark:to-success/5 backdrop-blur-sm border border-success/35 dark:border-success/20 rotate-[-8deg]" />
          </FloatingElement>
        </div>

        {/* Hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <StaggerContainer className="max-w-4xl mx-auto">
            <StaggerItem>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-accent font-medium">
                  Conference 2026 Submissions Open
                </span>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-serif-outfit text-5xl md:text-7xl font-bold leading-tight mb-6">
                <span className="text-foreground">Elevate Your</span>
                <br />
                <span className="text-gradient-primary">
                  Scientific Publishing
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                A premium platform for blind peer review and journal management.
                Submit, review, and publish with confidence.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col items-center justify-center gap-8">
                {/* Horizontal Search Bar - Single Line */}
                <div className="w-full max-w-6xl mx-auto">
                  <div className="relative glass-card p-4 rounded-2xl border border-border/50 shadow-2xl">
                    <form onSubmit={handleSearch}>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search Input - Left */}
                        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <Search className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search papers by title, author, or keywords..."
                            value={filters.query}
                            onChange={(e) =>
                              handleFilterChange("query", e.target.value)
                            }
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-foreground placeholder:text-muted-foreground"
                          />
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <select
                              value={filters.category}
                              onChange={(e) =>
                                handleFilterChange("category", e.target.value)
                              }
                              className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                            >
                              {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        {/* Year Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <select
                              value={filters.year}
                              onChange={(e) =>
                                handleFilterChange("year", e.target.value)
                              }
                              className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                            >
                              {years.map((year) => (
                                <option key={year.value} value={year.value}>
                                  {year.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        {/* Search Button */}
                        <Button
                          type="submit"
                          className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-6 py-3 whitespace-nowrap flex-shrink-0"
                        >
                          <Search className="h-5 w-5 mr-2" />
                          Search
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Error Message */}
                  {errors && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JOURNALS SECTION ===== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                Journals
              </h2>
              <p className="text-muted-foreground mt-1">Explore our collection of peer-reviewed academic journals</p>
            </div>
            <Link to="/browse">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {journalsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : homeJournals.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No journals available yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeJournals.map((j) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 flex flex-col gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {j.logo_url ? (
                        <img src={`${url}${j.logo_url}`} alt={j.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{j.title}</h3>
                      {j.issn && <p className="text-xs text-muted-foreground mt-0.5">ISSN: {j.issn}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {j.type && (
                      <Badge variant="secondary" className="text-xs">
                        {j.type === "open_access" ? "Open Access" : "Subscription"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{j.article_count ?? 0} article{j.article_count !== 1 ? "s" : ""}</span>
                  </div>
                  <Link to={`/journal/${j.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-auto">
                      View Journal <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== RECENT PUBLICATIONS SECTION ===== */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                Recent Publications
              </h2>
              <p className="text-muted-foreground mt-1">Latest research published in our journals</p>
            </div>
            <Link to="/archive">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {papersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : homePapers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No publications yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homePapers.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 flex flex-col gap-3"
                >
                  <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-3">{p.title}</h3>
                  {p.author_names && p.author_names.length > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {Array.isArray(p.author_names) ? p.author_names.join(", ") : p.author_names}
                    </p>
                  )}
                  {p.journal_title && (
                    <p className="text-xs text-primary font-medium truncate">{p.journal_title}</p>
                  )}
                  {p.keywords && p.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(p.keywords) ? p.keywords : []).slice(0, 3).map((k: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    {p.published_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                    <Link to={`/articles/${p.id}`}>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        Read Article <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="text-gradient-accent">JournalHub</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by researchers, for researchers. Experience the future of
              academic publishing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-6 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined process from submission to publication.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Submit",
                desc: "Upload your paper with metadata and keywords",
              },
              {
                step: 2,
                title: "Review",
                desc: "Expert reviewers evaluate your work anonymously",
              },
              {
                step: 3,
                title: "Revise",
                desc: "Address feedback through our version control system",
              },
              {
                step: 4,
                title: "Publish",
                desc: "Accepted papers are published to our public archive",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative flex items-center gap-8 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary">
                  {item.step}
                </div>
                <div className="flex-1 glass-card p-6">
                  <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="absolute left-8 top-16 h-8 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by{" "}
              <span className="text-gradient-accent">Researchers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of academics who trust JournalHub for their
              publishing needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 w-4 text-accent">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:bg-gradient-dark" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-15 dark:opacity-30" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Publish Your Research?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join our community of researchers and take the first step towards
              publication.
            </p>
            <Link to="/login?action=submit">
              <Button
                size="lg"
                className="btn-physics bg-gradient-accent text-accent-foreground hover:opacity-90 text-lg px-10 py-6 glow-accent"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-serif-roboto text-lg font-semibold">
                  JournalHub
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Empowering researchers with modern publishing tools.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/browse"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse Papers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Submit Paper
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Reviewer Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/guidelines"
                    className="hover:text-foreground transition-colors"
                  >
                    Author Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@journalhub.com</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 JournalHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
