import { z } from "zod";

export const createPaperVersionSchema = z.object({
  version_label: z.string().min(1, "Version label is required"),
  file_url: z.string().url("Invalid file URL"),
});
