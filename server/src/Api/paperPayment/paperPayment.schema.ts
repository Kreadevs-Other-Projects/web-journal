import { z } from "zod";

export const payPaperPaymentSchema = z.object({
  body: z.object({
    transaction_ref: z.string().min(3),
  }),
});
