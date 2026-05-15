import { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";
import * as service from "./reviewer.service";
import { AuthUser } from "../../middlewares/auth.middleware";
import { uploadBufferToSupabase } from "../../utils/uploadToSupabase";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "span", "div",
  "sup", "sub",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  span: ["style"],
  p: ["style"],
  div: ["style"],
  "*": ["class"],
};

function sanitizeReviewHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        color: [/^#[0-9a-f]{3,6}$/i],
      },
    },
  });
}

export const getReviewerPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchReviewerPapers(req.user!.id);
  res.json({ success: true, papers });
};

export const submitReview = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { decision, password } = req.body;

    const comments = sanitizeReviewHtml(req.body.comments || "");
    const confidentialComments = req.body.confidentialComments
      ? sanitizeReviewHtml(req.body.confidentialComments)
      : undefined;

    let signatureUrl: string | undefined;
    if (req.file) {
      const uploaded = await uploadBufferToSupabase(req.file.buffer, "other", req.file.originalname);
      signatureUrl = uploaded.url;
    }

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
      password,
      signatureUrl,
      confidentialComments,
    );

    res.json({ success: true, data: review });
  } catch (error: any) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
