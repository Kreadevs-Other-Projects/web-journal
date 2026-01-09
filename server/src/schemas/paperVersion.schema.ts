import { z } from "zod";

export const createPaperVersionSchema = z.object({
  paper_id: z.string().uuid(),
  version_label: z.string(),
  file_url: z.string().url(),
});
