import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Share2, Calendar, BookOpen, Tag, Hash } from "lucide-react";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface ArticleData {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author_names: string[];
  corresponding_authors?: string[];
  paper_references?: { text: string; link?: string }[];
  submitted_at: string;
  published_at?: string;
  publication_date?: string;
  author_username: string;
  journal_id: string;
  journal_title: string;
  issn?: string;
  volume?: number;
  issue?: number;
  year?: number;
  issue_label?: string;
  doi?: string;
  file_url?: string;
  html_content?: string;
  status: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArticlePage() {
  const { paperId } = useParams<{ paperId: string }>();
  const { toast } = useToast();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => {
    fetch(`${url}/browse/paper/${paperId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setArticle(data.paper);
          if (data.paper?.html_content) {
            setHtmlContent(data.paper.html_content);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [paperId]);

  // Option B: fetch HTML on-demand for papers without cached html_content
  useEffect(() => {
    if (!article || htmlContent !== null) return;
    if (!article.file_url || !article.file_url.endsWith(".docx")) return;
    setHtmlLoading(true);
    fetch(`${url}/browse/paper/${paperId}/html`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.html) setHtmlContent(data.html);
      })
      .catch(() => {})
      .finally(() => setHtmlLoading(false));
  }, [article, paperId, htmlContent]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Article URL copied to clipboard." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground text-lg">Article not found.</p>
          <Button asChild variant="outline">
            <Link to="/browse">Browse Journals</Link>
          </Button>
        </div>
      </div>
    );
  }

  const authors = article.author_names?.length
    ? article.author_names.join(", ")
    : article.author_username || "Unknown";

  const volumeIssue = article.issue_label
    || (article.volume && article.issue
      ? `Vol. ${article.volume}, No. ${article.issue} (${article.year})`
      : null);

  const publishedDate = article.publication_date || article.published_at;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* HEADER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/journal/${article.journal_id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {article.journal_title}
                </Link>
                {volumeIssue && (
                  <span className="text-sm text-muted-foreground">· {volumeIssue}</span>
                )}
                <Badge variant="secondary" className="text-xs">Research Article</Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {article.title}
              </h1>

              <div className="text-base text-muted-foreground">
                <span className="font-medium text-foreground">{authors}</span>
              </div>

              {article.corresponding_authors?.length ? (
                <p className="text-sm text-muted-foreground">
                  Corresponding author(s): {article.corresponding_authors.join(", ")}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {publishedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Published {formatDate(publishedDate)}
                  </span>
                )}
                {article.journal_title && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {article.journal_title}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* METADATA BAR */}
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3">
                {article.doi && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">DOI:</span>
                    <a
                      href={`https://doi.org/${article.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      https://doi.org/{article.doi}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">CC BY 4.0</Badge>
                  <span className="text-xs text-muted-foreground">Open Access</span>
                </div>

                {article.keywords?.length ? (
                  <div className="flex items-start gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    {article.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex gap-2 pt-1">
                  {article.file_url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(`${url}${article.file_url}`, "_blank")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ABSTRACT */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Abstract</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {article.abstract || "No abstract available."}
              </p>
            </section>

            {/* FULL TEXT */}
            <Separator />
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Full Text</h2>
              {htmlLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading full text…
                </div>
              ) : htmlContent ? (
                <div
                  className="paper-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                />
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-6 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Full text is not available for web viewing
                    {article.file_url?.endsWith(".tex") ? " (.tex files cannot be rendered inline)" : ""}.
                  </p>
                  {article.file_url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(`${url}${article.file_url}`, "_blank")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Manuscript
                    </Button>
                  )}
                </div>
              )}
            </section>

            {/* REFERENCES */}
            {article.paper_references && Array.isArray(article.paper_references) && article.paper_references.length > 0 && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h2 className="text-xl font-semibold text-foreground">References</h2>
                  <ol className="space-y-2">
                    {article.paper_references.map((ref, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0 font-medium text-foreground">[{i + 1}]</span>
                        <span>
                          {ref.text}
                          {ref.link && (
                            <>
                              {" "}
                              <a
                                href={ref.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                [link]
                              </a>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}

            {/* BOTTOM DOWNLOAD */}
            {article.file_url && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => window.open(`${url}${article.file_url}`, "_blank")}
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download Full Manuscript
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
