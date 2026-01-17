import { z } from "zod";

export const assignEditorSchema = z.object({
  sub_editor_id: z.string().uuid(),
});
