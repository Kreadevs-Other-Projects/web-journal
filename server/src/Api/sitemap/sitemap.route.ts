import { Router, Request, Response } from "express";
import { pool } from "../../configs/db";

const router = Router();

const ARTICLES_PER_PAGE = 500;

function xmlHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>`;
}

function sitemapUrl(
  loc: string,
  lastmod?: string,
  changefreq?: string,
  priority?: string,
) {
  return [
    `  <url>`,
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function toDateString(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString().split("T")[0];
  return new Date(d).toISOString().split("T")[0];
}

// GET /sitemap.xml — index pointing to sub-sitemaps
router.get("/sitemap.xml", async (_req: Request, res: Response) => {
  const base = (process.env.FRONTEND_URL || "http://localhost:8080").replace(
    /\/+$/,
    "",
  );

  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total FROM papers p
       JOIN publications pub ON pub.paper_id = p.id
       WHERE p.status = 'published'
         AND (p.is_taken_down IS NULL OR p.is_taken_down = false)`,
    );
    const total = parseInt(rows[0]?.total ?? "0", 10);
    const articlePages = Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));

    const articleSitemaps = Array.from(
      { length: articlePages },
      (_, i) =>
        `  <sitemap>\n    <loc>${base}/sitemap-articles-${i + 1}.xml</loc>\n  </sitemap>`,
    ).join("\n");

    const xml = [
      xmlHeader(),
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      `  <sitemap>\n    <loc>${base}/sitemap-pages.xml</loc>\n  </sitemap>`,
      `  <sitemap>\n    <loc>${base}/sitemap-journals.xml</loc>\n  </sitemap>`,
      articleSitemaps,
      `</sitemapindex>`,
    ].join("\n");

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch {
    res.status(500).send("Failed to generate sitemap index");
  }
});

// GET /sitemap-pages.xml — static pages
router.get("/sitemap-pages.xml", (_req: Request, res: Response) => {
  const base = (process.env.FRONTEND_URL || "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
  const today = new Date().toISOString().split("T")[0];

  const pages = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/browse", changefreq: "daily", priority: "0.9" },
    { path: "/archive", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.6" },
    { path: "/faq", changefreq: "monthly", priority: "0.6" },
    { path: "/contact-us", changefreq: "monthly", priority: "0.5" },
    { path: "/apply-reviewer", changefreq: "monthly", priority: "0.5" },
    { path: "/login", changefreq: "monthly", priority: "0.4" },
    { path: "/signup", changefreq: "monthly", priority: "0.4" },
    { path: "/sitemap", changefreq: "weekly", priority: "0.3" },
  ];

  const xml = [
    xmlHeader(),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...pages.map((p) =>
      sitemapUrl(`${base}${p.path}`, today, p.changefreq, p.priority),
    ),
    `</urlset>`,
  ].join("\n");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(xml);
});

// GET /sitemap-journals.xml — all active journals
router.get("/sitemap-journals.xml", async (_req: Request, res: Response) => {
  const base = (process.env.FRONTEND_URL || "http://localhost:8080").replace(
    /\/+$/,
    "",
  );

  try {
    const { rows } = await pool.query(
      `SELECT acronym, updated_at
       FROM journals
       WHERE (status = 'active' OR status IS NULL)
         AND (is_taken_down IS NULL OR is_taken_down = false)
       ORDER BY updated_at DESC`,
    );

    const urls = rows.map((j) =>
      sitemapUrl(
        `${base}/journal/${j.acronym.toLowerCase()}`,
        toDateString(j.updated_at),
        "weekly",
        "0.8",
      ),
    );

    const xml = [
      xmlHeader(),
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join("\n");

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch {
    res.status(500).send("Failed to generate journals sitemap");
  }
});

// GET /sitemap-articles-:page.xml — paginated published articles
router.get(
  "/sitemap-articles-:page.xml",
  async (req: Request, res: Response) => {
    const base = (process.env.FRONTEND_URL || "http://localhost:8080").replace(
      /\/+$/,
      "",
    );
    const page = Math.max(1, parseInt(req.params.page ?? "1", 10));
    const offset = (page - 1) * ARTICLES_PER_PAGE;

    try {
      const { rows } = await pool.query(
        `SELECT j.acronym, pub.url_slug, p.published_at, p.updated_at
       FROM papers p
       JOIN publications pub ON pub.paper_id = p.id
       JOIN journals j ON j.id = p.journal_id
       WHERE p.status = 'published'
         AND (p.is_taken_down IS NULL OR p.is_taken_down = false)
         AND pub.url_slug IS NOT NULL
       ORDER BY COALESCE(p.published_at, p.updated_at) DESC NULLS LAST
       LIMIT $1 OFFSET $2`,
        [ARTICLES_PER_PAGE, offset],
      );

      const urls = rows.map((a) =>
        sitemapUrl(
          `${base}/${a.acronym.toLowerCase()}/${a.url_slug}`,
          toDateString(a.published_at ?? a.updated_at),
          "monthly",
          "0.7",
        ),
      );

      const xml = [
        xmlHeader(),
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
        ...urls,
        `</urlset>`,
      ].join("\n");

      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch {
      res.status(500).send("Failed to generate articles sitemap");
    }
  },
);

// GET /robots.txt
router.get("/robots.txt", (_req: Request, res: Response) => {
  const base = (process.env.FRONTEND_URL || "http://localhost:8080").replace(
    /\/+$/,
    "",
  );

  const content = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Private dashboard areas",
    "Disallow: /author/",
    "Disallow: /reviewer/",
    "Disallow: /sub-editor/",
    "Disallow: /chief-editor/",
    "Disallow: /publisher/",
    "Disallow: /publisher-manager/",
    "Disallow: /owner/",
    "Disallow: /admin/",
    "Disallow: /profile/",
    "Disallow: /complete-profile",
    "Disallow: /accept-invitation",
    "Disallow: /paper-approval/",
    "",
    `Sitemap: ${base}/sitemap.xml`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(content);
});

// GET /google<code>.html — Google Search Console HTML file verification
router.get("/google:code.html", (req: Request, res: Response) => {
  const { code } = req.params;
  res.setHeader("Content-Type", "text/html");
  res.send(`google-site-verification: google${code}.html`);
});

export default router;
