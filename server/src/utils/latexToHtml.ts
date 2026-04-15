import fs from "fs";

export function extractLatexToHtml(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return convertLatexToHtml(content);
  } catch (err) {
    console.error("LaTeX read error:", err);
    return "<p>Could not read LaTeX file.</p>";
  }
}

export function convertLatexToHtml(latex: string): string {
  let html = latex;

  // Remove preamble (everything before \begin{document})
  const docStart = html.indexOf("\\begin{document}");
  if (docStart !== -1) {
    html = html.slice(docStart + "\\begin{document}".length);
  }

  // Remove \end{document}
  html = html.replace(/\\end\{document\}/g, "");

  // Remove comments
  html = html.replace(/%[^\n]*/g, "");

  // Sections and headings
  html = html.replace(/\\section\*?\{([^}]+)\}/g, "<h2>$1</h2>");
  html = html.replace(/\\subsection\*?\{([^}]+)\}/g, "<h3>$1</h3>");
  html = html.replace(/\\subsubsection\*?\{([^}]+)\}/g, "<h4>$1</h4>");
  html = html.replace(/\\paragraph\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\title\{([^}]+)\}/g, "<h1>$1</h1>");
  html = html.replace(/\\author\{([^}]+)\}/g, "<p><em>$1</em></p>");
  html = html.replace(/\\date\{([^}]+)\}/g, "<p>$1</p>");
  html = html.replace(/\\maketitle/g, "");

  // Abstract
  html = html.replace(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
    '<div class="abstract"><h3>Abstract</h3><p>$1</p></div>',
  );

  // Text formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>");
  html = html.replace(/\\texttt\{([^}]+)\}/g, "<code>$1</code>");

  // Lists
  html = html.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_match, content) => {
      const items = content.split("\\item").filter((s: string) => s.trim());
      return (
        "<ul>" +
        items.map((i: string) => `<li>${i.trim()}</li>`).join("") +
        "</ul>"
      );
    },
  );
  html = html.replace(
    /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_match, content) => {
      const items = content.split("\\item").filter((s: string) => s.trim());
      return (
        "<ol>" +
        items.map((i: string) => `<li>${i.trim()}</li>`).join("") +
        "</ol>"
      );
    },
  );

  // Equations — show as code blocks
  html = html.replace(/\$\$([^$]+)\$\$/g, '<pre class="equation">$1</pre>');
  html = html.replace(/\$([^$]+)\$/g, '<code class="inline-eq">$1</code>');
  html = html.replace(
    /\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g,
    '<pre class="equation">$1</pre>',
  );
  html = html.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    '<pre class="equation">$1</pre>',
  );

  // Figure captions
  html = html.replace(
    /\\begin\{figure\}[\s\S]*?\\caption\{([^}]+)\}[\s\S]*?\\end\{figure\}/g,
    "<figure><figcaption>Figure: $1</figcaption></figure>",
  );

  // Tables — basic
  html = html.replace(
    /\\begin\{table\}[\s\S]*?\\caption\{([^}]+)\}[\s\S]*?\\end\{table\}/g,
    "<p><em>Table: $1</em></p>",
  );

  // References
  html = html.replace(/\\cite\{([^}]+)\}/g, "<sup>[$1]</sup>");
  html = html.replace(/\\ref\{([^}]+)\}/g, '<a href="#$1">[$1]</a>');
  html = html.replace(/\\label\{([^}]+)\}/g, '<span id="$1"></span>');

  // Bibliography
  html = html.replace(
    /\\begin\{thebibliography\}[^\n]*\n([\s\S]*?)\\end\{thebibliography\}/g,
    (_match, content) => {
      const items = content
        .split("\\bibitem")
        .filter((s: string) => s.trim());
      return (
        "<h2>References</h2><ol>" +
        items
          .map(
            (i: string) =>
              `<li>${i.replace(/\{[^}]+\}/, "").trim()}</li>`,
          )
          .join("") +
        "</ol>"
      );
    },
  );

  // Cleanup remaining LaTeX commands
  html = html.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  html = html.replace(/\\[a-zA-Z]+/g, "");
  html = html.replace(/\{|\}/g, "");

  // Convert double newlines to paragraphs
  const paragraphs = html.split(/\n\n+/).filter((p) => p.trim());
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<figure")
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return (
    html ||
    "<p>No content could be extracted from this LaTeX file.</p>"
  );
}
