function buildJatsXml(paper: {
  doi: string;
  title: string;
  authors: Array<{ given_name?: string; family_name?: string; name?: string }>;
  journalTitle: string;
  journalAcronym: string;
  issn?: string;
  volume?: string | number;
  issue?: string | number;
  year?: string | number;
  abstract?: string;
  url: string;
}): string {
  const timestamp = Date.now();
  const batchId = `batch_${timestamp}`;
  const depositorEmail =
    process.env.CROSSREF_DEPOSITOR_EMAIL || "admin@gikijournal.edu.pk";
  const depositorName =
    process.env.CROSSREF_DEPOSITOR_NAME || "GIKI Journal";
  const registrant = process.env.CROSSREF_REGISTRANT || "GIKI";

  const authorsXml = paper.authors
    .map((a, i) => {
      const given =
        a.given_name ||
        (a.name ? a.name.split(" ").slice(0, -1).join(" ") : "");
      const family =
        a.family_name ||
        (a.name ? a.name.split(" ").slice(-1)[0] : "");
      const seq = i === 0 ? "first" : "additional";
      return `<person_name sequence="${seq}" contributor_role="author">
        <given_name>${given}</given_name>
        <surname>${family}</surname>
      </person_name>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 https://www.crossref.org/schemas/crossref5.3.1.xsd"
  version="5.3.1">
  <head>
    <doi_batch_id>${batchId}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>${depositorName}</depositor_name>
      <email_address>${depositorEmail}</email_address>
    </depositor>
    <registrant>${registrant}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${paper.journalTitle}</full_title>
        <abbrev_title>${paper.journalAcronym}</abbrev_title>
        ${paper.issn ? `<issn media_type="electronic">${paper.issn}</issn>` : ""}
      </journal_metadata>
      <journal_issue>
        ${paper.volume ? `<volume>${paper.volume}</volume>` : ""}
        ${paper.issue ? `<issue>${paper.issue}</issue>` : ""}
        <publication_date media_type="online">
          <year>${paper.year || new Date().getFullYear()}</year>
        </publication_date>
      </journal_issue>
      <journal_article publication_type="full_text">
        <titles>
          <title>${paper.title}</title>
        </titles>
        <contributors>
          ${authorsXml}
        </contributors>
        <publication_date media_type="online">
          <year>${paper.year || new Date().getFullYear()}</year>
        </publication_date>
        <doi_data>
          <doi>${paper.doi}</doi>
          <resource>${paper.url}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

export async function registerDoiWithCrossref(
  paper: Parameters<typeof buildJatsXml>[0],
): Promise<void> {
  const login = process.env.CROSSREF_LOGIN;
  const password = process.env.CROSSREF_PASSWORD;

  if (!login || !password) {
    console.warn(
      "Crossref credentials not configured — skipping DOI registration",
    );
    return;
  }

  const xml = buildJatsXml(paper);
  const form = new FormData();
  form.append("operation", "doMDUpload");
  form.append("login_id", login);
  form.append("login_passwd", password);
  form.append(
    "fname",
    new Blob([xml], { type: "application/xml" }),
    "deposit.xml",
  );

  const endpoint =
    process.env.NODE_ENV === "production"
      ? "https://doi.crossref.org/servlet/deposit"
      : "https://test.crossref.org/servlet/deposit";

  const res = await fetch(endpoint, { method: "POST", body: form as any });
  if (!res.ok) {
    console.error("Crossref deposit failed:", res.status, await res.text());
  } else {
    console.log("Crossref DOI registered:", paper.doi);
  }
}
