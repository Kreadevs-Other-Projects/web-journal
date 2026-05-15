import { z } from "zod";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export const zSubmitReviewSchema = z.object({
  body: z.object({
    decision: z.enum([
      "accepted",
      "minor_revision",
      "major_revision",
      "rejected",
    ]),
    comments: z.string().refine(
      (val) => stripHtml(val).length >= 5,
      { message: "Comments must be at least 5 characters" },
    ),
    confidentialComments: z.string().optional(),
    password: z.string().optional(),
  }),
});
