import { Request, Response } from "express";

const CROSSREF_BASE = "https://api.crossref.org";

function politeEmail() {
  return process.env.CROSSREF_POLITE_EMAIL || "admin@paperuno.com";
}

function userAgent() {
  return `Paperuno/1.0 (https://paperuno.com; mailto:${politeEmail()})`;
}

// GET /api/crossref/doi?doi=10.1000/xyz123
export async function lookupDOI(req: Request, res: Response) {
  const doi = (req.query.doi as string | undefined)?.trim();
  if (!doi) {
    return res.status(400).json({ success: false, message: "doi query param required" });
  }

  try {
    const response = await fetch(
      `${CROSSREF_BASE}/works/${encodeURIComponent(doi)}`,
      { headers: { "User-Agent": userAgent() } },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ success: false, message: "DOI not found in Crossref database" });
      }
      return res.status(response.status).json({ success: false, message: "Crossref lookup failed" });
    }

    const data = (await response.json()) as any;
    const work = data.message;

    const metadata = {
      title: work.title?.[0] || "",
      abstract: work.abstract
        ? work.abstract.replace(/<[^>]+>/g, "").trim()
        : "",
      authors: (work.author || []).map((a: any) => ({
        name: [a.given, a.family].filter(Boolean).join(" "),
        affiliation: a.affiliation?.[0]?.name || "",
        orcid: (a.ORCID || "")
          .replace("http://orcid.org/", "")
          .replace("https://orcid.org/", ""),
      })),
      journal: work["container-title"]?.[0] || "",
      issn: work.ISSN?.[0] || "",
      volume: work.volume || "",
      issue: work.issue || "",
      year:
        work.published?.["date-parts"]?.[0]?.[0] ||
        work["published-print"]?.["date-parts"]?.[0]?.[0] ||
        work["published-online"]?.["date-parts"]?.[0]?.[0] ||
        null,
      doi: work.DOI || doi,
      url: work.URL || `https://doi.org/${doi}`,
      publisher: work.publisher || "",
      type: work.type || "",
      keywords: work.subject || [],
      references_count: work["references-count"] || 0,
      citations_count: work["is-referenced-by-count"] || 0,
      license: work.license?.[0]?.URL || "",
      pages: work.page || "",
      language: work.language || "en",
    };

    return res.json({ success: true, metadata });
  } catch (err: any) {
    console.error("Crossref DOI lookup error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to reach Crossref API" });
  }
}

// GET /api/crossref/journal/:issn
export async function lookupJournal(req: Request, res: Response) {
  const raw = req.params.issn.replace(/[^0-9Xx]/gi, "").toUpperCase();
  if (raw.length !== 8) {
    return res.status(400).json({ success: false, message: "ISSN must be 8 digits (XXXX-XXXX)" });
  }
  const formattedISSN = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;

  try {
    const response = await fetch(
      `${CROSSREF_BASE}/journals/${formattedISSN}`,
      { headers: { "User-Agent": userAgent() } },
    );

    if (!response.ok) {
      return res.status(404).json({ success: false, message: "Journal not found in Crossref" });
    }

    const data = (await response.json()) as any;
    const journal = data.message;

    return res.json({
      success: true,
      journal: {
        title: journal.title || "",
        publisher: journal.publisher || "",
        issn: journal.ISSN || [],
        subjects: (journal.subjects || []).map((s: any) => s.name),
        counts: journal.counts || {},
        coverage: journal.coverage || {},
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Crossref request failed" });
  }
}

// GET /api/crossref/citations?doi=10.1000/xyz123
export async function getCitations(req: Request, res: Response) {
  const doi = (req.query.doi as string | undefined)?.trim();
  if (!doi) {
    return res.json({ success: true, citations: 0 });
  }

  try {
    const response = await fetch(
      `${CROSSREF_BASE}/works/${encodeURIComponent(doi)}?select=DOI,is-referenced-by-count,title`,
      { headers: { "User-Agent": userAgent() } },
    );

    if (!response.ok) {
      return res.json({ success: true, citations: 0 });
    }

    const data = (await response.json()) as any;
    return res.json({
      success: true,
      citations: data.message?.["is-referenced-by-count"] || 0,
      doi: data.message?.DOI || doi,
    });
  } catch {
    return res.json({ success: true, citations: 0 });
  }
}
