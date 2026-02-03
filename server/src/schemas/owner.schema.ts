import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username too short"),
    email: z.string().email("Invalid email"),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
