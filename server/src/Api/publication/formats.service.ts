import fs from "fs";
import path from "path";
import { pool } from "../../configs/db";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const generateFormatsService = async (paperId: string, publicationId: string) => {
  // Fetch all needed data
  const result = await pool.query(
    `SELECT p.title, p.abstract, p.author_names, p.keywords, p.paper_references,
            pv.html_content, pv.file_url,
            j.title as journal_title, j.issn,
            ji.volume, ji.issue, ji.year,
            pub.doi, pub.published_at, pub.article_index
     FROM papers p
     LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
     LEFT JOIN journals j ON j.id = p.journal_id
     LEFT JOIN journal_issues ji ON ji.id = p.issue_id
     LEFT JOIN publications pub ON pub.paper_id = p.id
     WHERE p.id = $1`,
    [paperId],
  );
  if (!result.rows.length) return;

  const d = result.rows[0];
  const uploadsBase = path.join(process.cwd(), "uploads");

  // 1. HTML FORMAT
  const htmlDir = path.join(uploadsBase, "html");
  ensureDir(htmlDir);
  const htmlFilePath = path.join(htmlDir, `${paperId}.html`);

  const authors = Array.isArray(d.author_names) ? d.author_names.join(", ") : "";
  let refs: any[] = [];
  try { refs = typeof d.paper_references === "string" ? JSON.parse(d.paper_references) : (d.paper_references || []); } catch {}

  const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${d.title || "Article"}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8;color:#222;}
h1{font-size:1.6em;line-height:1.3;}
.meta{color:#555;font-size:.9em;margin:16px 0;}
.abstract{background:#f9f9f9;border-left:4px solid #ccc;padding:16px 20px;margin:20px 0;}
.body-content p{margin:0 0 1em;}
.references ol{padding-left:1.5em;}
</style>
</head>
<body>
<h1>${d.title || ""}</h1>
<div class="meta">
  <strong>Authors:</strong> ${authors}<br/>
  <strong>Journal:</strong> ${d.journal_title || ""} (ISSN: ${d.issn || ""})<br/>
  <strong>Volume:</strong> ${d.volume || ""}, <strong>Issue:</strong> ${d.issue || ""}, <strong>Year:</strong> ${d.year || ""}<br/>
  ${d.doi ? `<strong>DOI:</strong> ${d.doi}<br/>` : ""}
  <strong>Published:</strong> ${d.published_at ? new Date(d.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
</div>
<div class="abstract"><strong>Abstract</strong><p>${d.abstract || ""}</p></div>
<div class="body-content">${d.html_content || "<p>Full text not available.</p>"}</div>
${refs.length > 0 ? `<div class="references"><h2>References</h2><ol>${refs.map((r: any) => `<li>${r.text || r}${r.link ? ` <a href="${r.link}">${r.link}</a>` : ""}</li>`).join("")}</ol></div>` : ""}
</body>
</html>`;

  fs.writeFileSync(htmlFilePath, standaloneHtml, "utf8");
  const html_url = `/uploads/html/${paperId}.html`;

  // 2. XML FORMAT (JATS)
  const xmlDir = path.join(uploadsBase, "xml");
  ensureDir(xmlDir);
  const xmlFilePath = path.join(xmlDir, `${paperId}.xml`);

  const escapeXml = (s: string) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const authorContribs = Array.isArray(d.author_names)
    ? d.author_names.map((a: string) => {
        const parts = a.trim().split(" ");
        const given = parts.slice(0, -1).join(" ");
        const surname = parts[parts.length - 1] || a;
        return `<contrib contrib-type="author"><name><surname>${escapeXml(surname)}</surname><given-names>${escapeXml(given)}</given-names></name></contrib>`;
      }).join("\n")
    : "";

  const jatsXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Article Tag Suite 1.0//EN" "JATS-archivearticle1.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article">
  <front>
    <journal-meta>
      <journal-title-group><journal-title>${escapeXml(d.journal_title || "")}</journal-title></journal-title-group>
      ${d.issn ? `<issn pub-type="ppub">${escapeXml(d.issn)}</issn>` : ""}
    </journal-meta>
    <article-meta>
      <title-group><article-title>${escapeXml(d.title || "")}</article-title></title-group>
      <contrib-group>${authorContribs}</contrib-group>
      ${d.doi ? `<article-id pub-id-type="doi">${escapeXml(d.doi)}</article-id>` : ""}
      <volume>${d.volume || ""}</volume>
      <issue>${d.issue || ""}</issue>
      ${d.published_at ? `<pub-date><year>${new Date(d.published_at).getFullYear()}</year></pub-date>` : ""}
      <abstract><p>${escapeXml(d.abstract || "")}</p></abstract>
      ${Array.isArray(d.keywords) && d.keywords.length > 0
        ? `<kwd-group kwd-group-type="author">${d.keywords.map((k: string) => `<kwd>${escapeXml(k)}</kwd>`).join("")}</kwd-group>`
        : ""}
    </article-meta>
  </front>
  <body><sec><p>${escapeXml((d.html_content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())}</p></sec></body>
  ${refs.length > 0
    ? `<back><ref-list>${refs.map((r: any, i: number) =>
        `<ref id="r${i + 1}"><label>${i + 1}</label><mixed-citation>${escapeXml(r.text || r)}</mixed-citation></ref>`
      ).join("")}</ref-list></back>`
    : ""}
</article>`;

  fs.writeFileSync(xmlFilePath, jatsXml, "utf8");
  const xml_url = `/uploads/xml/${paperId}.xml`;

  // 3. PDF FORMAT (puppeteer, non-fatal if unavailable)
  let pdf_url: string | null = null;
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(standaloneHtml, { waitUntil: "networkidle0" });
    const pdfDir = path.join(uploadsBase, "pdf");
    ensureDir(pdfDir);
    const pdfFilePath = path.join(pdfDir, `${paperId}.pdf`);
    await page.pdf({ path: pdfFilePath, format: "A4", margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" } });
    await browser.close();
    pdf_url = `/uploads/pdf/${paperId}.pdf`;
  } catch {
    // puppeteer not available or failed — non-fatal
  }

  // Save URLs to publications table
  await pool.query(
    `UPDATE publications SET html_url = $1, pdf_url = $2, xml_url = $3 WHERE id = $4`,
    [html_url, pdf_url, xml_url, publicationId],
  );
};
