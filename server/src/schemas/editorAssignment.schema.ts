import { z } from "zod";

export const assignEditorSchema = z.object({
  body: z.object({
    sub_editor_id: z
      .string()
      .uuid({ message: "A valid sub-editor ID is required" }),
  }),
});

export const assignReviewerSchema = z.object({
  body: z.object({
    reviewer_id: z
      .string()
      .uuid({ message: "A valid reviewer ID is required" }),
  }),
});
