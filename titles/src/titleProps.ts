import { z } from "zod";

export const titleSchema = z.object({
  lines: z.array(z.string()),
  sub: z.string(),
  theme: z.enum(["noir", "ember", "ice", "paper"]),
  exit: z.boolean(),
  delay: z.number().min(0),
  guides: z.boolean(),
});

export type TitleProps = z.infer<typeof titleSchema>;
