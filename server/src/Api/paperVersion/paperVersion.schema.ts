import { z } from "zod";

export const createPaperVersionSchema = z.object({
  body: z.object({
    version_label: z.string().min(1, "Version label is required"),
  }),
});
